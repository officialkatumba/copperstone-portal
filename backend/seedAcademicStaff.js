// Simple script that works with your exact setup
const mongoose = require("mongoose");
const path = require("path");

// Load .env from parent directory
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  try {
    // Check what connection string we have
    const mongoUri = process.env.MONGO_URI;
    console.log("Mongo URI length:", mongoUri ? mongoUri.length : "undefined");

    if (!mongoUri) {
      console.error("ERROR: MONGO_URI is not defined in .env file");
      console.error("Please add: MONGO_URI=mongodb://your-connection-string");
      process.exit(1);
    }

    // Connect
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Do the work
    const Payment = require("../models/Payment");
    const User = require("../models/User");

    const admin = await User.findOne({ role: { $in: ["Admin", "Finance"] } });
    if (!admin) throw new Error("No admin user found");

    const result = await Payment.updateMany(
      { status: "Pending" },
      {
        $set: {
          status: "Verified",
          verifiedBy: admin._id,
          verifiedAt: new Date(),
          remarks: "Bulk verified",
        },
      },
    );

    console.log(`✅ Verified ${result.modifiedCount} payments`);

    await mongoose.disconnect();
    console.log("🎉 Done!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
