// backend/seedRegistrar.js
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const email = "registrar@copperstone.ac.zm";

    const existingRegistrar = await User.findOne({ email });

    if (existingRegistrar) {
      console.log("ℹ️ Registrar account already exists");
      process.exit(0);
    }

    // Create new Registrar user
    const registrar = new User({
      firstName: "University",
      surname: "Registrar",
      otherNames: "",
      email,
      mobile: "260971234567",
      role: "Registrar", // IMPORTANT: Make sure 'Registrar' is in your User schema roles
      staffProfile: {
        position: "University Registrar",
        department: "Academic Administration",
        officeNumber: "REG-001",
        employmentDate: new Date("2019-03-15"),
        staffId: "REG001",
        // Add other staff-specific fields if needed
      },
    });

    // Register using passport-local-mongoose (hash + salt)
    await User.register(registrar, "Registrar@Copperstone2024");

    console.log("✅ Registrar account created successfully");
    console.log("📧 Email: registrar@copperstone.ac.zm");
    console.log("🔑 Password: Registrar@Copperstone2024");
    console.log("⚠️ Please change password after first login!");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding Registrar:", err);
    process.exit(1);
  }
})();
