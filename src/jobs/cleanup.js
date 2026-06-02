import { requireProductionSecrets } from "../config/env.js";
import { deleteListing, getExpiredListings } from "../firebase/listingsRepository.js";
import { deleteCloudinaryAsset } from "../media/cloudinary.js";

async function main() {
  requireProductionSecrets();

  const expired = await getExpiredListings(100);
  let deleted = 0;

  for (const listing of expired) {
    await deleteCloudinaryAsset(listing.cloudinaryPublicId);
    await deleteListing(listing.id);
    deleted += 1;
  }

  console.log(`Cleanup complete. deleted=${deleted}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
