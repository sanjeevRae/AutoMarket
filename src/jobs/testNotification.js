import { requireProductionSecrets } from "../config/env.js";
import { sendListingNotification } from "../notifications/fcm.js";

async function main() {
  requireProductionSecrets();

  const timestamp = new Date().toISOString();
  const listing = {
    sourceId: `test_${Date.now()}`,
    title: "AutoMarket test notification",
    category: "test",
    categoryLabel: "Test",
    priceLabel: "Rs 12,345",
    location: "Kathmandu",
    marketplaceUrl: "https://example.com/test-listing",
    originalImageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
    postedAt: timestamp,
    postedAtLabel: "just now",
    matchedKeywords: ["test", "notification"]
  };

  console.log("[notify:test] sending test notification", {
    sourceId: listing.sourceId,
    title: listing.title,
    url: listing.marketplaceUrl
  });

  const result = await sendListingNotification(listing);

  console.log("[notify:test] complete", {
    successCount: result.successCount || 0,
    failureCount: result.failureCount || 0
  });
}

main().catch((error) => {
  console.error("[notify:test] failed", error);
  process.exitCode = 1;
});