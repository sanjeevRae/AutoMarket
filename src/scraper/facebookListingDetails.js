import { chromium } from "playwright";
import { env } from "../config/env.js";
import { findPostedAtLabel, parsePostedAt } from "./facebookMarketplace.js";

export async function scrapeFacebookListingDetails(listingUrl) {
  if (!listingUrl) return {};

  const browser = await chromium.launch({ headless: env.SCRAPE_HEADLESS });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
  });

  try {
    await page.goto(listingUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2500);

    const bodyText = await page.locator("body").innerText({ timeout: 5000 });
    const lines = bodyText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const postedAtLabel = findPostedAtLabel(lines);
    const postedAt = parsePostedAt(postedAtLabel);

    return {
      postedAt,
      postedAtLabel,
      detailSampleLines: getUsefulSampleLines(lines),
      detailScrapedAt: new Date().toISOString()
    };
  } finally {
    await browser.close();
  }
}

function getUsefulSampleLines(lines) {
  const useful = lines.filter((line) =>
    /\b(listed|ago|today|yesterday|minute|hour|day|week|month|year|marketplace|log in|login|sign up)\b/i.test(line)
  );

  return (useful.length > 0 ? useful : lines).slice(0, 20);
}
