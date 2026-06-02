# Testing AutoMarket

## 1. Validate Environment

```bash
npm run validate
```

This confirms the app can read `.env`.

## 2. Test Matching Without Facebook

```bash
npm run scrape:mock
```

Expected result:

- it fetches 3 mock listings,
- matches the iPhone,
- matches the Android phone,
- ignores the sofa,
- does not write to Firebase because dry-run is enabled.

## 3. Test Real Facebook Page Without Saving

Set `.env`:

```env
SCRAPE_SOURCE=facebook
SCRAPE_DRY_RUN=true
SCRAPE_HEADLESS=false
SCRAPE_DEBUG=true
MARKETPLACE_CITY_URL=https://www.facebook.com/marketplace/
```

Then run:

```bash
npm run scrape
```

A browser window should open. If Facebook requires login, the scraper may return zero listings.

`SCRAPE_DEBUG=true` prints the raw listings found before filtering. Use that output to tune keywords and price ranges in `src/config/filters.js`.

For multiple Nepal locations/categories, set `MARKETPLACE_URLS` with semicolon-separated Facebook Marketplace URLs:

```env
MARKETPLACE_URLS=https://www.facebook.com/marketplace/106085869430478/iphones/;https://www.facebook.com/marketplace/205246402885806/cell-phones/
```

Leave `MARKETPLACE_URLS` empty to use the built-in generated Nepal target list.

## 4. Test Saving to Firebase and Cloudinary

Only do this after Firebase Admin and Cloudinary values are complete.

Set:

```env
SCRAPE_DRY_RUN=false
```

Then run:

```bash
npm run scrape
```

Check:

- Firebase Console -> Firestore -> `listings`
- Cloudinary Media Library -> `automarket/listings`
- phone notification, if FCM tokens are configured

## 5. Test Cleanup

```bash
npm run cleanup
```

Cleanup deletes listings where `expiresAt` is in the past and removes their Cloudinary image.
