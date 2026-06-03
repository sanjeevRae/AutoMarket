import { chromium } from "playwright";
import { env } from "../config/env.js";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";

export async function createFacebookPage({ viewport }) {
  const browser = await chromium.launch({ headless: env.SCRAPE_HEADLESS });
  const context = await browser.newContext({
    viewport,
    userAgent: USER_AGENT
  });

  await addFacebookCookies(context);

  return {
    browser,
    page: await context.newPage()
  };
}

async function addFacebookCookies(context) {
  if (!env.FACEBOOK_COOKIES_JSON) return;

  let cookies;

  try {
    cookies = JSON.parse(env.FACEBOOK_COOKIES_JSON);
  } catch (error) {
    throw new Error(`FACEBOOK_COOKIES_JSON is not valid JSON: ${error.message}`);
  }

  if (!Array.isArray(cookies)) {
    throw new Error("FACEBOOK_COOKIES_JSON must be a JSON array of browser cookies.");
  }

  await context.addCookies(cookies.map(normalizeCookie));
}

function normalizeCookie(cookie) {
  return {
    name: cookie.name,
    value: cookie.value,
    domain: cookie.domain || ".facebook.com",
    path: cookie.path || "/",
    expires: cookie.expirationDate || cookie.expires || -1,
    httpOnly: Boolean(cookie.httpOnly),
    secure: cookie.secure !== false,
    sameSite: normalizeSameSite(cookie.sameSite)
  };
}

function normalizeSameSite(value) {
  if (value === "Strict" || value === "Lax" || value === "None") return value;
  if (value === "no_restriction") return "None";
  if (value === "strict") return "Strict";
  if (value === "lax") return "Lax";
  return "Lax";
}
