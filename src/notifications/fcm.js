import { env } from "../config/env.js";
import { getDb, getMessaging } from "../firebase/admin.js";

const DEVICES_COLLECTION = "devices";
const ANDROID_CHANNEL_ID = "marketplace_listing_alerts";
const IOS_SOUND = "default";
const INVALID_TOKEN_ERROR_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered"
]);

export async function getNotificationTargets() {
  const manualTokens = env.FCM_TOKENS
    ? env.FCM_TOKENS.split(",")
        .map((token) => token.trim())
        .filter(Boolean)
        .map((token) => ({ token, source: "env", deviceId: null }))
    : [];

  const firestoreTargets = (await getEnabledDevices())
    .filter((device) => device.token)
    .map((device) => ({
      token: device.token,
      source: "firestore",
      deviceId: device.id,
      platform: device.platform || null,
      apnsToken: device.apnsToken || null
    }));

  const deduped = new Map();

  for (const target of [...manualTokens, ...firestoreTargets]) {
    if (!deduped.has(target.token)) {
      deduped.set(target.token, target);
    }
  }

  return [...deduped.values()];
}

export async function getEnabledDevices() {
  const snapshot = await getDb().collection(DEVICES_COLLECTION).where("enabled", "==", true).get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function sendListingNotification(listing) {
  const targets = await getNotificationTargets();
  if (targets.length === 0) {
    console.warn(`[fcm] no enabled device tokens found for listing ${listing.sourceId}`);
    return { successCount: 0, failureCount: 0 };
  }

  console.log(`[fcm] sending listing ${listing.sourceId} to ${targets.length} token(s)`);

  const title = `New ${listing.categoryLabel || "deal"}: ${listing.title}`;
  const body = [listing.priceLabel, listing.location].filter(Boolean).join(" | ");
  const imageUrl = listing.imageUrl || listing.originalImageUrl || undefined;

  const response = await getMessaging().sendEachForMulticast({
    tokens: targets.map((target) => target.token),
    notification: {
      title,
      body,
      ...(imageUrl ? { imageUrl } : {})
    },
    data: {
      listingId: listing.sourceId,
      category: listing.category,
      url: listing.marketplaceUrl,
      title,
      body,
      imageUrl: imageUrl || ""
    },
    android: {
      priority: "high",
      notification: {
        channelId: ANDROID_CHANNEL_ID,
        sound: IOS_SOUND,
        priority: "high",
        defaultSound: true,
        clickAction: "FLUTTER_NOTIFICATION_CLICK",
        ...(imageUrl ? { imageUrl } : {})
      }
    },
    apns: {
      headers: {
        "apns-push-type": "alert",
        "apns-priority": "10"
      },
      payload: {
        aps: {
          alert: {
            title,
            body
          },
          sound: IOS_SOUND,
          badge: 1,
          contentAvailable: true,
          mutableContent: true
        },
        ...(imageUrl
          ? {
              fcm_options: {
                image: imageUrl
              }
            }
          : {})
      },
      fcmOptions: imageUrl
        ? {
            imageUrl
          }
        : undefined
    },
    fcmOptions: imageUrl
      ? {
          imageUrl
        }
      : undefined
    });

  const invalidTargets = targets.filter((target, index) => {
    const result = response.responses[index];
    return !result?.success && INVALID_TOKEN_ERROR_CODES.has(result.error?.code);
  });

  if (invalidTargets.length > 0) {
    await disableInvalidDeviceTargets(invalidTargets);
  }

  console.log(
    `[fcm] listing ${listing.sourceId} sent success=${response.successCount} failure=${response.failureCount}`
  );

  response.responses.forEach((result, index) => {
    if (!result.success) {
      const target = targets[index];
      console.warn(
        `[fcm] token ${index + 1} failed: ${result.error?.code || result.error?.message || "unknown error"} source=${target?.source || "unknown"} deviceId=${target?.deviceId || "n/a"}`
      );
    }
  });

  return response;
}

async function disableInvalidDeviceTargets(targets) {
  const firestoreTargets = targets.filter((target) => target.source === "firestore" && target.deviceId);
  if (firestoreTargets.length === 0) return;

  const db = getDb();

  await Promise.all(
    firestoreTargets.map((target) =>
      db.collection(DEVICES_COLLECTION).doc(target.deviceId).set(
        {
          enabled: false,
          invalidToken: true,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      )
    )
  );

  console.warn(`[fcm] disabled ${firestoreTargets.length} invalid device token(s)`);
}
