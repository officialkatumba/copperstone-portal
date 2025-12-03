// // seedAdmissionsOfficer.js
// const mongoose = require("mongoose");
// const User = require("./models/User");
// require("dotenv").config();

// (async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("✅ MongoDB Connected");

//     const email = "admissions@copperstone.ac.zm";
//     const existingOfficer = await User.findOne({ email });

//     if (existingOfficer) {
//       console.log("ℹ️ Admissions Officer already exists");
//       process.exit(0);
//     }

//     // Create new Admissions Officer user
//     const officer = new User({
//       firstName: "Patrick",
//       surname: "Kapasa",
//       otherNames: "",
//       email,
//       mobile: "260971234567",
//       role: "AdmissionsOfficer",
//     });

//     // Register using passport-local-mongoose (hash & salt password)
//     await User.register(officer, "StrongPassword123");

//     console.log("✅ Admissions Officer account created successfully");
//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Error seeding Admissions Officer:", err);
//     process.exit(1);
//   }
// })();

// seedAdmissionsOfficer2.js
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const email = "admissions2@copperstone.ac.zm"; // New email
    const existingOfficer = await User.findOne({ email });

    if (existingOfficer) {
      console.log("ℹ️ Second Admissions Officer already exists");
      process.exit(0);
    }

    // Create second Admissions Officer user
    const officer = new User({
      firstName: "Mary",
      surname: "Phiri",
      otherNames: "",
      email,
      mobile: "260976543210",
      role: "AdmissionsOfficer",
    });

    // Register using passport-local-mongoose (hash & salt password)
    await User.register(officer, "StrongPassword123");

    console.log("✅ Second Admissions Officer account created successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding second Admissions Officer:", err);
    process.exit(1);
  }
})();
