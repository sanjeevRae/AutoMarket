# GitHub Automation

AutoMarket is prepared to run without manual scraping.

## Workflows

### Scrape Marketplace

`.github/workflows/scrape.yml`

- runs every 5 minutes,
- installs Node dependencies and Playwright Chromium,
- validates environment variables,
- scans Nepal mobile Marketplace targets,
- saves new matching listings to Firestore,
- uploads images to Cloudinary,
- sends FCM notifications.

The built-in target list now includes these search URLs by default:

- `https://www.facebook.com/marketplace/106085869430478/search/?sortBy=creation_time_descend&query=phone&exact=false`
- `https://www.facebook.com/marketplace/107995085894650/search/?sortBy=creation_time_descend&query=phone&exact=false`

### Cleanup Old Listings

`.github/workflows/cleanup.yml`

- runs daily,
- deletes Firestore listings where `expiresAt` has passed,
- deletes the matching Cloudinary image.

## Required GitHub Secrets

Add these in:

GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `FCM_TOKENS`

Optional:

- `MARKETPLACE_URLS`
- `MARKETPLACE_CITY_URL`

Leave `MARKETPLACE_URLS` empty to use the built-in Nepal mobile target list.

If you set `MARKETPLACE_URLS`, it overrides the built-in target list. Use semicolon-separated full URLs.

## What Happens When A New Phone Is Found

1. GitHub Actions runs the scraper.
2. The scraper checks iPhone and Android keywords.
3. If the listing ID is new, it uploads the image to Cloudinary.
4. It writes the listing to Firestore `listings`.
5. It sends a push notification through FCM.
6. Flutter shows the listing from Firestore in the app feed.

## Important Notes

GitHub scheduled workflows are free-friendly, but they are not exact real-time timers. A 5-minute schedule can still run late depending on GitHub load.

Facebook may change page markup or block automation. If the workflow starts finding zero listings, run the workflow manually and check logs.
