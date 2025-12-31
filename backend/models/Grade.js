const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema(
  {
    // Student reference
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Course reference
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // Lecturer who submitted the grade
    lecturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Academic period
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },

    academicYear: {
      type: String,
      required: true,
    },

    // Grade details
    grade: {
      type: String,
      enum: ["A", "B", "C", "D", "F", "I", "W"], // I=Incomplete, W=Withdrawn
      required: true,
    },

    percentage: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },

    marks: {
      type: Number,
    },

    // Status workflow
    status: {
      type: String,
      enum: [
        "Draft",
        "Submitted",
        "Under Review",
        "Approved",
        "Rejected",
        "Official",
      ],
      default: "Draft",
    },

    // Timestamps for each stage
    submittedAt: Date,
    reviewedAt: Date,
    approvedAt: Date,
    publishedAt: Date,

    // Comments
    lecturerComments: String,
    deanComments: String,
    registrarComments: String,

    // Rejection info
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rejectionReason: String,

    // Audit trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
gradeSchema.index(
  { student: 1, course: 1, semester: 1, academicYear: 1 },
  { unique: true }
);
gradeSchema.index({ lecturer: 1, status: 1 });
gradeSchema.index({ course: 1, status: 1 });

// Method to calculate grade points
gradeSchema.methods.getGradePoints = function () {
  const gradePoints = {
    A: 4.0,
    B: 3.0,
    C: 2.0,
    D: 1.0,
    F: 0.0,
    I: 0.0,
    W: 0.0,
  };
  return gradePoints[this.grade] || 0;
};

module.exports = mongoose.model("Grade", gradeSchema);
