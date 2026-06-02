import { env } from "../config/env.js";
import { getDb, getMessaging } from "../firebase/admin.js";

export async function getNotificationTokens() {
  const manualTokens = env.FCM_TOKENS
    ? env.FCM_TOKENS.split(",")
        .map((token) => token.trim())
        .filter(Boolean)
    : [];

  const snapshot = await getDb().collection("devices").where("enabled", "==", true).get();
  const firestoreTokens = snapshot.docs.map((doc) => doc.data().token).filter(Boolean);

  return [...new Set([...manualTokens, ...firestoreTokens])];
}

export async function sendListingNotification(listing) {
  const tokens = await getNotificationTokens();
  if (tokens.length === 0) return { successCount: 0, failureCount: 0 };

  const response = await getMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: `New ${listing.categoryLabel || "deal"}: ${listing.title}`,
      body: [listing.priceLabel, listing.location].filter(Boolean).join(" • ")
    },
    data: {
      listingId: listing.sourceId,
      category: listing.category,
      url: listing.marketplaceUrl
    },
    android: {
      priority: "high"
    }
  });

  return response;
}
