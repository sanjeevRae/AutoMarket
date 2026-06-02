# Secrets Checklist

Never commit these values.

## Firebase

Create a Firebase service account:

Firebase Console -> Project settings -> Service accounts -> Generate new private key.

Add these GitHub repository secrets:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Keep `FIREBASE_PRIVATE_KEY` as the full private key with newline escapes.

## Cloudinary

Rotate the exposed API secret first.

Add these GitHub repository secrets:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Scraper

Add:

- `MARKETPLACE_CITY_URL`
- `FCM_TOKENS`

`FCM_TOKENS` is only for early testing. Later, Flutter should write tokens into the `devices` collection.
