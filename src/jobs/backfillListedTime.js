import fs from "node:fs";
import path from "node:path";
import { getListingsMissingListedTime, updateListingListedTime } from "../firebase/listingsRepository.js";
import { scrapeFacebookListingDetails } from "../scraper/facebookListingDetails.js";

async function main() {
  const limit = Number.parseInt(process.env.BACKFILL_LISTED_TIME_LIMIT || "25", 10);
  const listings = await getListingsMissingListedTime(limit);
  const report = [];

  let updated = 0;
  let stillNull = 0;
  let failed = 0;

  for (const listing of listings) {
    try {
      console.log(`Checking ${listing.id}: ${listing.marketplaceUrl}`);
      const details = await scrapeFacebookListingDetails(listing.marketplaceUrl);
      const hasListedTime = await updateListingListedTime(listing.id, details);

      if (hasListedTime) {
        updated += 1;
        console.log(`Updated ${listing.id}: ${details.postedAtLabel}`);
      } else {
        stillNull += 1;
        console.log(`No listed time found for ${listing.id}`);
        console.log("Sample detail lines:", details.detailSampleLines || []);
      }

      report.push({
        id: listing.id,
        marketplaceUrl: listing.marketplaceUrl,
        title: listing.title,
        postedAt: details.postedAt || null,
        postedAtLabel: details.postedAtLabel || null,
        detailSampleLines: details.detailSampleLines || []
      });
    } catch (error) {
      failed += 1;
      console.warn(`Failed ${listing.id}: ${error.message}`);
      report.push({
        id: listing.id,
        marketplaceUrl: listing.marketplaceUrl,
        title: listing.title,
        error: error.message
      });
    }
  }

  writeReport(report, { checked: listings.length, updated, stillNull, failed });

  console.log(
    `Listed_time detail backfill complete. checked=${listings.length} updated=${updated} stillNull=${stillNull} failed=${failed}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function writeReport(items, summary) {
  const outputPath = process.env.BACKFILL_LISTED_TIME_REPORT || "artifacts/listed-time-backfill.json";
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({ summary, items }, null, 2));
  console.log(`Backfill report written to ${outputPath}`);
}
