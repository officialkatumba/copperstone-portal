// const mongoose = require("mongoose");

// const skillApplicationSchema = new mongoose.Schema(
//   {
//     applicant: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     applicantEmail: String,

//     skill: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Skill",
//       required: true,
//     },

//     documents: [
//       {
//         name: String,
//         gcsUrl: String,
//         gcsPath: String,
//       },
//     ],

//     payment: {
//       method: {
//         type: String,
//         enum: ["Manual", "Electronic", "CDF Sponsored"],
//         default: "Manual",
//       },
//       status: {
//         type: String,
//         enum: ["Approved"],
//         default: "Approved",
//       },
//     },

//     status: {
//       type: String,
//       enum: ["Pending", "Approved", "Rejected"],
//       default: "Pending",
//     },

//     submittedAt: { type: Date, default: Date.now },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("SkillApplication", skillApplicationSchema);

// models/SkillApplication.js
const mongoose = require("mongoose");

const skillApplicationSchema = new mongoose.Schema(
  {
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    applicantEmail: String,

    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
    },

    documents: [
      {
        name: String,
        gcsUrl: String,
        gcsPath: String,
      },
    ],
    acceptanceLetter: {
      name: { type: String },
      gcsUrl: String,
      gcsPath: String,
      uploadedAt: Date,
    },

    payment: {
      method: {
        type: String,
        enum: ["Manual", "Electronic", "CDF Sponsored"],
        default: "Manual",
      },
      amount: Number,
      status: {
        type: String,
        enum: ["Pending", "Verified", "Rejected"],
        default: "Pending",
      },
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SkillApplication", skillApplicationSchema);
