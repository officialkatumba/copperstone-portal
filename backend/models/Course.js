const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // e.g., "PSY101"
    name: { type: String, required: true }, // e.g., "Introduction to Psychology"
    description: String,
    credits: { type: Number, default: 3 }, // credit hours

    // ✅ A single course can belong to multiple programmes
    programmes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Programme",
      },
    ],

    // Lecturers teaching this course (can be one or more)
    lecturers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
