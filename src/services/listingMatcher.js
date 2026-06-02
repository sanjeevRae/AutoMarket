import admin from "firebase-admin";
import { env } from "../config/env.js";
import { filters } from "../config/filters.js";

export function matchListing(rawListing) {
  const normalizedTitle = normalize(rawListing.title);
  const normalizedLocation = normalize(rawListing.location);

  for (const category of filters.categories) {
    const matchedKeywords = category.keywords.filter((keyword) => hasKeyword(normalizedTitle, keyword));
    if (matchedKeywords.length === 0) continue;

    if (rawListing.price && rawListing.price < category.minPrice) continue;
    if (rawListing.price && rawListing.price > category.maxPrice) continue;

    return {
      ...rawListing,
      category: category.id,
      categoryLabel: category.label,
      matchedKeywords,
      searchTokens: buildSearchTokens(rawListing.title, rawListing.location, category.label),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + env.RETENTION_DAYS * 24 * 60 * 60 * 1000),
      normalizedTitle,
      normalizedLocation,
      source: "facebook_marketplace",
      isActive: true
    };
  }

  return null;
}

function normalize(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function hasKeyword(normalizedTitle, keyword) {
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword) return false;

  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`, "i").test(normalizedTitle);
}

function buildSearchTokens(...values) {
  return [
    ...new Set(
      values
        .join(" ")
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 2)
    )
  ];
}
