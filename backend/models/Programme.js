// backend/models/Programme.js
const mongoose = require("mongoose");

const programmeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: String,
    durationYears: Number,
    tuitionFee: Number,

    // ✅ Level of degree
    level: {
      type: String,
      enum: ["Certificate", "Diploma", "Bachelor", "Masters"],
      required: true,
    },

    // ✅ List of courses in this programme
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Programme", programmeSchema);
