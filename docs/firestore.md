# Firestore Design

## Collections

### `listings`

Main feed collection.

Suggested fields:

- `sourceId`: stable listing ID, used as the document ID
- `title`
- `price`
- `priceLabel`
- `category`
- `categoryLabel`
- `location`
- `marketplaceUrl`
- `imageUrl`
- `cloudinaryPublicId`
- `matchedKeywords`
- `searchTokens`
- `source`
- `isActive`
- `createdAt`
- `Listed_time`
- `postedAt`
- `postedAtLabel`
- `discoveredAt`
- `updatedAt`
- `expiresAt`

`Listed_time` is the parsed Facebook Marketplace listed/post date as a Firestore timestamp. If Facebook does not expose a listed date, this field is `null`. `createdAt` currently mirrors the listed/post date when available and falls back to the time AutoMarket discovered the listing. `discoveredAt` always means the time AutoMarket saved it.

### `devices`

FCM tokens from Flutter.

- `token`
- `userName`
- `platform`
- `enabled`
- `createdAt`

### `scrapeRuns`

Backend run summaries written by GitHub Actions.

- `rawFetched`
- `matched`
- `saved`
- `skippedDuplicates`
- `targetFailures`
- `listingFailures`
- `marketplaceTargetOffset`
- `githubRunId`
- `createdAt`

Use this collection to verify whether automation is actually finding new listing IDs. If `matched` is high but `saved` is `0`, Facebook returned items already stored in `listings`.

## Flutter Search Queries

For a simple free search, query by exact token:

```dart
FirebaseFirestore.instance
  .collection('listings')
  .where('searchTokens', arrayContains: 'iphone')
  .where('isActive', isEqualTo: true)
  .orderBy('createdAt', descending: true)
  .limit(50);
```

For category feeds:

```dart
FirebaseFirestore.instance
  .collection('listings')
  .where('category', isEqualTo: 'iphone')
  .where('isActive', isEqualTo: true)
  .orderBy('createdAt', descending: true)
  .limit(50);
```

Firestore may ask you to create composite indexes from the Firebase console when these queries first run. Use the link Firebase gives you.

## TTL

You can also enable Firestore TTL on the `expiresAt` field for the `listings` collection group. The repo still includes a cleanup workflow because it also removes Cloudinary images.
