const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // e.g., "CS101"
    name: { type: String, required: true }, // e.g., "Introduction to Programming"
    description: String,
    credits: { type: Number, default: 3 }, // e.g., credit hours
    programme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Programme",
      required: true,
    },

    // Lecturers teaching this course (can be one or more)
    lecturers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
