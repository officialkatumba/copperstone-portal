// seedDean.js
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const email = "dean@copperstone.ac.zm";

    const existingDean = await User.findOne({ email });

    if (existingDean) {
      console.log("ℹ️ Dean account already exists");
      process.exit(0);
    }

    // Create new Dean user
    const dean = new User({
      firstName: "John",
      surname: "Mwansa",
      otherNames: "",
      email,
      mobile: "260970000001",
      role: "Dean", // IMPORTANT: ensure role 'Dean' is allowed in your User schema
    });

    // Register using passport-local-mongoose (hash + salt)
    await User.register(dean, "StrongPassword123");

    console.log("✅ Dean account created successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding Dean:", err);
    process.exit(1);
  }
})();
