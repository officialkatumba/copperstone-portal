// module.exports = mongoose.model("User", userSchema);

// const mongoose = require("mongoose");
// const passportLocalMongoose = require("passport-local-mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     firstName: { type: String, required: true },
//     surname: { type: String, required: true },
//     otherNames: { type: String },
//     email: { type: String, required: true, unique: true },
//     mobile: { type: String, required: true },

//     // Role system
//     role: {
//       type: String,
//       enum: [
//         "Student",
//         "Lecturer",
//         "Admin",
//         "AdmissionsOfficer",
//         "FinanceOfficer",
//         "Registrar",
//         "VC",
//       ],
//       default: "Student",
//     },

//     // ✅ Academic Tracking
//     appliedCourses: [
//       {
//         firstChoice: { type: mongoose.Schema.Types.ObjectId, ref: "Programme" },
//         secondChoice: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Programme",
//         },
//         appliedAt: { type: Date, default: Date.now },
//       },
//     ],

//     // ✅ Multiple approved courses (each with approval and start date)
//     approvedCourses: [
//       {
//         programme: { type: mongoose.Schema.Types.ObjectId, ref: "Programme" },
//         approvalDate: { type: Date, default: Date.now },
//         startDate: { type: Date },
//       },
//     ],

//     // ✅ Current active programme (for enrolled students)
//     programme: { type: mongoose.Schema.Types.ObjectId, ref: "Programme" },
//     level: {
//       type: String,
//       enum: ["Certificate", "Diploma", "Bachelor", "Masters"],
//     },

//     // Optional status
//     isActive: { type: Boolean, default: true },
//   },
//   { timestamps: true }
// );

// // ✅ Use email for login with password hashing
// userSchema.plugin(passportLocalMongoose, {
//   usernameField: "email",
//   errorMessages: {
//     UserExistsError: "A user with this email already exists.",
//   },
// });

// module.exports = mongoose.model("User", userSchema);

// const mongoose = require("mongoose");
// const passportLocalMongoose = require("passport-local-mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     // === Core identity ===
//     firstName: { type: String, required: true },
//     surname: { type: String, required: true },
//     otherNames: { type: String },
//     email: { type: String, required: true, unique: true },
//     mobile: { type: String, required: true },

//     // === Role system ===
//     role: {
//       type: String,
//       enum: [
//         "Student",
//         "Lecturer",
//         "Admin",
//         "AdmissionsOfficer",
//         "FinanceOfficer",
//         "Registrar",
//         "VC",
//         "Dean",
//       ],
//       default: "Student",
//     },

//     // === Student Extended Profile (active when role = Student) ===
//     studentProfile: {
//       personalInfo: {
//         dateOfBirth: Date,
//         gender: { type: String, enum: ["Male", "Female", "Other"] },
//         nationality: String,
//         nationalIdNumber: String,
//       },

//       contactAddress: {
//         street: String,
//         city: String,
//         province: String,
//         postalCode: String,
//       },

//       emergencyContact: {
//         fullName: String,
//         relation: String,
//         phone: String,
//         email: String,
//       },

//       previousEducation: [
//         {
//           institution: String,
//           qualification: String,
//           yearCompleted: Number,
//         },
//       ],

//       profilePicture: {
//         gcsUrl: String,
//         gcsPath: String,
//         uploadedAt: Date,
//       },

//       registrationStatus: {
//         type: String,
//         enum: ["Pending", "In Progress", "Completed", "Approved"],
//         default: "Pending",
//       },

//       admissionStatus: {
//         type: String,
//         enum: ["Applied", "Approved", "Registered", "Fully Admitted"],
//         default: "Applied",
//       },
//     },

//     // === Academic Tracking ===
//     appliedCourses: [
//       {
//         firstChoice: { type: mongoose.Schema.Types.ObjectId, ref: "Programme" },
//         secondChoice: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Programme",
//         },
//         appliedAt: { type: Date, default: Date.now },
//       },
//     ],

//     approvedCourses: [
//       {
//         programme: { type: mongoose.Schema.Types.ObjectId, ref: "Programme" },
//         approvalDate: { type: Date, default: Date.now },
//         startDate: Date,
//       },
//     ],

//     programme: { type: mongoose.Schema.Types.ObjectId, ref: "Programme" },
//     level: {
//       type: String,
//       enum: ["Certificate", "Diploma", "Bachelor", "Masters"],
//     },

//     isActive: { type: Boolean, default: true },
//   },
//   { timestamps: true }
// );

// // Use email for login
// userSchema.plugin(passportLocalMongoose, {
//   usernameField: "email",
//   errorMessages: {
//     UserExistsError: "A user with this email already exists.",
//   },
// });

// module.exports = mongoose.model("User", userSchema);

// const mongoose = require("mongoose");
// const passportLocalMongoose = require("passport-local-mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     // === Core identity ===
//     firstName: {
//       type: String,
//       required: true,
//     },
//     surname: {
//       type: String,
//       required: true,
//     },
//     otherNames: {
//       type: String,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//     },
//     mobile: {
//       type: String,
//       required: true,
//     },

//     // === Role system ===
//     role: {
//       type: String,
//       enum: [
//         "Student",
//         "Lecturer",
//         "Admin",
//         "AdmissionsOfficer",
//         "FinanceOfficer",
//         "Registrar",
//         "VC",
//         "Dean",
//       ],
//       default: "Student",
//     },

//     // === Dean-specific fields ===
//     isDean: {
//       type: Boolean,
//       default: false,
//     },
//     deanPrograms: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Programme",
//       },
//     ],
//     deanDepartment: {
//       type: String,
//     },

//     // === Student-specific fields ===
//     studentProfile: {
//       personalInfo: {
//         dateOfBirth: Date,
//         gender: {
//           type: String,
//           enum: ["Male", "Female", "Other"],
//         },
//         nationality: String,
//         nationalIdNumber: String,
//       },
//       contactAddress: {
//         street: String,
//         city: String,
//         province: String,
//         postalCode: String,
//       },
//       emergencyContact: {
//         fullName: String,
//         relation: String,
//         phone: String,
//         email: String,
//       },
//       previousEducation: [
//         {
//           institution: String,
//           qualification: String,
//           yearCompleted: Number,
//         },
//       ],
//       profilePicture: {
//         gcsUrl: String,
//         gcsPath: String,
//         uploadedAt: Date,
//       },
//       registrationStatus: {
//         type: String,
//         enum: ["Pending", "In Progress", "Completed", "Approved"],
//         default: "Pending",
//       },
//       admissionStatus: {
//         type: String,
//         enum: ["Applied", "Approved", "Registered", "Fully Admitted"],
//         default: "Applied",
//       },
//     },

//     // === Academic Tracking ===
//     appliedCourses: [
//       {
//         firstChoice: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Programme",
//         },
//         secondChoice: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Programme",
//         },
//         appliedAt: {
//           type: Date,
//           default: Date.now,
//         },
//       },
//     ],

//     approvedCourses: [
//       {
//         programme: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Programme",
//         },
//         approvalDate: {
//           type: Date,
//           default: Date.now,
//         },
//         startDate: Date,
//       },
//     ],

//     // === Current Academic Programme ===
//     programme: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Programme",
//     },

//     // Academic Level (Certificate, Diploma, Bachelor, Masters)
//     level: {
//       type: String,
//       enum: ["Certificate", "Diploma", "Bachelor", "Masters"],
//     },

//     // === Student Progression - Current Semester Position ===
//     currentSemester: {
//       type: Number,
//       min: 1,
//       max: 8,
//       default: 1,
//     },

//     academicProgress: {
//       status: {
//         type: String,
//         enum: ["Active", "Probation", "Suspended", "Graduated", "Withdrawn"],
//         default: "Active",
//       },
//       semesterStartDate: Date,
//       semesterEndDate: Date,
//       cumulativeGPA: {
//         type: Number,
//         min: 0,
//         max: 4.0,
//         default: 0.0,
//       },
//       totalCreditsEarned: {
//         type: Number,
//         default: 0,
//       },
//       totalCreditsAttempted: {
//         type: Number,
//         default: 0,
//       },
//     },

//     // === Course Assignments ===
//     assignedCourses: [
//       {
//         course: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Course",
//           required: true,
//         },
//         semester: {
//           type: Number,
//           required: true,
//           min: 1,
//           max: 8,
//         },
//         startDate: {
//           type: Date,
//           required: true,
//         },
//         endDate: {
//           type: Date,
//           required: true,
//         },
//         assignedAt: {
//           type: Date,
//           default: Date.now,
//         },
//         status: {
//           type: String,
//           enum: ["Active", "Completed", "Dropped", "Failed"],
//           default: "Active",
//         },
//         grade: {
//           type: String,
//           enum: ["A", "B", "C", "D", "F", "Incomplete", "Withdrawn", null],
//           default: null,
//         },
//         creditsEarned: {
//           type: Number,
//           default: 0,
//         },
//       },
//     ],

//     // === Semester History ===
//     semesterHistory: [
//       {
//         semester: {
//           type: Number,
//           required: true,
//         },
//         academicYear: String,
//         semesterGPA: {
//           type: Number,
//           min: 0,
//           max: 4.0,
//         },
//         creditsAttempted: {
//           type: Number,
//           default: 0,
//         },
//         creditsEarned: {
//           type: Number,
//           default: 0,
//         },
//         courses: [
//           {
//             course: {
//               type: mongoose.Schema.Types.ObjectId,
//               ref: "Course",
//             },
//             grade: String,
//             credits: Number,
//           },
//         ],
//         startDate: Date,
//         endDate: Date,
//       },
//     ],

//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true }
// );

// // Use email for login
// userSchema.plugin(passportLocalMongoose, {
//   usernameField: "email",
//   errorMessages: {
//     UserExistsError: "A user with this email already exists.",
//   },
// });

// module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema(
  {
    // === Core identity ===
    firstName: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    otherNames: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: String,
      required: true,
    },

    // === Role system ===
    role: {
      type: String,
      enum: [
        "Student",
        "Lecturer",
        "Admin",
        "AdmissionsOfficer",
        "FinanceOfficer",
        "Registrar",
        "VC",
        "Dean",
      ],
      default: "Student",
    },

    // === Dean-specific fields ===
    isDean: {
      type: Boolean,
      default: false,
    },
    deanPrograms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Programme",
      },
    ],
    deanDepartment: {
      type: String,
    },

    // === Student-specific fields ===
    studentProfile: {
      personalInfo: {
        dateOfBirth: Date,
        gender: {
          type: String,
          enum: ["Male", "Female", "Other"],
        },
        nationality: String,
        nationalIdNumber: String,
      },
      contactAddress: {
        street: String,
        city: String,
        province: String,
        postalCode: String,
      },
      emergencyContact: {
        fullName: String,
        relation: String,
        phone: String,
        email: String,
      },
      previousEducation: [
        {
          institution: String,
          qualification: String,
          yearCompleted: Number,
        },
      ],
      profilePicture: {
        gcsUrl: String,
        gcsPath: String,
        uploadedAt: Date,
      },
      registrationStatus: {
        type: String,
        enum: ["Pending", "In Progress", "Completed", "Approved"],
        default: "Pending",
      },
      admissionStatus: {
        type: String,
        enum: ["Applied", "Approved", "Registered", "Fully Admitted"],
        default: "Applied",
      },
    },

    // === Academic Tracking ===
    appliedCourses: [
      {
        firstChoice: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Programme",
        },
        secondChoice: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Programme",
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    approvedCourses: [
      {
        programme: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Programme",
        },
        approvalDate: {
          type: Date,
          default: Date.now,
        },
        startDate: Date,
      },
    ],

    // === Skill Training Approvals (ADDED HERE) ===
    skillsApproved: [
      {
        skill: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Skill",
        },
        approvalDate: {
          type: Date,
          default: Date.now,
        },
        startDate: Date,
      },
    ],

    // === Current Academic Programme ===
    programme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Programme",
    },

    // Academic Level
    level: {
      type: String,
      enum: ["Certificate", "Diploma", "Bachelor", "Masters"],
    },

    // === Student Progression - Current Semester Position ===
    currentSemester: {
      type: Number,
      min: 1,
      max: 8,
      default: 1,
    },

    academicProgress: {
      status: {
        type: String,
        enum: ["Active", "Probation", "Suspended", "Graduated", "Withdrawn"],
        default: "Active",
      },
      semesterStartDate: Date,
      semesterEndDate: Date,
      cumulativeGPA: {
        type: Number,
        min: 0,
        max: 4.0,
        default: 0.0,
      },
      totalCreditsEarned: {
        type: Number,
        default: 0,
      },
      totalCreditsAttempted: {
        type: Number,
        default: 0,
      },
    },

    // === Course Assignments ===
    assignedCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true,
        },
        semester: {
          type: Number,
          required: true,
          min: 1,
          max: 8,
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
          required: true,
        },
        assignedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["Active", "Completed", "Dropped", "Failed"],
          default: "Active",
        },
        grade: {
          type: String,
          enum: ["A", "B", "C", "D", "F", "Incomplete", "Withdrawn", null],
          default: null,
        },
        creditsEarned: {
          type: Number,
          default: 0,
        },
      },
    ],

    // === Semester History ===
    semesterHistory: [
      {
        semester: {
          type: Number,
          required: true,
        },
        academicYear: String,
        semesterGPA: {
          type: Number,
          min: 0,
          max: 4.0,
        },
        creditsAttempted: {
          type: Number,
          default: 0,
        },
        creditsEarned: {
          type: Number,
          default: 0,
        },
        courses: [
          {
            course: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Course",
            },
            grade: String,
            credits: Number,
          },
        ],
        startDate: Date,
        endDate: Date,
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Use email for login
userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
  errorMessages: {
    UserExistsError: "A user with this email already exists.",
  },
});

module.exports = mongoose.model("User", userSchema);
