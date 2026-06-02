import { env, requireProductionSecrets } from "../config/env.js";
import { filters } from "../config/filters.js";
import { listingExists, saveListing } from "../firebase/listingsRepository.js";
import { uploadListingImage } from "../media/cloudinary.js";
import { sendListingNotification } from "../notifications/fcm.js";
import { scrapeFacebookMarketplace } from "../scraper/facebookMarketplace.js";
import { scrapeMockMarketplace } from "../scraper/mockMarketplace.js";
import { matchListing } from "../services/listingMatcher.js";

async function main() {
  if (!env.SCRAPE_DRY_RUN) {
    requireProductionSecrets();
  }

  let saved = 0;
  let matched = 0;

  const seenInRun = new Set();

  const targets = env.SCRAPE_SOURCE === "mock" ? filters.marketplaceTargets.slice(0, 1) : filters.marketplaceTargets;

  for (const target of targets) {
    console.log(`Scanning ${target.name}: ${target.marketplaceUrl}`);

    let rawListings = [];

    try {
      rawListings =
        env.SCRAPE_SOURCE === "mock"
          ? await scrapeMockMarketplace()
          : await scrapeFacebookMarketplace({
              cityUrl: target.marketplaceUrl,
              maxItems: env.SCRAPE_MAX_ITEMS
            });
    } catch (error) {
      console.warn(`[scrape] target failed: ${target.name}: ${error.message}`);
      continue;
    }

    console.log(`Fetched ${rawListings.length} raw listings from ${env.SCRAPE_SOURCE}.`);

    if (env.SCRAPE_DEBUG) {
      for (const rawListing of rawListings) {
        console.log("[debug] raw", {
          sourceId: rawListing.sourceId,
          title: rawListing.title,
          price: rawListing.priceLabel,
          location: rawListing.location,
          url: rawListing.marketplaceUrl
        });
      }
    }

    for (const rawListing of rawListings) {
      if (seenInRun.has(rawListing.sourceId)) continue;
      seenInRun.add(rawListing.sourceId);

      const listing = matchListing({
        ...rawListing,
        scanTargetName: target.name,
        scanTargetUrl: target.marketplaceUrl
      });
      if (!listing) continue;
      matched += 1;

      if (env.SCRAPE_DRY_RUN) {
        console.log("[dry-run] matched", {
          sourceId: listing.sourceId,
          title: listing.title,
          price: listing.priceLabel,
          category: listing.category,
          location: listing.location,
          scanTarget: listing.scanTargetName,
          matchedKeywords: listing.matchedKeywords,
          url: listing.marketplaceUrl
        });
        continue;
      }

      try {
        if (await listingExists(listing.sourceId)) continue;

        const media = await uploadListingImage(listing.originalImageUrl, listing.sourceId);
        const finalListing = {
          ...listing,
          imageUrl: media.imageUrl,
          cloudinaryPublicId: media.publicId
        };

        await saveListing(finalListing);
        await sendListingNotification(finalListing);
        saved += 1;
      } catch (error) {
        console.warn(`[listing] failed ${listing.sourceId}: ${error.message}`);
      }
    }
  }

  console.log(`Scrape complete. matched=${matched} saved=${saved} dryRun=${env.SCRAPE_DRY_RUN}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
