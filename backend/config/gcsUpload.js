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

// ✅ Multer memory storage
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ✅ Upload helper with clean filename convention
async function uploadToGCS(file, user, programmeCode, applicationYear) {
  return new Promise((resolve, reject) => {
    const extension = file.originalname.split(".").pop();

    // Safe defaults to avoid "undefined" in names
    const safeFirst = user?.firstName || "First";
    const safeSurname = user?.surname || "Surname";
    const safeProg = programmeCode || "UnknownProg";
    const year = applicationYear || new Date().getFullYear();

    // Filename format:
    // applications/First_Surname_ProgCode_Year_application_Timestamp.ext
    const fileName = `applications/${safeFirst}_${safeSurname}_${safeProg}_${year}_application_${Date.now()}.${extension}`;

    const blob = bucket.file(fileName);
    const stream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
      // ⚠️ Do NOT use predefinedAcl with uniform bucket-level access
    });

    stream.on("error", reject);
    stream.on("finish", () => {
      const gcsUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(gcsUrl);
    });

    stream.end(file.buffer);
  });
}

module.exports = { multerUpload, uploadToGCS };
