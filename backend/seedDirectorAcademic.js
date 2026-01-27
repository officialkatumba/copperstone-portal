// // seedDirectorAcademic.js
// const mongoose = require("mongoose");
// const User = require("./models/User");
// require("dotenv").config();

// (async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("✅ MongoDB Connected");

//     const email = "directoracademic@copperstone.ac.zm";

//     const existingDirector = await User.findOne({ email });

//     if (existingDirector) {
//       console.log("ℹ️ Director Academic account already exists");
//       console.log("ℹ️ Email:", existingDirector.email);
//       console.log("ℹ️ Role:", existingDirector.role);
//       console.log("ℹ️ ID:", existingDirector._id);

//       // Check if Director Academic has proper profile setup
//       if (!existingDirector.directorAcademicProfile) {
//         console.log("⚠️ Director Academic profile not properly configured");
//         console.log("Updating profile configuration...");

//         existingDirector.directorAcademicProfile = {
//           faculty: "Academic Affairs",
//           department: "Academic Administration",
//           clearanceLevel: "High",
//           canResetClearance: true,
//           canBulkClear: true,
//           assignedProgrammes: [], // Will be populated with actual programmes
//         };

//         await existingDirector.save();
//         console.log("✅ Director Academic profile updated successfully");
//       }

//       process.exit(0);
//     }

//     // Create new Director Academic user with complete profile
//     const directorAcademic = new User({
//       firstName: "David",
//       surname: "Mwansa",
//       otherNames: "Chanda",
//       email: email,
//       mobile: "260970000003",
//       role: "DirectorAcademic",

//       // Director Academic specific profile
//       directorAcademicProfile: {
//         faculty: "Academic Affairs",
//         department: "Academic Administration",
//         clearanceLevel: "High",
//         canResetClearance: true,
//         canBulkClear: true,
//         assignedProgrammes: [], // Empty array - will be populated with actual programmes
//       },
//     });

//     // Register using passport-local-mongoose (hash + salt)
//     await User.register(directorAcademic, "AcademicDirector2024!");

//     console.log("✅ Director Academic account created successfully");
//     console.log("=".repeat(60));
//     console.log("📋 ACCOUNT DETAILS:");
//     console.log("=".repeat(60));
//     console.log("   Name: David Chanda Mwansa");
//     console.log("   Email: directoracademic@copperstone.ac.zm");
//     console.log("   Mobile: +260 970 000 003");
//     console.log("   Role: DirectorAcademic");
//     console.log("   Password: AcademicDirector2024!");
//     console.log("");
//     console.log("📊 PROFILE CONFIGURATION:");
//     console.log("   Faculty: Academic Affairs");
//     console.log("   Department: Academic Administration");
//     console.log("   Clearance Level: High");
//     console.log("   Can Reset Clearance: Yes");
//     console.log("   Can Perform Bulk Clearance: Yes");
//     console.log("=".repeat(60));
//     console.log("");
//     console.log("⚠️  SECURITY NOTICE:");
//     console.log("   1. Change password after first login");
//     console.log("   2. Assign programmes to Director Academic via admin panel");
//     console.log("   3. Review clearance permissions regularly");
//     console.log("");

//     // Test the account by logging in
//     console.log("🧪 TESTING ACCOUNT CREATION...");
//     const testUser = await User.findOne({ email: email });
//     if (testUser) {
//       console.log("✅ Account verified in database");
//       console.log("✅ Role:", testUser.role);
//       console.log(
//         "✅ Director Profile:",
//         testUser.directorAcademicProfile ? "Configured" : "Missing"
//       );

//       // Test clearance helper methods
//       console.log("");
//       console.log("🧪 TESTING CLEARANCE HELPER METHODS:");

//       // Create a test student to demonstrate clearance functionality
//       const testStudent = new User({
//         firstName: "Test",
//         surname: "Student",
//         email: "test.student@copperstone.ac.zm",
//         mobile: "260970000999",
//         role: "Student",
//         currentSemester: 1,
//         level: "Bachelor",
//         studentProfile: {
//           registrationStatus: "Approved",
//           academicClearance: {
//             currentSemesterClearance: {
//               semester: 1,
//               academicYear: "2024/2025",
//               cleared: false,
//               clearanceLevel: "Pending",
//             },
//             clearanceHistory: [],
//           },
//         },
//       });

//       await testStudent.save();
//       console.log("✅ Test student created for demonstration");
//       console.log("   Student ID:", testStudent._id);
//       console.log("   Clearance Status:", testStudent.getClearanceStatus());

//       // Clean up test student
//       await User.deleteOne({ _id: testStudent._id });
//       console.log("✅ Test student cleaned up");
//     }

//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Error seeding Director Academic:", err);
//     console.error("");

//     // Provide helpful error messages
//     if (err.name === "ValidationError") {
//       console.error("🔍 VALIDATION ERROR DETAILS:");
//       console.error("=".repeat(40));
//       Object.keys(err.errors).forEach((key) => {
//         console.error(`   ${key}: ${err.errors[key].message}`);
//       });
//     }

//     if (err.message && err.message.includes("enum")) {
//       console.error("");
//       console.error("⚠️  ROLE VALIDATION ERROR:");
//       console.error(
//         "   Check if 'DirectorAcademic' is in your User schema enum array!"
//       );
//       console.error(
//         "   Current valid roles:",
//         err.errors?.role?.properties?.enum || "Unknown"
//       );
//     }

//     if (err.code === 11000) {
//       console.error("");
//       console.error("⚠️  DUPLICATE KEY ERROR:");
//       console.error("   A user with this email already exists!");
//     }

//     // MongoDB connection error
//     if (err.name === "MongoNetworkError") {
//       console.error("");
//       console.error("🔌 MONGODB CONNECTION ERROR:");
//       console.error("   Check your MONGO_URI in .env file");
//       console.error("   Ensure MongoDB is running");
//     }

//     console.error("");
//     console.error("🔧 TROUBLESHOOTING TIPS:");
//     console.error(
//       "   1. Check if User model has 'DirectorAcademic' in role enum"
//     );
//     console.error("   2. Verify MongoDB connection string in .env");
//     console.error(
//       "   3. Ensure passport-local-mongoose is properly configured"
//     );
//     console.error("   4. Check for duplicate email addresses");

//     process.exit(1);
//   }
// })();

const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

(async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const email = "directoracademic@copperstone.ac.zm";

    // Check if Director Academic already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("ℹ️ Director Academic already exists");
      console.log("   Email:", existingUser.email);
      console.log("   Role :", existingUser.role);
      process.exit(0);
    }

    // Create Director Academic user
    const directorAcademic = new User({
      firstName: "David",
      surname: "Mwansa",
      otherNames: "Chanda",
      email,
      mobile: "260970000003",
      role: "DirectorAcademic",

      // OPTIONAL: keep empty profile for future use (safe)
      directorAcademicProfile: {
        faculty: "Academic Affairs",
        department: "Academic Administration",
      },
    });

    // Register user (passport-local-mongoose handles hash & salt)
    await User.register(directorAcademic, "AcademicDirector2024!");

    console.log("✅ Director Academic account created successfully");
    console.log("=".repeat(50));
    console.log("Name     : David Chanda Mwansa");
    console.log("Email    : directoracademic@copperstone.ac.zm");
    console.log("Role     : DirectorAcademic");
    console.log("Password : AcademicDirector2024!");
    console.log("=".repeat(50));
    console.log("⚠️ Change password after first login");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding Director Academic");

    if (err.code === 11000) {
      console.error("⚠️ Duplicate email detected");
    } else if (err.name === "MongoNetworkError") {
      console.error("⚠️ MongoDB connection failed — check MONGO_URI");
    } else if (err.message?.includes("enum")) {
      console.error("⚠️ Ensure 'DirectorAcademic' exists in User.role enum");
    } else {
      console.error(err);
    }

    process.exit(1);
  }
})();
