import { backfillListedTime } from "../firebase/listingsRepository.js";

async function main() {
  const result = await backfillListedTime();
  console.log(
    `Listed_time backfill complete. checked=${result.checked} updated=${result.updated} skipped=${result.skipped}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
