const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
