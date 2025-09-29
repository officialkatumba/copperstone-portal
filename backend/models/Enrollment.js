// backend/models/Enrollment.js
const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    programme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Programme",
      required: true,
    },

    semester: String, // e.g. "Fall 2025"
    status: {
      type: String,
      enum: ["Enrolled", "Completed", "Dropped"],
      default: "Enrolled",
    },
    grade: { type: String }, // e.g. "A", "B+", etc.
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);
