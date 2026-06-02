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
- `updatedAt`
- `expiresAt`

### `devices`

FCM tokens from Flutter.

- `token`
- `userName`
- `platform`
- `enabled`
- `createdAt`

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
