// seedDeanOfStudents.js
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const email = "deanofstudents@copperstone.ac.zm";

    const existingDeanOfStudents = await User.findOne({ email });

    if (existingDeanOfStudents) {
      console.log("ℹ️ Dean of Students account already exists");
      console.log("ℹ️ Email:", existingDeanOfStudents.email);
      console.log("ℹ️ Role:", existingDeanOfStudents.role);
      process.exit(0);
    }

    // Create new Dean of Students user
    const deanOfStudents = new User({
      firstName: "Sarah",
      surname: "Chanda",
      otherNames: "",
      email: email,
      mobile: "260970000002",
      role: "DeanOfStudents", // IMPORTANT: ensure role 'DeanOfStudents' is in your User schema enum
    });

    // Register using passport-local-mongoose (hash + salt)
    await User.register(deanOfStudents, "StrongPassword123");

    console.log("✅ Dean of Students account created successfully");
    console.log("📋 Account Details:");
    console.log("   Name: Sarah Chanda");
    console.log("   Email: deanofstudents@copperstone.ac.zm");
    console.log("   Mobile: 260970000002");
    console.log("   Role: DeanOfStudents");
    console.log("   Password: StrongPassword123");
    console.log("\n⚠️ IMPORTANT: Change the password after first login!");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding Dean of Students:", err);

    // Provide helpful error messages
    if (err.name === "ValidationError") {
      console.error("\n🔍 Validation Error Details:");
      Object.keys(err.errors).forEach((key) => {
        console.error(`   ${key}: ${err.errors[key].message}`);
      });
    }

    if (err.message && err.message.includes("enum")) {
      console.error(
        "\n⚠️ Check if 'DeanOfStudents' is in your User schema enum array!"
      );
    }

    process.exit(1);
  }
})();
