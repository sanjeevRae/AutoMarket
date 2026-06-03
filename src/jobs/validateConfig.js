import { env } from "../config/env.js";

const publicConfig = {
  projectId: env.FIREBASE_PROJECT_ID || "(missing)",
  marketplaceCityUrl: env.MARKETPLACE_CITY_URL,
  marketplaceUrls: env.MARKETPLACE_URLS ? env.MARKETPLACE_URLS.split(";").filter(Boolean).length : 0,
  marketplaceMaxTargets: env.MARKETPLACE_MAX_TARGETS,
  marketplaceTargetOffset: env.MARKETPLACE_TARGET_OFFSET,
  marketplaceTargetMode: env.MARKETPLACE_TARGET_MODE,
  scrapeHeadless: env.SCRAPE_HEADLESS,
  scrapeMaxItems: env.SCRAPE_MAX_ITEMS,
  scrapeScrollSteps: env.SCRAPE_SCROLL_STEPS,
  scrapeDryRun: env.SCRAPE_DRY_RUN,
  scrapeSource: env.SCRAPE_SOURCE,
  scrapeDebug: env.SCRAPE_DEBUG,
  scrapeDetailDates: env.SCRAPE_DETAIL_DATES,
  retentionDays: env.RETENTION_DAYS,
  hasFirebaseClientEmail: Boolean(env.FIREBASE_CLIENT_EMAIL),
  hasFirebasePrivateKey: Boolean(env.FIREBASE_PRIVATE_KEY),
  hasCloudinaryCloudName: Boolean(env.CLOUDINARY_CLOUD_NAME),
  hasCloudinaryApiKey: Boolean(env.CLOUDINARY_API_KEY),
  hasCloudinaryApiSecret: Boolean(env.CLOUDINARY_API_SECRET)
};

console.log(JSON.stringify(publicConfig, null, 2));
