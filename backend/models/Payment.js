// const mongoose = require("mongoose");
// const paymentSchema = new mongoose.Schema(
//   {
//     invoice: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Invoice",
//       required: true,
//     },
//     student: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     method: {
//       type: String,
//       enum: ["Online", "Manual", "CDF Sponsored"],
//       required: true,
//     },
//     proofUrl: String, // For manual uploads
//     transactionId: String, // For online payments
//     amount: { type: Number, required: true },
//     status: {
//       type: String,
//       enum: ["Pending", "Confirmed", "Rejected"],
//       default: "Pending",
//     },
//     verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Finance officer
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Payment", paymentSchema);

// const mongoose = require("mongoose");

// const paymentSchema = new mongoose.Schema(
//   {
//     student: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

// application: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Application",
//   required: true,
// },

//     method: {
//       type: String,
//       enum: ["Cash", "Electronic", "Online", "CDF Sponsored"],
//       required: true,
//     },

//     description: {
//       type: String,
//       required: true, // e.g. "Application Fee", "Tuition Deposit"
//     },

//     amount: {
//       type: Number,
//       required: true,
//     },

//     proofUrl: String,
//     transactionId: String,

//     status: {
//       type: String,
//       enum: ["Pending", "Verified", "Rejected"],
//       default: "Pending",
//     },

//     verifiedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },

//     verifiedAt: Date,

//     // ✅ RECEIPT INFO
//     receipt: {
//       name: { type: String, default: "Official Payment Receipt" },
//       gcsUrl: String,
//       gcsPath: String,
//       issuedAt: Date,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Payment", paymentSchema);

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // ==========================
    // WHO IS PAYING
    // ==========================
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: false,
    },

    programme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Programme",
    },

    // ==========================
    // PAYMENT CATEGORY
    // ==========================
    category: {
      type: String,
      // enum: [
      //   // Admissions / General
      //   "Application Fee",
      //   "Registration Fee",
      //   "Student Management Fee",
      //   "Medical Fee",

      //   // Tuition
      //   "Tuition Fee (Per Semester)",
      //   "Tuition Fee (Full Year)",

      //   // Academic
      //   "Exam Fee",
      //   "Library Fee",
      //   "Internet Fee",
      //   "Maintenance Fee",
      //   "Distance Learning Logistics",

      //   // Final-Year / Postgraduate
      //   "Research Fee",
      //   "Graduation Fee",

      //   // Penalties / Misc
      //   "Penalty",
      //   "Other",
      // ],
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================
    // AMOUNT
    // ==========================
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ADD ONLY THESE 2 NEW FIELDS:
    totalDue: {
      type: Number,
      required: true,
      min: 0,
    },
    balanceAfterPayment: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "ZMW",
    },

    // ==========================
    // PAYMENT METHOD
    // ==========================
    method: {
      type: String,
      enum: ["Cash", "Electronic", "Online", "CDF", "Manual"],
      required: true,
    },

    reference: {
      type: String, // receipt number / transaction id
      trim: true,
    },

    // Required ONLY for Electronic
    proofOfPayment: {
      gcsUrl: String,
      gcsPath: String,
      uploadedAt: Date,
    },

    // ==========================
    // SEMESTER / ACADEMIC INFO
    // ==========================
    semester: {
      type: String,
      enum: [
        "Semester 1",
        "Semester 2",
        "Semester 3",
        "Semester 4",
        "Semester 5",
        "Semester 6",
        "Semester 7",
        "Semester 8",
      ],
    },

    academicYear: {
      type: String, // e.g. 2025/2026
    },

    // ==========================
    // PAYMENT STATUS
    // ==========================
    status: {
      type: String,
      // enum: ["Pending", "Verified", "Rejected"],
      enum: [
        "Pending",
        "Verified",
        "Partially Paid",
        "Fully Paid",
        "Cancelled",
        "Rejected",
      ],

      default: "Pending",
    },

    remarks: {
      type: String,
    },

    // ==========================
    // VERIFICATION (FINANCE)
    // ==========================
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    verifiedAt: Date,

    // ==========================
    // RECEIPT
    // ==========================
    // receipt: {
    //   name: {
    //     type: String,
    //     default: "Official Payment Receipt",
    //   },
    //   gcsUrl: String,
    //   gcsPath: String,
    //   issuedAt: Date,
    // },
    receipt: {
      name: {
        type: String,
        default: "Official Payment Receipt",
      },
      gcsPath: {
        type: String,
        required: false,
      },
      issuedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
