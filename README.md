# AutoMarket Backend

Backend automation for the AutoMarket deal-alert app.

It is designed to:

- scan Facebook Marketplace with Playwright,
- filter listings by category, keyword, location, and price,
- upload listing photos to Cloudinary,
- save deal metadata to Firebase Firestore,
- send Firebase Cloud Messaging alerts,
- delete Firestore + Cloudinary data older than 30 days.

## Current Deal Scope

The default scraper watches Nepal Marketplace locations/categories for mobile devices only:

- iPhones: iPhone X/10, 11, 12, 13, 14, 15, 16, Pro/Max variants by title matching
- Android phones: Samsung, Vivo, Oppo, Realme, Redmi, Xiaomi, Poco, OnePlus, Nothing, Pixel, Huawei, Honor, Infinix, Tecno, Nokia, Motorola

When `SCRAPE_DRY_RUN=false`, every new matched listing is saved into Firestore and an FCM notification is sent to registered device tokens.

The backend now sends OS-visible FCM notification payloads for Android and iOS, so notifications can appear even when the Flutter app is backgrounded or fully closed, assuming the mobile app and Firebase/APNs setup are correct.

## Important Security Step

Rotate any Cloudinary secret that has been pasted into chat or committed anywhere. Store secrets only in `.env` locally and GitHub Actions Secrets in production.

## Local Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
npm run validate
```

Then fill `.env` with your real values.

For Firebase private keys, keep escaped newlines:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Run

```bash
npm run scrape
npm run cleanup
```

By default `SCRAPE_DRY_RUN=true`, so the scraper logs matched items without writing to Firebase or Cloudinary.

## GitHub Secrets

Add these repository secrets:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `MARKETPLACE_CITY_URL`
- `MARKETPLACE_URLS`
- `MARKETPLACE_MAX_TARGETS`
- `FCM_TOKENS`

See `docs/github-automation.md` for the full GitHub Actions setup.

## Firestore Collections

### `listings`

Stores marketplace listing metadata.

### `devices`

Flutter app can store FCM device tokens here later:

```js
{
  token: "...",
  userName: "Mina",
  platform: "android",
  apnsToken: "...", // optional, useful for iOS debugging
  enabled: true,
  createdAt: Timestamp
}
```

## Closed-App Push Notifications

For terminated-app notifications, backend delivery must include a visible notification payload, not just `data`.

This backend sends:

- top-level FCM `notification.title` and `notification.body`
- Android high-priority notification config on channel `marketplace_listing_alerts`
- iOS APNs alert payload with sound and alert headers

If notifications still only appear inside the app, the remaining problem is usually mobile or Firebase configuration rather than scraper logic.

## Retention

The cleanup job deletes records where `expiresAt <= now`, then deletes matching Cloudinary assets using `cloudinaryPublicId`.
