import admin from "firebase-admin";
import { getDb } from "./admin.js";

const COLLECTION = "scrapeRuns";

export async function saveScrapeRun(run) {
  const runId = [
    process.env.GITHUB_RUN_ID || "local",
    process.env.GITHUB_RUN_ATTEMPT || "1",
    process.env.MARKETPLACE_TARGET_OFFSET || "0",
    Date.now()
  ].join("_");

  await getDb()
    .collection(COLLECTION)
    .doc(runId)
    .set({
      ...run,
      runId,
      githubRunId: process.env.GITHUB_RUN_ID || null,
      githubRunAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
      marketplaceTargetOffset: process.env.MARKETPLACE_TARGET_OFFSET || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
}
