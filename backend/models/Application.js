const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    programme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Programme",
      required: true,
    },
    documents: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
      },
    ],
    status: {
      type: String,
      enum: ["Pending", "Recommended", "Approved", "Rejected"],
      default: "Pending",
    },
    remarks: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admissions/Admin
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
