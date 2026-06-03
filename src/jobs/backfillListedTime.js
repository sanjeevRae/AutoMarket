import { getListingsMissingListedTime, updateListingListedTime } from "../firebase/listingsRepository.js";
import { scrapeFacebookListingDetails } from "../scraper/facebookListingDetails.js";

async function main() {
  const limit = Number.parseInt(process.env.BACKFILL_LISTED_TIME_LIMIT || "25", 10);
  const listings = await getListingsMissingListedTime(limit);

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
      }
    } catch (error) {
      failed += 1;
      console.warn(`Failed ${listing.id}: ${error.message}`);
    }
  }

  console.log(
    `Listed_time detail backfill complete. checked=${listings.length} updated=${updated} stillNull=${stillNull} failed=${failed}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
