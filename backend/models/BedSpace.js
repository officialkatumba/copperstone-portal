const mongoose = require("mongoose");

const bedSpaceSchema = new mongoose.Schema(
  {
    // Simple identifier: "101A", "101B", "102A", etc.
    bedCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Room info (just for display)
    roomNumber: String,
    wing: {
      type: String,
      enum: ["Female", "Male"],
      required: true,
    },
    floor: Number,

    // Status
    status: {
      type: String,
      enum: ["available", "occupied"],
      default: "available",
    },

    // Student info (if occupied)
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    studentName: String,
    studentId: String,

    // Semester info
    semester: {
      type: String,
      default: "Semester 1, 2024",
    },

    // Simple payment tracking
    feeType: {
      type: String,
      enum: ["full-time", "part-time"],
      default: "full-time",
    },
    amount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending"],
      default: "pending",
    },
    paymentDate: Date,

    // Dates
    allocatedDate: Date,
    vacatedDate: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BedSpace", bedSpaceSchema);
