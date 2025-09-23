const groupSchema = new mongoose.Schema(
  {
    programme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Programme",
      required: true,
    },
    name: { type: String, required: true }, // e.g., "CS Year 1 - Group A"
    academicYear: { type: String, required: true }, // e.g., "2025/2026"
    semester: {
      type: String,
      enum: ["Semester 1", "Semester 2"],
      required: true,
    },

    // Multiple lecturers responsible for this group overall
    lecturers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Courses being taught to this group
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],

    capacity: { type: Number, default: 50 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);
