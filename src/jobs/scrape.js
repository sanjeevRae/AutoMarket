import { env, requireProductionSecrets } from "../config/env.js";
import { filters } from "../config/filters.js";
import { listingExists, saveListing } from "../firebase/listingsRepository.js";
import { saveScrapeRun } from "../firebase/scrapeRunsRepository.js";
import { uploadListingImage } from "../media/cloudinary.js";
import { sendListingNotification } from "../notifications/fcm.js";
import { scrapeFacebookListingDetails } from "../scraper/facebookListingDetails.js";
import { scrapeFacebookMarketplace } from "../scraper/facebookMarketplace.js";
import { scrapeMockMarketplace } from "../scraper/mockMarketplace.js";
import { matchListing } from "../services/listingMatcher.js";

async function main() {
  if (!env.SCRAPE_DRY_RUN) {
    requireProductionSecrets();
  }

  let saved = 0;
  let matched = 0;
  let rawFetched = 0;
  let skippedDuplicates = 0;
  let targetFailures = 0;
  let listingFailures = 0;
  let notificationSuccess = 0;
  let notificationFailure = 0;
  const runStartedAt = new Date().toISOString();

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
      targetFailures += 1;
      console.warn(`[scrape] target failed: ${target.name}: ${error.message}`);
      continue;
    }

    rawFetched += rawListings.length;
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
        if (await listingExists(listing.sourceId)) {
          skippedDuplicates += 1;
          continue;
        }

        const listingWithDetails = await enrichListingDetails(listing);
        const media = await uploadListingImage(listingWithDetails.originalImageUrl, listingWithDetails.sourceId);
        const finalListing = {
          ...listingWithDetails,
          imageUrl: media.imageUrl,
          cloudinaryPublicId: media.publicId
        };

        await saveListing(finalListing);
        const notificationResult = await sendListingNotification(finalListing);
        notificationSuccess += notificationResult.successCount || 0;
        notificationFailure += notificationResult.failureCount || 0;
        saved += 1;
      } catch (error) {
        listingFailures += 1;
        console.warn(`[listing] failed ${listing.sourceId}: ${error.message}`);
      }
    }
  }

  const summary = {
    dryRun: env.SCRAPE_DRY_RUN,
    source: env.SCRAPE_SOURCE,
    targetMode: env.MARKETPLACE_TARGET_MODE,
    targetsConfigured: targets.length,
    rawFetched,
    matched,
    saved,
    skippedDuplicates,
    targetFailures,
    listingFailures,
    notificationSuccess,
    notificationFailure,
    startedAt: runStartedAt,
    finishedAt: new Date().toISOString()
  };

  console.log(
    `Scrape complete. rawFetched=${rawFetched} matched=${matched} saved=${saved} duplicates=${skippedDuplicates} targetFailures=${targetFailures} listingFailures=${listingFailures} notificationSuccess=${notificationSuccess} notificationFailure=${notificationFailure} dryRun=${env.SCRAPE_DRY_RUN}`
  );

  if (!env.SCRAPE_DRY_RUN) {
    try {
      await saveScrapeRun(summary);
    } catch (error) {
      console.warn(`[scrapeRuns] failed to save run summary: ${error.message}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function enrichListingDetails(listing) {
  if (!env.SCRAPE_DETAIL_DATES || env.SCRAPE_SOURCE !== "facebook" || listing.postedAt) {
    return listing;
  }

  try {
    const details = await scrapeFacebookListingDetails(listing.marketplaceUrl);
    if (!details.postedAt) return listing;

    return {
      ...listing,
      postedAt: details.postedAt,
      postedAtLabel: details.postedAtLabel,
      detailScrapedAt: details.detailScrapedAt
    };
  } catch (error) {
    console.warn(`[details] failed ${listing.sourceId}: ${error.message}`);
    return listing;
  }
}
