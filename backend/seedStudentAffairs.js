// seedStudentAffairs.js
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const email = "studentaffairs@copperstone.ac.zm";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("ℹ️ Student Affairs account already exists");
      console.log("ℹ️ Email:", existingUser.email);
      console.log("ℹ️ Role:", existingUser.role);
      process.exit(0);
    }

    // Create new Student Affairs Admin user
    const studentAffairsUser = new User({
      firstName: "Student",
      surname: "Affairs",
      otherNames: "Admin",
      email,
      mobile: "260970000002",
      role: "StudentAffairs", // Temporary role for testing
      department: "Student Affairs",
    });

    // Register using passport-local-mongoose (hash + salt)
    await User.register(studentAffairsUser, "Test123");

    console.log("✅ Student Affairs account created successfully");
    console.log("📧 Email: studentaffairs@copperstone.ac.zm");
    console.log("🔑 Password: Test123");
    console.log("🎯 Role: StudentAffairs");
    console.log("📌 Note: This is a temporary role for testing");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding Student Affairs user:", err);
    process.exit(1);
  }
})();
