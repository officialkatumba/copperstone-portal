// const mongoose = require("mongoose");
// const passportLocalMongoose = require("passport-local-mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     firstName: { type: String, required: true }, // e.g. Samuel
//     surname: { type: String, required: true }, // e.g. Katumba
//     otherNames: { type: String }, // e.g. Mwape
//     email: { type: String, required: true, unique: true },

//     mobile: { type: String, required: true }, // ✅ new field

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
    firstName: { type: String, required: true },
    surname: { type: String, required: true },
    otherNames: { type: String },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },

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

    // ✅ Academic Tracking
    appliedCourses: [
      {
        firstChoice: { type: mongoose.Schema.Types.ObjectId, ref: "Programme" },
        secondChoice: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Programme",
        },
        appliedAt: { type: Date, default: Date.now },
      },
    ],

    // ✅ Multiple approved courses (each with approval and start date)
    approvedCourses: [
      {
        programme: { type: mongoose.Schema.Types.ObjectId, ref: "Programme" },
        approvalDate: { type: Date, default: Date.now },
        startDate: { type: Date },
      },
    ],

    // ✅ Current active programme (for enrolled students)
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

// ✅ Use email for login with password hashing
userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
  errorMessages: {
    UserExistsError: "A user with this email already exists.",
  },
});

module.exports = mongoose.model("User", userSchema);
