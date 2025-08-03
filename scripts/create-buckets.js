/**
 * This script creates Google Cloud Storage buckets in the GCS emulator.
 * It iterates through a predefined list of bucket names
 * and sends a POST request to the emulator's API endpoint for each bucket.
 */

const GCS_EMULATOR_ENDPOINT = "http://localhost:4443";
const PROJECT_ID = "cross-stitch-dueling-bot";

const BUCKET_NAMES = ["duel-reports"];

console.log("Starting bucket creation process...\n");
for (const BUCKET_NAME of BUCKET_NAMES) {
  console.log(`\tCreating bucket: '${BUCKET_NAME}'...`);

  try {
    const response = await fetch(`${GCS_EMULATOR_ENDPOINT}/storage/v1/b?project=${PROJECT_ID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: BUCKET_NAME }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create bucket '${BUCKET_NAME}': ${response.statusText}`);
    }

    console.log(`\tBucket '${BUCKET_NAME}' created successfully.\n`);
  } catch (error) {
    console.error(`Error creating bucket '${BUCKET_NAME}':`, error);
  }
}
console.log("All specified buckets have been created.");
