import { chromium } from "playwright";
import { env } from "../config/env.js";

export async function scrapeFacebookMarketplace({ cityUrl, maxItems = env.SCRAPE_MAX_ITEMS }) {
  const browser = await chromium.launch({ headless: env.SCRAPE_HEADLESS });
  const page = await browser.newPage({
    viewport: { width: 1365, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
  });

  try {
    await page.goto(cityUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(5000);

    const items = await page.evaluate((limit) => {
      const anchors = [...document.querySelectorAll('a[href*="/marketplace/item/"]')];
      return anchors.slice(0, limit).map((anchor) => {
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

function normalizeRawItem(raw) {
  const lines = raw.text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const priceLine = lines.find((line) => /[$रूRs]/i.test(line));
  const title = lines.find((line) => line !== priceLine) || lines[0] || "";
  const location = lines.at(-1) || "";
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
