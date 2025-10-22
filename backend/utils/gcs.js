// backend/utils/gcs.js
const { Storage } = require("@google-cloud/storage");
require("dotenv").config();

const storage = new Storage({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

/**
 * Upload a local file to the bucket
 * returns { gcsName }
 */
async function uploadFile(localPath, destinationPath) {
  // destinationPath should include folder if you want e.g. 'applications/Acceptance_xxx.pdf'
  await bucket.upload(localPath, {
    destination: destinationPath,
    // DON'T set predefinedAcl when uniform bucket-level access is enabled
  });

  return { gcsName: destinationPath };
}

/**
 * Generate a signed URL for reading (valid for `days` days)
 */
async function getSignedUrl(gcsName, days = 30) {
  const file = bucket.file(gcsName);
  const expires = Date.now() + days * 24 * 60 * 60 * 1000; // ms
  const [url] = await file.getSignedUrl({
    action: "read",
    expires,
  });
  return url;
}

module.exports = { uploadFile, getSignedUrl };
 