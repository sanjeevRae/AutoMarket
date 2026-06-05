import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { createFacebookPage } from "./facebookBrowser.js";

export async function scrapeFacebookMarketplace({ cityUrl, maxItems = env.SCRAPE_MAX_ITEMS }) {
  const { browser, page } = await createFacebookPage({
    viewport: { width: 1365, height: 900 }
  });

  try {
    await page.goto(cityUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(5000);
    await dismissMarketplacePopups(page);
    await loadMoreListings(page);

    const diagnostics = await collectPageDiagnostics(page);
    if (env.SCRAPE_DEBUG || diagnostics.anchorCount === 0 || diagnostics.looksBlocked) {
      console.log("[marketplace] diagnostics", diagnostics);
    }

    if (diagnostics.anchorCount === 0 || diagnostics.looksBlocked) {
      await writeMarketplaceArtifacts(page, diagnostics).catch((error) => {
        console.warn(`[marketplace] failed to write debug artifacts: ${error.message}`);
      });
    }

    const items = await page.evaluate((limit) => {
      const anchors = [...document.querySelectorAll('a[href*="/marketplace/item/"]')];
      const seen = new Set();

      return anchors
        .filter((anchor) => {
          const match = anchor.href.match(/marketplace\/item\/(\d+)/);
          const key = match ? match[1] : anchor.href;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, limit)
        .map((anchor) => {
          const text = anchor.innerText || "";
          const href = anchor.href;
          const image = anchor.querySelector("img")?.src || null;
          return { text, href, image };
        });
    }, maxItems);

    if (items.length === 0) {
      console.warn(`[marketplace] no item anchors found for ${cityUrl}`);
    }

    return items.map(normalizeRawItem).filter((item) => item.title && item.marketplaceUrl);
  } finally {
    await browser.close();
  }
}

async function loadMoreListings(page) {
  for (let index = 0; index < env.SCRAPE_SCROLL_STEPS; index += 1) {
    await page.mouse.wheel(0, 1800);
    await page.waitForTimeout(1500);
  }
}

async function dismissMarketplacePopups(page) {
  const buttonTexts = ["Not now", "Close", "Dismiss", "Allow all cookies", "Accept all"];

  for (const text of buttonTexts) {
    const button = page.getByRole("button", { name: text }).first();
    if ((await button.count().catch(() => 0)) === 0) continue;

    await button.click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(500);
  }
}

async function collectPageDiagnostics(page) {
  const title = await page.title().catch(() => "");
  const currentUrl = page.url();
  const summary = await page.evaluate(() => {
    const bodyText = document.body?.innerText || "";
    const normalizedBody = bodyText.toLowerCase();
    const anchors = [...document.querySelectorAll('a[href*="/marketplace/item/"]')];

    return {
      anchorCount: anchors.length,
      bodySnippet: bodyText.slice(0, 500),
      looksBlocked:
        normalizedBody.includes("log in") ||
        normalizedBody.includes("login") ||
        normalizedBody.includes("sign up") ||
        normalizedBody.includes("see more on facebook") ||
        normalizedBody.includes("please log in")
    };
  });

  return {
    title,
    url: currentUrl,
    ...summary
  };
}

async function writeMarketplaceArtifacts(page, diagnostics) {
  const outputDir = process.env.SCRAPE_ARTIFACTS_DIR || "artifacts/marketplace";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeName = createSafeFileName(diagnostics.url || diagnostics.title || "marketplace");
  const basePath = path.join(outputDir, `${stamp}-${safeName}`);

  await fs.mkdir(outputDir, { recursive: true });
  await page.screenshot({ path: `${basePath}.png`, fullPage: true }).catch(() => {});

  const html = await page.content().catch(() => "");
  await fs.writeFile(`${basePath}.html`, html, "utf8");
  await fs.writeFile(`${basePath}.json`, JSON.stringify(diagnostics, null, 2), "utf8");

  console.warn(`[marketplace] debug artifacts written: ${basePath}.{png,html,json}`);
}

function createSafeFileName(value) {
  return String(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeRawItem(raw) {
  const lines = raw.text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const priceLine = lines.find((line) => /[$रूRs]/i.test(line));
  const title = lines.find((line) => line !== priceLine) || lines[0] || "";
  const location = lines.at(-1) || "";
  const postedAtLabel = findPostedAtLabel(lines);
  const postedAt = parsePostedAt(postedAtLabel);
  const facebookItemId = extractMarketplaceItemId(raw.href);
  const sourceId = facebookItemId
    ? `facebook_${facebookItemId}`
    : `facebook_${Buffer.from(raw.href).toString("base64url").slice(0, 32)}`;

  return {
    sourceId,
    facebookItemId,
    title,
    price: parsePrice(priceLine),
    priceLabel: priceLine || "",
    location,
    postedAt,
    postedAtLabel,
    marketplaceUrl: facebookItemId ? `https://www.facebook.com/marketplace/item/${facebookItemId}/` : raw.href,
    originalImageUrl: raw.image
  };
}

function extractMarketplaceItemId(url) {
  const match = url.match(/marketplace\/item\/(\d+)/);
  return match ? match[1] : null;
}

function parsePrice(value = "") {
  const match = value.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function findPostedAtLabel(lines) {
  return (
    lines.find((line) =>
      /\blisted\b/i.test(line) &&
      /\b(just now|today|yesterday|minute|hour|day|week|month|year|ago|on)\b/i.test(line)
    ) ||
    lines.find((line) =>
      /(^|\b)(just now|today|yesterday|minute|hour|day|week|month|year|listed|ago)(\b|$)/i.test(line)
    ) || null
  );
}

export function parsePostedAt(label) {
  if (!label) return null;

  const normalized = label.toLowerCase();
  const now = Date.now();

  if (/\bjust now\b/.test(normalized)) return new Date(now).toISOString();
  if (/\btoday\b/.test(normalized)) return new Date(now).toISOString();
  if (/\byesterday\b/.test(normalized)) return new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const amountMatch = normalized.match(/(?:about|over|approximately)?\s*(\d+|a|an)\s+(minute|hour|day|week|month|year)s?\s+ago/);
  if (!amountMatch) return null;

  const amount = amountMatch[1] === "a" || amountMatch[1] === "an" ? 1 : Number(amountMatch[1]);
  const unit = amountMatch[2];
  const multipliers = {
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000
  };

  return new Date(now - amount * multipliers[unit]).toISOString();
}
