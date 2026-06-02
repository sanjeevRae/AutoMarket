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
  enabled: true,
  createdAt: Timestamp
}
```

## Retention

The cleanup job deletes records where `expiresAt <= now`, then deletes matching Cloudinary assets using `cloudinaryPublicId`.
