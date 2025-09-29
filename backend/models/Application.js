const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ Programme Choices
    firstChoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Programme",
      required: true,
    },
    secondChoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Programme",
      required: false, // optional
    },

    // ✅ Supporting Documents stored on Google Cloud
    documents: [
      {
        name: String, // e.g. "Grade 12 Certificate"
        gcsUrl: String, // Public/Private GCS URL
      },
    ],

    // ✅ Status Flow
    status: {
      type: String,
      enum: ["Pending", "Under Review", "Approved", "Rejected"],
      default: "Pending",
    },
    remarks: String,

    submittedAt: { type: Date, default: Date.now },
    reviewedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
