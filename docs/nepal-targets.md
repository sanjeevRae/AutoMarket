# Nepal Marketplace Targets

Facebook Marketplace does not expose one reliable public "all Nepal" feed. The backend scans many Nepal location/category pages and dedupes repeated listings by Facebook listing ID.

## Built-In Locations

The repo currently generates target URLs for:

- Kathmandu
- Lalitpur
- Jawalakhel
- Bhaktapur
- Banepa
- Nepaltar

Across categories:

- iPhones
- mobile phones
- cell phones

`MARKETPLACE_MAX_TARGETS` controls how many generated URLs are scanned per run. Keep this reasonable for GitHub Actions.

## Adding Pokhara, Dharan, Butwal, Etc.

Facebook uses numeric location IDs in Marketplace URLs:

```text
https://www.facebook.com/marketplace/<LOCATION_ID>/<CATEGORY_SLUG>/
```

When you find a Marketplace URL for Pokhara, Dharan, Butwal, Bharatpur, Biratnagar, or any other city, add it to `MARKETPLACE_URLS`:

```env
MARKETPLACE_URLS=https://www.facebook.com/marketplace/LOCATION_ID/iphones/;https://www.facebook.com/marketplace/LOCATION_ID/cell-phones/
```

If `MARKETPLACE_URLS` is set, it overrides the generated defaults.

## Database + Notification Flow

For each run:

1. Playwright opens every target URL.
2. The scraper extracts visible listing cards.
3. The matcher checks keywords, price range, and category.
4. Duplicate listing IDs are skipped.
5. If `SCRAPE_DRY_RUN=false`, the image is uploaded to Cloudinary.
6. The listing is saved to Firestore `listings`.
7. FCM sends a push notification to tokens from `devices` and `FCM_TOKENS`.

The Flutter app should listen to Firestore `listings` ordered by `createdAt`.
