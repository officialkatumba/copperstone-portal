// backend/config/gcsUpload.js
const { Storage } = require("@google-cloud/storage");
const multer = require("multer");
require("dotenv").config();

// ✅ Setup Google Cloud Storage client
const storage = new Storage({
  projectId: process.env.GOOGLE_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
});

// ✅ Reference bucket
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

// ✅ Multer memory storage (for file upload middleware)
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
});

/**
 * ✅ Upload helper
 * - Stores the object in GCS
 * - Returns BOTH a public-style URL (fallback) AND internal GCS path
 */
async function uploadToGCS(file, user, programmeCode, applicationYear) {
  return new Promise((resolve, reject) => {
    const extension = file.originalname.split(".").pop();

    const safeFirst = user?.firstName || "First";
    const safeSurname = user?.surname || "Surname";
    const safeProg = programmeCode || "UnknownProg";
    const year = applicationYear || new Date().getFullYear();

    // Format: applications/First_Surname_ProgCode_Year_application_Timestamp.ext
    const fileName = `applications/${safeFirst}_${safeSurname}_${safeProg}_${year}_application_${Date.now()}.${extension}`;

    const blob = bucket.file(fileName);
    const stream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    stream.on("error", reject);
    stream.on("finish", () => {
      resolve({
        publicUrl: `https://storage.googleapis.com/${bucket.name}/${blob.name}`, // legacy style
        path: blob.name, // ✅ save this as gcsPath for signed URL
      });
    });

    stream.end(file.buffer);
  });
}

/**
 * ✅ Generate signed URL for secure viewing/downloading
 */
async function generateSignedUrl(filePath) {
  if (!filePath) return null;

  const options = {
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  };

  const [url] = await bucket.file(filePath).getSignedUrl(options);
  return url;
}

module.exports = { multerUpload, uploadToGCS, generateSignedUrl };
