import admin from "firebase-admin";
import { getDb } from "./admin.js";

const COLLECTION = "listings";

export async function listingExists(sourceId) {
  const snapshot = await getDb().collection(COLLECTION).where("sourceId", "==", sourceId).limit(1).get();
  return !snapshot.empty;
}

export async function saveListing(listing) {
  const docRef = getDb().collection(COLLECTION).doc(listing.sourceId);
  const createdAt = listing.postedAt
    ? admin.firestore.Timestamp.fromDate(new Date(listing.postedAt))
    : admin.firestore.FieldValue.serverTimestamp();

  await docRef.set(
    {
      ...listing,
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
