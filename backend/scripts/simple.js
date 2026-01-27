// const Payment = require('../models/Payment'); console.log('Script loaded');

const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

console.log("🚀 Starting bulk payment verification...\n");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    // Import models
    const Payment = require("../models/Payment");
    const User = require("../models/User");

    // Get admin user
    const adminUser = await User.findOne({
      role: { $in: ["Admin", "Finance"] },
    });

    if (!adminUser) {
      console.error("❌ No admin/finance user found");
      process.exit(1);
    }

    console.log(
      `👤 Verifying as: ${adminUser.firstName} ${adminUser.surname}\n`,
    );

    // Count pending payments
    const pendingCount = await Payment.countDocuments({ status: "Pending" });
    console.log(`📋 Found ${pendingCount} pending payments\n`);

    if (pendingCount === 0) {
      console.log("✅ No pending payments to verify");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Ask for confirmation
    console.log(`⚠️  WARNING: This will verify ${pendingCount} payments.`);
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question(
      'Type "YES" to continue, or anything else to cancel: ',
      async (answer) => {
        readline.close();

        if (answer.trim().toUpperCase() !== "YES") {
          console.log("\n❌ Operation cancelled");
          await mongoose.disconnect();
          process.exit(0);
        }

        console.log("\n🔄 Verifying payments...\n");

        // Update ALL pending payments to verified
        const result = await Payment.updateMany(
          { status: "Pending" },
          {
            $set: {
              status: "Verified",
              verifiedBy: adminUser._id,
              verifiedAt: new Date(),
              remarks: "Bulk verified by admin",
            },
          },
        );

        console.log(
          `✅ Successfully verified ${result.modifiedCount} payments!\n`,
        );

        // Show updated count
        const stillPending = await Payment.countDocuments({
          status: "Pending",
        });
        console.log(`📊 ${stillPending} payments still pending`);

        await mongoose.disconnect();
        console.log("🎉 Bulk verification complete!");
        process.exit(0);
      },
    );
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  });
