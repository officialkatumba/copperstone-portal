// // seedDeanOfStudents.js
// const mongoose = require("mongoose");
// const User = require("./models/User");
// require("dotenv").config();

// (async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("✅ MongoDB Connected");

//     const email = "deanofstudents@copperstone.ac.zm";

//     const existingDeanOfStudents = await User.findOne({ email });

//     if (existingDeanOfStudents) {
//       console.log("ℹ️ Dean of Students account already exists");
//       console.log("ℹ️ Email:", existingDeanOfStudents.email);
//       console.log("ℹ️ Role:", existingDeanOfStudents.role);
//       process.exit(0);
//     }

//     // Create new Dean of Students user
//     const deanOfStudents = new User({
//       firstName: "Sarah",
//       surname: "Chanda",
//       otherNames: "",
//       email: email,
//       mobile: "260970000002",
//       role: "DeanOfStudents", // IMPORTANT: ensure role 'DeanOfStudents' is in your User schema enum
//     });

//     // Register using passport-local-mongoose (hash + salt)
//     await User.register(deanOfStudents, "StrongPassword123");

//     console.log("✅ Dean of Students account created successfully");
//     console.log("📋 Account Details:");
//     console.log("   Name: Sarah Chanda");
//     console.log("   Email: deanofstudents@copperstone.ac.zm");
//     console.log("   Mobile: 260970000002");
//     console.log("   Role: DeanOfStudents");
//     console.log("   Password: StrongPassword123");
//     console.log("\n⚠️ IMPORTANT: Change the password after first login!");

//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Error seeding Dean of Students:", err);

//     // Provide helpful error messages
//     if (err.name === "ValidationError") {
//       console.error("\n🔍 Validation Error Details:");
//       Object.keys(err.errors).forEach((key) => {
//         console.error(`   ${key}: ${err.errors[key].message}`);
//       });
//     }

//     if (err.message && err.message.includes("enum")) {
//       console.error(
//         "\n⚠️ Check if 'DeanOfStudents' is in your User schema enum array!"
//       );
//     }

//     process.exit(1);
//   }
// })();
const mongoose = require("mongoose");
const path = require("path");
const Payment = require("./models/Payment");

// Load .env file using absolute path
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

(async () => {
  try {
    console.log("🚀 Starting bulk payment verification...\n");

    // Debug: Show what MONGO_URI is being read
    console.log("🔍 Checking MONGO_URI from .env file...");
    console.log(
      "MONGO_URI length:",
      process.env.MONGO_URI ? process.env.MONGO_URI.length : "undefined",
    );
    console.log(
      "MONGO_URI first 50 chars:",
      process.env.MONGO_URI
        ? process.env.MONGO_URI.substring(0, 50) + "..."
        : "N/A",
    );

    // Check if MONGO_URI exists
    if (!process.env.MONGO_URI) {
      console.error("❌ ERROR: MONGO_URI is not defined in .env file");
      console.error("Please check that your .env file has:");
      console.error(
        "MONGO_URI=mongodb+srv://officialkatumba:Katumba%402024@cluster0.lj1x5.mongodb.net/copperstone_portal?retryWrites=true&w=majority",
      );
      process.exit(1);
    }

    console.log("\n🔗 Connecting to MongoDB...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB Connected\n");

    // Import models
    const Payment = require("../models/Payment");
    const User = require("../models/User");

    // Get admin/finance user
    const adminUser = await User.findOne({
      role: { $in: ["Admin", "Finance"] },
    });

    if (!adminUser) {
      console.error("❌ No admin/finance user found");
      process.exit(1);
    }

    console.log(
      `👤 Verifying as: ${adminUser.firstName} ${adminUser.surname} (${adminUser.role})\n`,
    );

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

    console.log(`\n⚠️  WARNING: This will verify ${pendingCount} payments.`);

    // Ask for confirmation
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question(
      "\nType 'YES' to continue, or anything else to cancel: ",
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
        const verifiedCount = await Payment.countDocuments({
          status: "Verified",
        });

        console.log("📊 Updated Statistics:");
        console.log(`   Verified payments: ${verifiedCount}`);
        console.log(`   Still pending: ${stillPending}`);

        await mongoose.disconnect();
        console.log("\n🎉 Bulk verification complete!");
        process.exit(0);
      },
    );
  } catch (err) {
    console.error("\n❌ Error:", err.message);

    if (err.message.includes("uri") || err.message.includes("connection")) {
      console.error("\n🔧 Troubleshooting steps:");
      console.error(
        "1. Check your .env file at:",
        path.join(__dirname, "..", ".env"),
      );
      console.error("2. Make sure MONGO_URI is not commented out");
      console.error(
        "3. Current MONGO_URI value:",
        process.env.MONGO_URI ? "Exists" : "Missing",
      );
    }

    process.exit(1);
  }
})();
