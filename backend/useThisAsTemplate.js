// backend/fixPaymentsDirect.js
const mongoose = require("mongoose");

// Direct MongoDB connection - replace with your actual connection string
const MONGO_URI =
  "mongodb+srv://officialkatumba:Katumba%402024@cluster0.lj1x5.mongodb.net/copperstone_portal?retryWrites=true&w=majority";

async function fixPaymentsDirect() {
  console.log("🔧 DIRECT PAYMENT FIX SCRIPT\n");

  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB!\n");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    console.log("\n💡 Trying local MongoDB instead...");

    try {
      await mongoose.connect("mongodb://localhost:27017/copperstone_portal", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ Connected to local MongoDB!");
    } catch (localError) {
      console.error("❌ Local connection also failed");
      console.log("\nPlease make sure MongoDB is running!");
      process.exit(1);
    }
  }

  // Load models
  const Application = mongoose.model(
    "Application",
    new mongoose.Schema({
      applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      firstChoice: { type: mongoose.Schema.Types.ObjectId, ref: "Programme" },
      payment: mongoose.Schema.Types.Mixed, // Mixed type to handle both
      status: String,
      createdAt: Date,
    }),
  );

  const Payment = mongoose.model(
    "Payment",
    new mongoose.Schema({
      student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      application: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
      category: String,
      amount: Number,
      totalDue: Number,
      balanceAfterPayment: Number,
      currency: String,
      method: String,
      reference: String,
      status: String,
      description: String,
      remarks: String,
      verifiedAt: Date,
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: Date,
    }),
  );

  // ============================================
  // 1. FIND THE TEMPLATE APPLICATION
  // ============================================
  console.log("\n🔍 STEP 1: Finding template application...");

  const templateAppId = "695b807e94dbbc0be3199ebf";
  const templateApp = await Application.findById(templateAppId);

  if (!templateApp) {
    console.log(`❌ Application ${templateAppId} not found!`);

    // Show available applications
    const allApps = await Application.find({}).limit(5);
    console.log("\nFirst 5 applications in database:");
    allApps.forEach((app, i) => {
      console.log(`${i + 1}. ${app._id}`);
      console.log(
        `   Payment field: ${app.payment ? typeof app.payment : "none"}`,
      );
      if (app.payment && typeof app.payment === "object") {
        console.log(`   Amount: ${app.payment.amount || "N/A"}`);
      }
    });

    console.log("\n💡 Choose one of these IDs and update the script");
    process.exit(1);
  }

  console.log(`✅ Found: ${templateApp._id}`);
  console.log(`Payment type: ${typeof templateApp.payment}`);

  // ============================================
  // 2. ANALYZE TEMPLATE PAYMENT
  // ============================================
  let templatePaymentData;

  if (mongoose.Types.ObjectId.isValid(templateApp.payment)) {
    console.log("\n📋 Template already has ObjectId reference");
    const existingPayment = await Payment.findById(templateApp.payment);
    if (existingPayment) {
      console.log(`✅ Referenced payment exists: ${existingPayment._id}`);
      templatePaymentData = existingPayment.toObject();
    }
  } else if (templateApp.payment && typeof templateApp.payment === "object") {
    console.log("\n📋 Template has embedded payment:");
    console.log(`Amount: ${templateApp.payment.amount || "N/A"} ZMW`);
    console.log(`Method: ${templateApp.payment.method || "N/A"}`);
    console.log(`Status: ${templateApp.payment.status || "N/A"}`);
    templatePaymentData = templateApp.payment;
  } else {
    console.log("❌ Template has no usable payment data");
    process.exit(1);
  }

  // ============================================
  // 3. GET ALL APPLICATIONS
  // ============================================
  console.log("\n🔍 STEP 2: Getting all applications...");

  const allApplications = await Application.find({});
  console.log(`Total applications: ${allApplications.length}\n`);

  // ============================================
  // 4. FIX EACH APPLICATION
  // ============================================
  console.log("🔄 STEP 3: Fixing payments...\n");

  const results = {
    alreadyGood: 0,
    embeddedFixed: 0,
    noPaymentFixed: 0,
    errors: 0,
  };

  for (let i = 0; i < allApplications.length; i++) {
    const app = allApplications[i];

    try {
      console.log(`[${i + 1}/${allApplications.length}] ${app._id}`);

      // Check current state
      const isObjectId = mongoose.Types.ObjectId.isValid(app.payment);
      const isEmbedded =
        app.payment &&
        typeof app.payment === "object" &&
        app.payment.amount !== undefined;
      const hasNoPayment = !app.payment || app.payment === null;

      if (isObjectId) {
        // Check if payment exists
        const existingPayment = await Payment.findById(app.payment);
        if (existingPayment) {
          console.log(`  ✅ Already has Payment: ${existingPayment._id}`);
          results.alreadyGood++;
          continue;
        }
      }

      if (isEmbedded) {
        await fixEmbeddedPayment(app, templatePaymentData);
        results.embeddedFixed++;
      } else if (hasNoPayment) {
        await createNewPayment(app, templatePaymentData);
        results.noPaymentFixed++;
      } else {
        console.log(`  ⚠️ Unknown state`);
        results.errors++;
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      results.errors++;
    }
  }

  // ============================================
  // 5. FINAL REPORT
  // ============================================
  console.log("\n🎉 FINISHED!\n");
  console.log("📊 RESULTS:");
  console.log("───────────");
  console.log(`Already had proper payments: ${results.alreadyGood}`);
  console.log(`Fixed embedded payments: ${results.embeddedFixed}`);
  console.log(`Created new payments: ${results.noPaymentFixed}`);
  console.log(`Errors: ${results.errors}`);
  console.log(`Total processed: ${allApplications.length}`);

  // Final verification
  console.log("\n🔍 FINAL CHECK:");
  const finalEmbedded = await Application.countDocuments({
    "payment.amount": { $exists: true },
  });
  const finalWithRef = await Application.countDocuments({
    payment: { $type: "objectId" },
  });
  const totalPayments = await Payment.countDocuments({});

  console.log(`Applications with embedded: ${finalEmbedded} (should be 0)`);
  console.log(`Applications with references: ${finalWithRef}`);
  console.log(`Total Payment documents: ${totalPayments}`);

  console.log(
    "\n✅ Done! Your applications should now all have proper payment references.",
  );

  process.exit(0);
}

async function fixEmbeddedPayment(app, template) {
  const embedded = app.payment;

  // Create new Payment document
  const payment = new Payment({
    student: app.applicant,
    application: app._id,
    programme: app.firstChoice,
    category: "Application Fee",
    description: `Application Fee`,
    amount: embedded.amount || template.amount || 200,
    totalDue: embedded.amount || template.amount || 200,
    balanceAfterPayment: 0,
    currency: "ZMW",
    method: embedded.method || template.method || "Manual",
    reference: `APP-${app._id.toString().slice(-6)}-${Date.now().toString().slice(-4)}`,
    status: embedded.status || "Pending",
    remarks: embedded.remarks || "",
    verifiedAt: embedded.verifiedAt,
    verifiedBy: embedded.verifiedBy,
    createdAt: app.createdAt || new Date(),
    migration: {
      from: "embedded",
      migratedAt: new Date(),
    },
  });

  await payment.save();

  // Update application
  app.payment = payment._id;
  await app.save();

  console.log(`  ✅ Created Payment: ${payment._id} (${payment.amount} ZMW)`);
}

async function createNewPayment(app, template) {
  // Create new Payment based on template
  const payment = new Payment({
    student: app.applicant,
    application: app._id,
    programme: app.firstChoice,
    category: "Application Fee",
    description: `Application Fee`,
    amount: template.amount || 200,
    totalDue: template.amount || 200,
    balanceAfterPayment: 0,
    currency: "ZMW",
    method: template.method || "Manual",
    reference: `APP-${app._id.toString().slice(-6)}-NEW`,
    status: "Pending",
    remarks: "",
    createdAt: app.createdAt || new Date(),
    migration: {
      from: "no_payment",
      migratedAt: new Date(),
    },
  });

  await payment.save();

  // Update application
  app.payment = payment._id;
  await app.save();

  console.log(`  ✅ Created Payment: ${payment._id} (${payment.amount} ZMW)`);
}

// Run the script
fixPaymentsDirect().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
