const mongoose = require("mongoose");

const programmeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: String,
    durationYears: Number,
    tuitionFee: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Programme", programmeSchema);
