// // const groupSchema = new mongoose.Schema(
// //   {
// //     programme: {
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: "Programme",
// //       required: true,
// //     },
// //     name: { type: String, required: true }, // e.g., "CS Year 1 - Group A"
// //     academicYear: { type: String, required: true }, // e.g., "2025/2026"
// //     semester: {
// //       type: String,
// //       enum: ["Semester 1", "Semester 2","Semester 3", "Semester 4","Semester 5","Semester 6","Semester 7","Semester 8"]
// //       required: true,
// //     },

// //     // Multiple lecturers responsible for this group overall
// //     lecturers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

// //     // Courses being taught to this group
// //     courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],

// //     capacity: { type: Number, default: 50 },
// //   },
// //   { timestamps: true }
// // );

// // module.exports = mongoose.model("Group", groupSchema);

// const mongoose = require("mongoose");

// const groupSchema = new mongoose.Schema(
//   {
//     // Basic Information
//     programme: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Programme",
//       required: [true, "Programme is required"],
//     },
//     name: {
//       type: String,
//       required: [true, "Group name is required"],
//       trim: true,
//       maxlength: [100, "Group name cannot exceed 100 characters"],
//     },

//     // Academic Information
//     academicYear: {
//       type: String,
//       required: [true, "Academic year is required"],
//       match: [/^\d{4}\/\d{4}$/, "Academic year must be in format YYYY/YYYY"],
//     },
//     semester: {
//       type: String,
//       enum: [
//         "Semester 1",
//         "Semester 2",
//         "Semester 3",
//         "Semester 4",
//         "Semester 5",
//         "Semester 6",
//         "Semester 7",
//         "Semester 8",
//         "Trimester 1",
//         "Trimester 2",
//         "Trimester 3",
//         "Quarter 1",
//         "Quarter 2",
//         "Quarter 3",
//         "Quarter 4",
//         "Summer Session",
//         "Winter Session",
//         "Special Term",
//       ],
//       required: [true, "Semester is required"],
//     },

//     // Academic Level
//     yearOfStudy: {
//       type: Number,
//       min: 1,
//       max: 8,
//       required: [true, "Year of study is required"],
//     },

//     // Department/Unit Information
//     department: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Department",
//       required: [true, "Department is required"],
//     },

//     // Group Classification
//     groupType: {
//       type: String,
//       enum: [
//         "Regular",
//         "Evening",
//         "Weekend",
//         "Distance",
//         "Part-time",
//         "Accelerated",
//         "Special",
//         "Remedial",
//       ],
//       default: "Regular",
//     },
//     section: {
//       type: String,
//       enum: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
//       default: "A",
//     },

//     // Academic Team
//     lecturers: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         validate: {
//           validator: function (v) {
//             // Ensure all lecturers have Lecturer role
//             return mongoose
//               .model("User")
//               .find({ _id: { $in: v }, role: "Lecturer" })
//               .then((lecturers) => lecturers.length === v.length);
//           },
//           message: "All assigned users must be lecturers",
//         },
//       },
//     ],

//     // Group Coordinator (Lead Lecturer)
//     coordinator: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       validate: {
//         validator: async function (v) {
//           if (!v) return true; // Coordinator is optional
//           const user = await mongoose.model("User").findById(v);
//           return user && user.role === "Lecturer";
//         },
//         message: "Coordinator must be a lecturer",
//       },
//     },

//     // Courses being taught to this group
//     courses: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Course",
//         validate: {
//           validator: function (v) {
//             return v.length <= 10; // Max 10 courses per group
//           },
//           message: "A group cannot have more than 10 courses",
//         },
//       },
//     ],

//     // Students in this group
//     students: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         validate: {
//           validator: function (v) {
//             return v.length <= this.capacity;
//           },
//           message: "Number of students exceeds group capacity",
//         },
//       },
//     ],

//     // Capacity & Enrollment
//     capacity: {
//       type: Number,
//       default: 50,
//       min: [1, "Capacity must be at least 1"],
//       max: [500, "Capacity cannot exceed 500"],
//     },
//     currentEnrollment: {
//       type: Number,
//       default: 0,
//       validate: {
//         validator: function (v) {
//           return v <= this.capacity && v >= 0;
//         },
//         message: "Enrollment cannot exceed capacity or be negative",
//       },
//     },
//     enrollmentStatus: {
//       type: String,
//       enum: ["Open", "Closed", "Full", "Waitlisted", "Cancelled"],
//       default: "Open",
//     },

//     // Schedule Information
//     meetingDays: [
//       {
//         type: String,
//         enum: [
//           "Monday",
//           "Tuesday",
//           "Wednesday",
//           "Thursday",
//           "Friday",
//           "Saturday",
//           "Sunday",
//         ],
//       },
//     ],
//     meetingTime: {
//       start: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
//       end: { type: String, match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
//     },
//     venue: {
//       type: String,
//       maxlength: [200, "Venue cannot exceed 200 characters"],
//     },

//     // Academic Dates
//     startDate: {
//       type: Date,
//       validate: {
//         validator: function (v) {
//           return !this.endDate || v < this.endDate;
//         },
//         message: "Start date must be before end date",
//       },
//     },
//     endDate: Date,
//     registrationDeadline: Date,

//     // Fees & Financials
//     tuitionFee: {
//       type: Number,
//       min: 0,
//       default: 0,
//     },
//     otherFees: [
//       {
//         name: String,
//         amount: { type: Number, min: 0 },
//         dueDate: Date,
//       },
//     ],

//     // Group Performance Tracking
//     averageGrade: {
//       type: Number,
//       min: 0,
//       max: 100,
//       default: 0,
//     },
//     attendanceRate: {
//       type: Number,
//       min: 0,
//       max: 100,
//       default: 0,
//     },

//     // Status & Metadata
//     status: {
//       type: String,
//       enum: [
//         "Draft",
//         "Active",
//         "Inactive",
//         "Suspended",
//         "Completed",
//         "Archived",
//         "Merged",
//         "Split",
//       ],
//       default: "Draft",
//     },

//     // Approval Workflow
//     approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     approvedAt: Date,
//     rejectionReason: String,

//     // Audit Trail
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: [true, "Creator is required"],
//     },
//     lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

//     // Soft Delete
//     isActive: { type: Boolean, default: true },
//     deletedAt: Date,
//     deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

//     // Versioning
//     version: { type: Number, default: 1 },
//     previousVersion: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },

//     // Metadata for Reporting
//     tags: [String],
//     notes: {
//       type: String,
//       maxlength: [500, "Notes cannot exceed 500 characters"],
//     },

//     // External System Integration
//     externalId: String,
//     sisId: String, // Student Information System ID
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   }
// );

// // Virtuals
// groupSchema.virtual("availableSpots").get(function () {
//   return Math.max(0, this.capacity - this.currentEnrollment);
// });

// groupSchema.virtual("enrollmentPercentage").get(function () {
//   return this.capacity > 0
//     ? Math.round((this.currentEnrollment / this.capacity) * 100)
//     : 0;
// });

// groupSchema.virtual("fullName").get(function () {
//   return `${this.name} - ${this.academicYear} - ${this.semester}`;
// });

// // Indexes for Performance
// groupSchema.index({ programme: 1, academicYear: 1, semester: 1 });
// groupSchema.index({ status: 1, isActive: 1 });
// groupSchema.index({ createdBy: 1 });
// groupSchema.index({ department: 1 });
// groupSchema.index({ lecturers: 1 });
// groupSchema.index({ students: 1 });
// groupSchema.index({ name: "text", notes: "text" });

// // Pre-save Middleware
// groupSchema.pre("save", async function (next) {
//   // Update currentEnrollment based on students array
//   if (this.isModified("students")) {
//     this.currentEnrollment = this.students.length;

//     // Update enrollment status
//     if (this.currentEnrollment >= this.capacity) {
//       this.enrollmentStatus = "Full";
//     } else if (this.currentEnrollment > 0) {
//       this.enrollmentStatus = "Open";
//     }
//   }

//   // Set approvedAt when approvedBy is set
//   if (this.isModified("approvedBy") && this.approvedBy && !this.approvedAt) {
//     this.approvedAt = new Date();
//   }

//   // Update lastModifiedBy
//   if (this.isModified()) {
//     // This should be set by the controller from the logged-in user
//   }

//   // Auto-generate name if not provided
//   if (!this.name && this.programme && this.yearOfStudy && this.section) {
//     const programme = await mongoose
//       .model("Programme")
//       .findById(this.programme);
//     if (programme) {
//       this.name = `${programme.code} Year ${this.yearOfStudy} - Group ${this.section}`;
//     }
//   }

//   next();
// });

// // Pre-remove Middleware (for soft delete)
// groupSchema.pre("remove", async function (next) {
//   // Prevent deletion if group has active students
//   if (this.currentEnrollment > 0) {
//     throw new Error("Cannot delete group with enrolled students");
//   }
//   next();
// });

// // Static Methods
// groupSchema.statics.findByAcademicYear = function (academicYear) {
//   return this.find({ academicYear, isActive: true });
// };

// groupSchema.statics.findByLecturer = function (lecturerId) {
//   return this.find({
//     lecturers: lecturerId,
//     isActive: true,
//     status: { $in: ["Active", "Draft"] },
//   });
// };

// groupSchema.statics.findByStudent = function (studentId) {
//   return this.find({
//     students: studentId,
//     isActive: true,
//     status: { $in: ["Active"] },
//   });
// };

// groupSchema.statics.getAvailableGroups = function (
//   programmeId,
//   academicYear,
//   semester
// ) {
//   return this.find({
//     programme: programmeId,
//     academicYear,
//     semester,
//     enrollmentStatus: { $in: ["Open"] },
//     isActive: true,
//     status: "Active",
//     currentEnrollment: { $lt: { $expr: "$capacity" } },
//   });
// };

// // Instance Methods
// groupSchema.methods.canEnrollStudent = function () {
//   return (
//     this.isActive &&
//     this.status === "Active" &&
//     this.enrollmentStatus === "Open" &&
//     this.currentEnrollment < this.capacity
//   );
// };

// groupSchema.methods.getScheduleSummary = function () {
//   if (!this.meetingDays || !this.meetingTime) return "Schedule not set";
//   return `${this.meetingDays.join(", ")} ${this.meetingTime.start} - ${
//     this.meetingTime.end
//   }`;
// };

// groupSchema.methods.toSummary = function () {
//   return {
//     id: this._id,
//     name: this.name,
//     fullName: this.fullName,
//     programme: this.programme,
//     academicYear: this.academicYear,
//     semester: this.semester,
//     enrollment: `${this.currentEnrollment}/${this.capacity}`,
//     status: this.status,
//     enrollmentStatus: this.enrollmentStatus,
//     availableSpots: this.availableSpots,
//   };
// };

// // Query Helpers
// groupSchema.query.active = function () {
//   return this.where({ isActive: true });
// };

// groupSchema.query.byStatus = function (status) {
//   return this.where({ status });
// };

// groupSchema.query.byDepartment = function (departmentId) {
//   return this.where({ department: departmentId });
// };

// module.exports = mongoose.model("Group", groupSchema);

// const mongoose = require("mongoose");

// const groupSchema = new mongoose.Schema(
//   {
//     // Basic Information
//     programme: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Programme",
//       required: true,
//     },
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     // Academic Information
//     academicYear: {
//       type: String,
//       required: true,
//     },
//     semester: {
//       type: String,
//       enum: [
//         "Semester 1",
//         "Semester 2",
//         "Semester 3",
//         "Semester 4",
//         "Semester 5",
//         "Semester 6",
//         "Semester 7",
//         "Semester 8",
//       ],
//       required: true,
//     },

//     // Academic Level
//     yearOfStudy: {
//       type: Number,
//       min: 1,
//       max: 8,
//       required: true,
//     },

//     // Group Classification
//     groupType: {
//       type: String,
//       enum: ["Regular", "Evening", "Weekend", "Distance", "Part-time"],
//       default: "Regular",
//     },
//     section: {
//       type: String,
//       default: "A",
//     },

//     // Academic Team
//     lecturers: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],

//     // Group Coordinator (Lead Lecturer)
//     coordinator: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },

//     // Courses being taught to this group
//     courses: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Course",
//       },
//     ],

//     // Students in this group
//     students: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//       },
//     ],

//     // Capacity & Enrollment
//     capacity: {
//       type: Number,
//       default: 50,
//     },
//     currentEnrollment: {
//       type: Number,
//       default: 0,
//     },
//     enrollmentStatus: {
//       type: String,
//       default: "Open",
//     },

//     // Schedule Information
//     meetingDays: [String],
//     meetingTime: {
//       start: String,
//       end: String,
//     },
//     venue: String,

//     // Academic Dates
//     startDate: Date,
//     endDate: Date,
//     registrationDeadline: Date,

//     // Fees & Financials
//     tuitionFee: {
//       type: Number,
//       default: 0,
//     },
//     otherFees: [
//       {
//         name: String,
//         amount: Number,
//         dueDate: Date,
//       },
//     ],

//     // Group Performance Tracking
//     averageGrade: {
//       type: Number,
//       default: 0,
//     },
//     attendanceRate: {
//       type: Number,
//       default: 0,
//     },

//     // Status & Metadata
//     status: {
//       type: String,
//       default: "Draft",
//     },

//     // Approval Workflow
//     approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     approvedAt: Date,
//     rejectionReason: String,

//     // Audit Trail
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

//     // Soft Delete
//     isActive: { type: Boolean, default: true },
//     deletedAt: Date,
//     deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

//     // Metadata for Reporting
//     notes: String,
//   },
//   {
//     timestamps: true,
//   }
// );

// // Simple virtual for available spots
// groupSchema.virtual("availableSpots").get(function () {
//   return Math.max(0, this.capacity - this.currentEnrollment);
// });

// // Keep basic indexes for performance
// groupSchema.index({ programme: 1, academicYear: 1, semester: 1 });
// groupSchema.index({ status: 1 });
// groupSchema.index({ createdBy: 1 });

// module.exports = mongoose.model("Group", groupSchema);

const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    // Core Academic Information
    programme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Programme",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
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
      required: true,
    },
    yearOfStudy: {
      type: Number,
      min: 1,
      max: 8,
      required: true,
    },

    // Group Classification
    groupType: {
      type: String,
      enum: ["Regular", "Evening", "Weekend", "Distance", "Part-time"],
      default: "Regular",
    },
    section: {
      type: String,
      default: "A",
    },

    // Academic Team & Courses
    lecturers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    coordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    // Students & Capacity
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    capacity: {
      type: Number,
      default: 50,
    },
    currentEnrollment: {
      type: Number,
      default: 0,
    },

    // Schedule Information
    meetingDays: [String],
    meetingTime: {
      start: String,
      end: String,
    },
    venue: String,

    // Dates
    startDate: Date,
    endDate: Date,

    // Status & Metadata
    status: {
      type: String,
      default: "Draft",
    },

    // Creator
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Simple virtual for available spots
groupSchema.virtual("availableSpots").get(function () {
  return Math.max(0, this.capacity - this.currentEnrollment);
});

// Basic indexes
groupSchema.index({ programme: 1, academicYear: 1, semester: 1 });
groupSchema.index({ status: 1 });

module.exports = mongoose.model("Group", groupSchema);
