import { getEnabledDevices } from "../notifications/fcm.js";

async function main() {
  const devices = await getEnabledDevices();

  console.log(`Enabled devices found: ${devices.length}`);

  if (devices.length === 0) {
    console.warn("No enabled devices found. Flutter must write docs into Firestore collection `devices`.");
    return;
  }

  let valid = 0;
  let invalid = 0;

  for (const device of devices) {
    const missing = ["token", "userName", "platform", "createdAt"].filter((field) => !device[field]);

    if (missing.length > 0) {
      invalid += 1;
      console.warn(`Device ${device.id} missing: ${missing.join(", ")}`);
      continue;
    }

    valid += 1;
    console.log(`Device ${device.id} ok: userName=${device.userName} platform=${device.platform}`);
  }

  console.log(`Device check complete. valid=${valid} invalid=${invalid}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
