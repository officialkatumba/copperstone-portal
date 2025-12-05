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

// // seedAdmissionsOfficer2.js
// const mongoose = require("mongoose");
// const User = require("./models/User");
// require("dotenv").config();

// (async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("✅ MongoDB Connected");

//     const email = "admissions2@copperstone.ac.zm"; // New email
//     const existingOfficer = await User.findOne({ email });

//     if (existingOfficer) {
//       console.log("ℹ️ Second Admissions Officer already exists");
//       process.exit(0);
//     }

//     // Create second Admissions Officer user
//     const officer = new User({
//       firstName: "Mary",
//       surname: "Phiri",
//       otherNames: "",
//       email,
//       mobile: "260976543210",
//       role: "AdmissionsOfficer",
//     });

//     // Register using passport-local-mongoose (hash & salt password)
//     await User.register(officer, "StrongPassword123");

//     console.log("✅ Second Admissions Officer account created successfully");
//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Error seeding second Admissions Officer:", err);
//     process.exit(1);
//   }
// })();

// seedAdmissionsOfficer3.js
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const email = "kaleoweddy@gmail.com";
    const existingOfficer = await User.findOne({ email });

    if (existingOfficer) {
      console.log(
        "ℹ️ Admissions Officer with email kaleoweddy@gmail.com already exists"
      );
      console.log("📧 Email:", existingOfficer.email);
      console.log("📱 Mobile:", existingOfficer.mobile);
      console.log("👤 Role:", existingOfficer.role);
      process.exit(0);
    }

    // Create Admissions Officer user with your provided details
    const officer = new User({
      firstName: "Weddy",
      surname: "Kaleo",
      otherNames: "",
      email: email,
      mobile: "0975201746", // Your provided mobile number
      role: "AdmissionsOfficer",
      department: "Admissions",
      isActive: true,
    });

    // Register using passport-local-mongoose (hash & salt password)
    await User.register(officer, "Admin@123"); // Using a strong password

    console.log("✅ Admissions Officer account created successfully!");
    console.log("📧 Email:", email);
    console.log("📱 Mobile:", officer.mobile);
    console.log("👤 Role:", officer.role);
    console.log("🔐 Password:", "Admin@123");
    console.log("👤 Name:", `${officer.firstName} ${officer.surname}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding Admissions Officer:", err);
    process.exit(1);
  }
})();
