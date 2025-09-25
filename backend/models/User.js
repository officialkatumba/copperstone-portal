const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },

    role: {
      type: String,
      enum: [
        "SuperAdmin",
        "Admin",
        "AdmissionsOfficer",
        "FinanceOfficer",
        "TeachingStaff",
        "Student",
      ],
      default: "Student",
    },

    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },

    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

// Plugin automatically adds username, hash, salt fields
// We want "email" to be used as the username
userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
});

module.exports = mongoose.model("User", userSchema);
