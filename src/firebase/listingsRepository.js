import admin from "firebase-admin";
import { getDb } from "./admin.js";

const COLLECTION = "listings";

export async function listingExists(sourceId) {
  const snapshot = await getDb().collection(COLLECTION).where("sourceId", "==", sourceId).limit(1).get();
  return !snapshot.empty;
}

export async function saveListing(listing) {
  const docRef = getDb().collection(COLLECTION).doc(listing.sourceId);
  const listedTime = toFirestoreTimestamp(listing.postedAt);
  const createdAt = listedTime || admin.firestore.FieldValue.serverTimestamp();

  await docRef.set(
    {
      ...listing,
      Listed_time: listedTime,
      createdAt,
      discoveredAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );
  return docRef.id;
}

export async function getExpiredListings(limit = 100) {
  const now = admin.firestore.Timestamp.now();
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("expiresAt", "<=", now)
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function deleteListing(id) {
  await getDb().collection(COLLECTION).doc(id).delete();
}

export async function backfillListedTime(limit = 500) {
  const snapshot = await getDb().collection(COLLECTION).limit(limit).get();
  let updated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const listedTime = toFirestoreTimestamp(data.postedAt);

    if (data.Listed_time !== undefined) {
      skipped += 1;
      continue;
    }

    await doc.ref.set(
      {
        Listed_time: listedTime,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    updated += 1;
  }

  return { checked: snapshot.size, updated, skipped };
}

export async function getListingsMissingListedTime(limit = 25) {
  const snapshot = await getDb().collection(COLLECTION).limit(limit).get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ref: doc.ref, ...doc.data() }))
    .filter((listing) => !listing.Listed_time && listing.marketplaceUrl);
}

export async function updateListingListedTime(id, { postedAt, postedAtLabel, detailScrapedAt }) {
  const listedTime = toFirestoreTimestamp(postedAt);

  await getDb()
    .collection(COLLECTION)
    .doc(id)
    .set(
      {
        Listed_time: listedTime,
        postedAt: postedAt || null,
        postedAtLabel: postedAtLabel || null,
        detailScrapedAt: detailScrapedAt || new Date().toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

  return Boolean(listedTime);
}

function toFirestoreTimestamp(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return admin.firestore.Timestamp.fromDate(date);
}
