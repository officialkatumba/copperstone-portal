// // backend/models/Application.js
// const mongoose = require("mongoose");

// const applicationSchema = new mongoose.Schema(
//   {
//     applicant: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     // ✅ Programme Choices
//     firstChoice: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Programme",
//       required: true,
//     },
//     secondChoice: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Programme",
//       required: false, // optional
//     },

//     // ✅ Supporting Documents stored on Google Cloud
//     documents: [
//       {
//         name: String, // e.g. "Grade 12 Certificate"
//         gcsUrl: String, // old/public style URL
//         gcsPath: String, // ✅ internal GCS object path for signed URL
//       },
//     ],

//     // ✅ Status Flow
//     status: {
//       type: String,
//       enum: ["Pending", "Under Review", "Approved", "Rejected"],
//       default: "Pending",
//     },
//     remarks: String,

//     submittedAt: { type: Date, default: Date.now },
//     reviewedAt: Date,
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Application", applicationSchema);

// backend/models/Application.js
// const mongoose = require("mongoose");

// const applicationSchema = new mongoose.Schema(
//   {
//     applicant: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     // ✅ Programme Choices
//     firstChoice: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Programme",
//       required: true,
//     },
//     secondChoice: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Programme",
//       required: false, // optional
//     },

//     // ✅ Supporting Documents stored on Google Cloud
//     documents: [
//       {
//         name: String, // e.g. "Grade 12 Certificate"
//         gcsUrl: String, // old/public style URL
//         gcsPath: String, // ✅ internal GCS object path for signed URL
//       },
//     ],

//     // ✅ Payment Information for Finance Verification
//     payment: {
//       amount: { type: Number }, // e.g. tuition or application fee
//       method: { type: String }, // e.g. "Bank Transfer", "Mobile Money"
//       reference: { type: String }, // transaction reference number
//       paidAt: { type: Date },

//       status: {
//         type: String,
//         enum: ["Pending", "Verified", "Rejected"],
//         default: "Pending",
//       },

//       remarks: { type: String }, // finance officer remarks
//       verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Finance officer
//       verifiedAt: { type: Date },
//     },

//     // ✅ Application Processing Status (Admissions)
//     status: {
//       type: String,
//       enum: ["Pending", "Under Review", "Approved", "Rejected"],
//       default: "Pending",
//     },
//     remarks: String,

//     submittedAt: { type: Date, default: Date.now },
//     reviewedAt: Date,
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Application", applicationSchema);

// const mongoose = require("mongoose");

// const applicationSchema = new mongoose.Schema(
//   {
//     applicant: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     firstChoice: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Programme",
//       required: true,
//     },
//     secondChoice: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Programme",
//     },

//     documents: [
//       {
//         name: String,
//         gcsUrl: String,
//         gcsPath: String,
//       },
//     ],

// ✅ Payment Info (attached during application)
// payment: {
//   amount: { type: Number },
//   method: { type: String }, // "Bank Transfer", "Mobile Money", etc.
//   reference: { type: String }, // transaction ref
//   proofUrl: { type: String }, // uploaded proof
//   paidAt: Date,

//   status: {
//     type: String,
//     enum: ["Pending", "Verified", "Rejected"],
//     default: "Pending",
//   },
//   remarks: String,
//   verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   verifiedAt: Date,
//   invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" }, // created upon verification
// },

// ✅ Payment Info (attached during application)
//     payment: {
//       amount: { type: Number },
//       method: {
//         type: String,
//         enum: ["Manual", "Electronic"], // ✅ restricted values
//         default: "Manual",
//       },
//       reference: { type: String }, // transaction ref
//       proofUrl: { type: String }, // uploaded proof
//       paidAt: Date,

//       status: {
//         type: String,
//         enum: ["Pending", "Verified", "Rejected"],
//         default: "Pending",
//       },
//       remarks: String,
//       verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//       verifiedAt: Date,
//       invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" }, // created upon verification
//     },

//     // ✅ Application progress (Admissions)
//     status: {
//       type: String,
//       enum: ["Pending", "Under Review", "Approved", "Rejected"],
//       default: "Pending",
//     },
//     remarks: String,

//     submittedAt: { type: Date, default: Date.now },
//     reviewedAt: Date,
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Application", applicationSchema);

// // backend/models/Application.js
// const mongoose = require("mongoose");

// const applicationSchema = new mongoose.Schema(
//   {
//     applicant: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     // ✅ Always store applicant’s email for reliability
//     // contactEmail: {
//     //   type: String,
//     //   required: false,
//     // },
//     applicantEmail: {
//       type: String,
//       required: false,
//     },

//     // ✅ Programme Choices
//     firstChoice: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Programme",
//       required: true,
//     },
//     secondChoice: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Programme",
//     },

//     // ✅ Supporting Documents
//     documents: [
//       {
//         name: String,
//         gcsUrl: String,
//         gcsPath: String,
//       },
//     ],

//     // ✅ Payment Info (attached during application)
//     payment: {
//       amount: { type: Number }, // e.g. ZMW 150
//       method: {
//         type: String,
//         enum: ["Manual", "Electronic"], // "Manual" = uploaded proof, "Electronic" = online gateway
//         default: "Manual",
//       },
//       reference: { type: String }, // transaction ref or receipt number
//       proofUrl: { type: String }, // uploaded proof file
//       paidAt: Date,

//       status: {
//         type: String,
//         enum: ["Pending", "Verified", "Rejected"],
//         default: "Pending",
//       },
//       remarks: String,
//       verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//       verifiedAt: Date,
//       invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" }, // generated upon verification
//     },

//     // ✅ Application progress (Admissions)
//     status: {
//       type: String,
//       enum: ["Pending", "Under Review", "Approved", "Rejected"],
//       default: "Pending",
//     },
//     remarks: String,

//     submittedAt: { type: Date, default: Date.now },
//     reviewedAt: Date,
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Application", applicationSchema);

// backend/models/Application.js
// const mongoose = require("mongoose");

// const applicationSchema = new mongoose.Schema(
//   {
//     applicant: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     applicantEmail: {
//       type: String,
//       required: false,
//     },

//     // ✅ Programme Choices
//     firstChoice: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Programme",
//       required: true,
//     },
//     secondChoice: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Programme",
//     },

//     // ✅ Supporting Documents
//     documents: [
//       {
//         name: String,
//         gcsUrl: String,
//         gcsPath: String,
//       },
//     ],

//     // ✅ Acceptance Letter (same structure as documents)
//     acceptanceLetter: {
//       name: { type: String, default: "Official Acceptance Letter" },
//       gcsUrl: String,
//       gcsPath: String,
//       uploadedAt: Date,
//     },

//     receipt: {
//       name: { type: String, default: "Official Payment Receipt" },
//       gcsUrl: String,
//       gcsPath: String,
//       issuedAt: Date,
//     },

//     // ✅ Payment Info (attached during application)
//     payment: {
//       amount: { type: Number },
//       method: {
//         type: String,
//         enum: ["Manual", "Electronic"],
//         default: "Manual",
//       },
//       sponsorship: {
//         type: String,
//         enum: ["Self Sponsored", "CDF Sponsored"],
//         default: "Self Sponsored",
//       },

//       reference: { type: String },
//       proofUrl: { type: String },
//       paidAt: Date,
//       status: {
//         type: String,
//         enum: ["Pending", "Verified", "Rejected"],
//         default: "Pending",
//       },
//       remarks: String,
//       verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//       verifiedAt: Date,
//       invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
//     },

//     // ✅ Application progress (Admissions)
//     status: {
//       type: String,
//       enum: ["Pending", "Under Review", "Approved", "Rejected"],
//       default: "Pending",
//     },
//     remarks: String,

//     submittedAt: { type: Date, default: Date.now },
//     reviewedAt: Date,
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Application", applicationSchema);

// backend/models/Application.js
const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    applicantEmail: {
      type: String,
      required: false,
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
    },

    modeOfStudy: {
      type: String,
      enum: ["Full Time", "Distance", "Evening", "Online"],
      default: "Full Time",
    },

    // ✅ Payment Reference (instead of embedded payment)
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },

    // ✅ Supporting Documents
    documents: [
      {
        name: String,
        gcsUrl: String,
        gcsPath: String,
      },
    ],

    // ✅ Acceptance Letter
    acceptanceLetter: {
      name: { type: String, default: "Official Acceptance Letter" },
      gcsUrl: String,
      gcsPath: String,
      uploadedAt: Date,
    },

    // ✅ Application progress
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
