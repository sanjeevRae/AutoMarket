import { env } from "../config/env.js";
import { createFacebookPage } from "./facebookBrowser.js";

export async function scrapeFacebookMarketplace({ cityUrl, maxItems = env.SCRAPE_MAX_ITEMS }) {
  const { browser, page } = await createFacebookPage({
    viewport: { width: 1365, height: 900 }
  });

  try {
    await page.goto(cityUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(5000);
    await loadMoreListings(page);

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
