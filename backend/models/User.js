// // backend/models/User.js
// const mongoose = require("mongoose");
// const passportLocalMongoose = require("passport-local-mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     fullName: { type: String, required: true },
//     email: { type: String, required: true, unique: true },

//     // Role system
//     role: {
//       type: String,
//       enum: [
//         "Student",
//         "Lecturer",
//         "Admin",
//         "AdmissionsOfficer",
//         "FinanceOfficer",
//         "Registrar",
//         "VC",
//       ],
//       default: "Student",
//     },

//     // Academic Tracking
//     programme: { type: mongoose.Schema.Types.ObjectId, ref: "Programme" },
//     level: {
//       type: String,
//       enum: ["Certificate", "Diploma", "Bachelor", "Masters"],
//     },

//     // Optional status
//     isActive: { type: Boolean, default: true },
//   },
//   { timestamps: true }
// );

// // ✅ Passport plugin adds username/password & helpers
// userSchema.plugin(passportLocalMongoose, {
//   usernameField: "email", // use email to login
//   errorMessages: {
//     UserExistsError: "A user with this email already exists.",
//   },
// });

// module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true }, // e.g. Samuel
    surname: { type: String, required: true }, // e.g. Katumba
    otherNames: { type: String }, // e.g. Mwape
    email: { type: String, required: true, unique: true },

    mobile: { type: String, required: true }, // ✅ new field

    // Role system
    role: {
      type: String,
      enum: [
        "Student",
        "Lecturer",
        "Admin",
        "AdmissionsOfficer",
        "FinanceOfficer",
        "Registrar",
        "VC",
      ],
      default: "Student",
    },

    // Academic Tracking
    programme: { type: mongoose.Schema.Types.ObjectId, ref: "Programme" },
    level: {
      type: String,
      enum: ["Certificate", "Diploma", "Bachelor", "Masters"],
    },

    // Optional status
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ Passport plugin adds username/password & helpers
userSchema.plugin(passportLocalMongoose, {
  usernameField: "email", // use email to login
  errorMessages: {
    UserExistsError: "A user with this email already exists.",
  },
});

module.exports = mongoose.model("User", userSchema);
