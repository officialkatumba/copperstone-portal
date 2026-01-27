const mongoose = require("mongoose");
const path = require("path");

// Load .env from parent directory
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Payment = require("./models/Payment");
const User = require("./models/User");

(async () => {
  try {
    console.log("🚀 Starting bulk payment verification...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected\n");

    // Get the finance officer user (John Zimba)
    const financeOfficer = await User.findOne({
      email: "finance2@copperstone.ac.zm",
      role: "FinanceOfficer",
    });

    if (!financeOfficer) {
      console.error("❌ Finance Officer not found");
      console.error(
        "Expected: finance2@copperstone.ac.zm with role FinanceOfficer",
      );

      // Try to find any finance/admin user
      const anyAdmin = await User.findOne({
        role: { $in: ["FinanceOfficer", "Finance", "Admin"] },
      });

      if (anyAdmin) {
        console.log(`✅ Found user: ${anyAdmin.email} (${anyAdmin.role})`);
        console.log("Using this user for verification...\n");
      } else {
        console.error("❌ No suitable user found for verification");
        console.error("Please run the finance officer seed script first");
        await mongoose.disconnect();
        process.exit(1);
      }
    } else {
      console.log(
        `👤 Found Finance Officer: ${financeOfficer.firstName} ${financeOfficer.surname}`,
      );
      console.log(`   Email: ${financeOfficer.email}`);
      console.log(`   Role: ${financeOfficer.role}\n`);
    }

    const adminUser = financeOfficer || anyAdmin;

    // Count pending payments
    const pendingCount = await Payment.countDocuments({ status: "Pending" });
    console.log(`📋 Found ${pendingCount} pending payments\n`);

    if (pendingCount === 0) {
      console.log("✅ No pending payments to verify");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Show summary
    console.log("📊 Payment Summary:");
    const samplePayments = await Payment.find({ status: "Pending" })
      .populate("student", "firstName surname")
      .limit(5)
      .sort({ createdAt: 1 });

    samplePayments.forEach((p, i) => {
      console.log(
        `  ${i + 1}. ${p.student?.firstName || "Unknown"} ${p.student?.surname || ""} - ZMW ${p.amount} (${p.category})`,
      );
    });

    if (pendingCount > 5) {
      console.log(`  ... and ${pendingCount - 5} more payments`);
    }

    // Ask for confirmation
    console.log(`\n⚠️  WARNING: This will verify ${pendingCount} payments.`);
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question(
      "Type 'YES' to continue, or anything else to cancel: ",
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
              remarks: "Bulk verified by Finance Officer",
            },
          },
        );

        console.log(
          `✅ Successfully verified ${result.modifiedCount} payments!\n`,
        );

        // Show updated statistics
        const stillPending = await Payment.countDocuments({
          status: "Pending",
        });
        const verifiedCount = await Payment.countDocuments({
          status: "Verified",
        });

        console.log("📊 Updated Statistics:");
        console.log(`   Total verified payments: ${verifiedCount}`);
        console.log(`   Still pending: ${stillPending}`);
        console.log(`   Just verified now: ${result.modifiedCount}`);

        await mongoose.disconnect();
        console.log("\n🎉 Bulk verification complete!");
        console.log("All pending payments have been marked as 'Verified'");
        process.exit(0);
      },
    );
  } catch (err) {
    console.error("\n❌ Error:", err.message);

    if (err.message.includes("readline")) {
      console.error(
        "Make sure you're running this in a terminal/command prompt",
      );
    }

    process.exit(1);
  }
})();
