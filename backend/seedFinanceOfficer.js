// const mongoose = require("mongoose");
// const User = require("./models/User");
// require("dotenv").config();

// (async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("✅ MongoDB Connected");

//     const email = "finance@copperstone.ac.zm";
//     const existingOfficer = await User.findOne({ email });

//     if (existingOfficer) {
//       console.log("ℹ️ Finance Officer already exists");
//       process.exit(0);
//     }

//     // Create new Finance Officer user
//     const officer = new User({
//       firstName: "Lydia",
//       surname: "Mwansa",
//       otherNames: "",
//       email,
//       mobile: "260977123456",
//       role: "FinanceOfficer",
//     });

//     // Register using passport-local-mongoose (hash & salt password)
//     await User.register(officer, "FinancePass123");

//     console.log("✅ Finance Officer account created successfully");
//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Error seeding Finance Officer:", err);
//     process.exit(1);
//   }
// })();

const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const email = "finance2@copperstone.ac.zm"; // NEW finance officer email
    const existingOfficer = await User.findOne({ email });

    if (existingOfficer) {
      console.log("ℹ️ Second Finance Officer already exists");
      process.exit(0);
    }

    // Create second Finance Officer user
    const officer = new User({
      firstName: "John",
      surname: "Zimba",
      otherNames: "",
      email,
      mobile: "260977654321",
      role: "FinanceOfficer",
    });

    // Register using passport-local-mongoose (hash & salt password)
    await User.register(officer, "FinancePass123");

    console.log("✅ Second Finance Officer account created successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding second Finance Officer:", err);
    process.exit(1);
  }
})();
