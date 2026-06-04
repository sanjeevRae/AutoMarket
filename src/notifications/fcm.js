import { env } from "../config/env.js";
import { getDb, getMessaging } from "../firebase/admin.js";

const DEVICES_COLLECTION = "devices";

export async function getNotificationTokens() {
  const manualTokens = env.FCM_TOKENS
    ? env.FCM_TOKENS.split(",")
        .map((token) => token.trim())
        .filter(Boolean)
    : [];

  const firestoreTokens = (await getEnabledDevices()).map((device) => device.token).filter(Boolean);

  return [...new Set([...manualTokens, ...firestoreTokens])];
}

export async function getEnabledDevices() {
  const snapshot = await getDb().collection(DEVICES_COLLECTION).where("enabled", "==", true).get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function sendListingNotification(listing) {
  const tokens = await getNotificationTokens();
  if (tokens.length === 0) {
    console.warn(`[fcm] no enabled device tokens found for listing ${listing.sourceId}`);
    return { successCount: 0, failureCount: 0 };
  }

  console.log(`[fcm] sending listing ${listing.sourceId} to ${tokens.length} token(s)`);

  const response = await getMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: `New ${listing.categoryLabel || "deal"}: ${listing.title}`,
      body: [listing.priceLabel, listing.location].filter(Boolean).join(" | ")
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

  console.log(
    `[fcm] listing ${listing.sourceId} sent success=${response.successCount} failure=${response.failureCount}`
  );

  response.responses.forEach((result, index) => {
    if (!result.success) {
      console.warn(`[fcm] token ${index + 1} failed: ${result.error?.code || result.error?.message || "unknown error"}`);
    }
  });

  return response;
}
