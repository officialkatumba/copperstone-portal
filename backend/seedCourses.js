const mongoose = require("mongoose");
const Course = require("./models/Course");
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const courses = [
      { code: "CHT 1101", name: "Chemistry I" },
      { code: "PHY 1102", name: "Physics I" },
      { code: "MAT 1103", name: "Mathematics I" },
      { code: "BIO 1104", name: "Biology I" },
      { code: "CS 101", name: "Communication Skills" },
    ];

    for (const c of courses) {
      const exists = await Course.findOne({ code: c.code });
      if (!exists) {
        await Course.create(c);
        console.log("Created:", c.code);
      } else {
        console.log("Exists:", c.code);
      }
    }

    console.log("Seeding complete");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

// const mongoose = require("mongoose");
// const User = require("./models/User");

// // Load env from project root
// require("dotenv").config({
//   path: require("path").resolve(__dirname, "..", ".env"),
// });

// (async () => {
//   try {
//     console.log("Loaded MONGO_URI:", process.env.MONGO_URI); // Debug
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("✅ MongoDB Connected");

//     const email = "dean@copperstone.ac.zm";
//     const existingDean = await User.findOne({ email });

//     if (existingDean) {
//       console.log("ℹ️ Dean account already exists");
//       process.exit(0);
//     }

//     const dean = new User({
//       firstName: "John",
//       surname: "Mwansa",
//       email,
//       mobile: "260970000001",
//       role: "Dean",
//     });

//     await User.register(dean, "StrongPassword123");

//     console.log("✅ Dean account created successfully");
//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Error seeding Dean:", err);
//     process.exit(1);
//   }
// })();
