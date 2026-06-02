import "dotenv/config";
import { z } from "zod";

const emptyToUndefined = (value) => (value === "" ? undefined : value);

const schema = z.object({
  FIREBASE_PROJECT_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  FIREBASE_CLIENT_EMAIL: z.preprocess(emptyToUndefined, z.string().optional()),
  FIREBASE_PRIVATE_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  CLOUDINARY_CLOUD_NAME: z.preprocess(emptyToUndefined, z.string().optional()),
  CLOUDINARY_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  CLOUDINARY_API_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  MARKETPLACE_CITY_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("https://www.facebook.com/marketplace/106085869430478/iphones/")
  ),
  MARKETPLACE_URLS: z.preprocess(emptyToUndefined, z.string().optional()),
  MARKETPLACE_MAX_TARGETS: z
    .string()
    .default("30")
    .transform((value) => Number.parseInt(value, 10)),
  SCRAPE_HEADLESS: z
    .string()
    .default("true")
    .transform((value) => value === "true"),
  SCRAPE_MAX_ITEMS: z
    .string()
    .default("40")
    .transform((value) => Number.parseInt(value, 10)),
  SCRAPE_DRY_RUN: z
    .string()
    .default("true")
    .transform((value) => value === "true"),
  SCRAPE_SOURCE: z.enum(["facebook", "mock"]).default("facebook"),
  SCRAPE_DEBUG: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
  RETENTION_DAYS: z
    .string()
    .default("30")
    .transform((value) => Number.parseInt(value, 10)),
  FCM_TOKENS: z.preprocess(emptyToUndefined, z.string().optional())
});

export const env = schema.parse(process.env);

export function requireProductionSecrets() {
  const missing = [
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
  ].filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required secrets: ${missing.join(", ")}`);
  }
}
