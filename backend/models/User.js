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
        "DeanOfStudents",
        "StudentAffairs",
        "DirectorAcademic",
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
      // STUDENT ID (replaces NURTE number)
      studentId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        uppercase: true,
        match: [
          /^[A-Z0-9]+$/,
          "Please use only letters and numbers for student ID",
        ],
      },

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

      // === REGISTRATION & ADMISSION STATUS ===
      registrationStatus: {
        type: String,
        enum: ["Pending", "In Progress", "Completed", "Approved", "Registered"],
        default: "Pending",
        set: function (value) {
          // When student is approved/registered, initialize academic clearance
          if (
            (value === "Approved" ||
              value === "Registered" ||
              value === "Completed") &&
            !this.studentProfile?.academicClearance?.currentSemesterClearance
          ) {
            // Initialize studentProfile.academicClearance if it doesn't exist
            if (!this.studentProfile.academicClearance) {
              this.studentProfile.academicClearance = {};
            }

            // Get current semester (default to 1 if not set)
            const currentSemester = this.currentSemester || 1;

            // Initialize current semester clearance - DEFAULT TO NOT CLEARED
            this.studentProfile.academicClearance.currentSemesterClearance = {
              semester: currentSemester,
              academicYear: "2024/2025", // Should come from system settings
              cleared: false, // DEFAULT: NOT CLEARED
              clearanceLevel: "Pending", // DEFAULT: Pending review
              requirements: {
                feesPaid: false,
                previousSemesterComplete: false,
                prerequisitesMet: false,
                attendanceSatisfactory: true,
                disciplinaryClear: true,
              },
            };

            // Initialize clearance history array
            if (!this.studentProfile.academicClearance.clearanceHistory) {
              this.studentProfile.academicClearance.clearanceHistory = [];
            }
          }
          return value;
        },
      },

      admissionStatus: {
        type: String,
        enum: ["Applied", "Approved", "Registered", "Fully Admitted"],
        default: "Applied",
      },

      // === ACADEMIC CLEARANCE SYSTEM ===
      academicClearance: {
        // Current semester clearance - STUDENTS START AS NOT CLEARED
        currentSemesterClearance: {
          semester: {
            type: Number,
            default: 1,
          },
          academicYear: {
            type: String,
            default: "2024/2025",
          },
          cleared: {
            type: Boolean,
            default: false, // DEFAULT: Student is NOT cleared
          },
          clearedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          clearedByName: String,
          clearedAt: Date,
          clearanceNotes: String,
          clearanceLevel: {
            type: String,
            enum: ["Full", "Conditional", "Provisional", "Denied", "Pending"],
            default: "Pending", // DEFAULT: Awaiting Director Academic review
          },
          requirements: {
            feesPaid: {
              type: Boolean,
              default: false,
            },
            previousSemesterComplete: {
              type: Boolean,
              default: false,
            },
            prerequisitesMet: {
              type: Boolean,
              default: false,
            },
            attendanceSatisfactory: {
              type: Boolean,
              default: true,
            },
            disciplinaryClear: {
              type: Boolean,
              default: true,
            },
          },
          // Audit fields
          lastUpdated: {
            type: Date,
            default: Date.now,
          },
          updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        },

        // Clearance history for past semesters
        clearanceHistory: [
          {
            semester: Number,
            academicYear: String,
            cleared: Boolean,
            clearedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
            },
            clearedByName: String,
            clearedAt: Date,
            clearanceLevel: String,
            notes: String,
            semesterGPA: Number,
            creditsEarned: Number,
            requirements: {
              feesPaid: Boolean,
              previousSemesterComplete: Boolean,
              prerequisitesMet: Boolean,
              attendanceSatisfactory: Boolean,
              disciplinaryClear: Boolean,
            },
          },
        ],

        // Clearance settings
        autoClearanceEligible: {
          type: Boolean,
          default: false,
        },
        requiresManualReview: {
          type: Boolean,
          default: true, // Director Academic must manually review
        },
        lastAutoCheck: Date,
      },

      // === FEES STATUS (for clearance requirements) ===
      feesStatus: {
        currentSemester: {
          paid: {
            type: Boolean,
            default: false,
          },
          amountDue: Number,
          amountPaid: Number,
          balance: Number,
          dueDate: Date,
          lastPaymentDate: Date,
        },
        overallStatus: {
          type: String,
          enum: ["Paid", "Partial", "Pending", "Overdue"],
          default: "Pending",
        },
      },

      // === DISCIPLINARY STATUS (for clearance requirements) ===
      disciplinaryStatus: {
        hasActiveCase: {
          type: Boolean,
          default: false,
        },
        lastCaseDate: Date,
        caseCount: {
          type: Number,
          default: 0,
        },
        status: {
          type: String,
          enum: ["Clear", "Warning", "Probation", "Suspended"],
          default: "Clear",
        },
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

    // === Skill Training Approvals ===
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
      // Previous semester completion status
      lastSemesterCompleted: {
        type: Boolean,
        default: false,
      },
      lastSemesterGPA: Number,
      lastSemesterCredits: Number,
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
        cleared: Boolean, // Was student cleared for this semester?
        clearanceLevel: String, // Full, Conditional, etc.
      },
    ],

    // === Director Academic specific fields ===
    directorAcademicProfile: {
      faculty: String,
      department: String,
      clearanceLevel: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "High",
      },
      canResetClearance: {
        type: Boolean,
        default: true,
      },
      canBulkClear: {
        type: Boolean,
        default: true,
      },
      assignedProgrammes: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Programme",
        },
      ],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // === Attendance tracking (for clearance requirements) ===
    attendanceRecord: {
      currentSemesterAttendance: {
        totalClasses: Number,
        attendedClasses: Number,
        attendancePercentage: Number,
        lastUpdated: Date,
      },
      overallAttendance: {
        totalClasses: Number,
        attendedClasses: Number,
        attendancePercentage: Number,
      },
    },
  },
  { timestamps: true },
);

// Middleware to handle semester transitions
userSchema.pre("save", function (next) {
  // If currentSemester changes, reset clearance for new semester
  if (this.isModified("currentSemester") && this.role === "Student") {
    const newSemester = this.currentSemester;

    // Check if we already have clearance for this semester
    const currentClearance =
      this.studentProfile?.academicClearance?.currentSemesterClearance;

    if (!currentClearance || currentClearance.semester !== newSemester) {
      // Reset clearance for new semester
      if (!this.studentProfile.academicClearance) {
        this.studentProfile.academicClearance = {};
      }

      this.studentProfile.academicClearance.currentSemesterClearance = {
        semester: newSemester,
        academicYear: "2024/2025", // Get from system
        cleared: false, // RESET TO NOT CLEARED for new semester
        clearanceLevel: "Pending", // RESET to pending
        requirements: {
          feesPaid: false,
          previousSemesterComplete: false,
          prerequisitesMet: false,
          attendanceSatisfactory: true,
          disciplinaryClear: true,
        },
      };
    }
  }
  next();
});

// Helper method to check if student is cleared for current semester
userSchema.methods.isClearedForCurrentSemester = function () {
  if (this.role !== "Student") return false;

  const clearance =
    this.studentProfile?.academicClearance?.currentSemesterClearance;
  if (!clearance) return false;

  // Student is cleared only if cleared=true AND clearanceLevel is not "Denied"
  return clearance.cleared && clearance.clearanceLevel !== "Denied";
};

// Helper method to get clearance status
userSchema.methods.getClearanceStatus = function () {
  if (this.role !== "Student") return "N/A";

  const clearance =
    this.studentProfile?.academicClearance?.currentSemesterClearance;
  if (!clearance) return "Not Registered";

  if (clearance.cleared) {
    return clearance.clearanceLevel;
  } else {
    return clearance.clearanceLevel === "Denied" ? "Denied" : "Pending";
  }
};

// Helper method to check clearance requirements
userSchema.methods.checkClearanceRequirements = function () {
  const requirements = {
    feesPaid: this.studentProfile?.feesStatus?.currentSemester?.paid || false,
    previousSemesterComplete:
      this.academicProgress?.lastSemesterCompleted || false,
    prerequisitesMet: true, // This would be checked against course prerequisites
    attendanceSatisfactory:
      this.attendanceRecord?.currentSemesterAttendance?.attendancePercentage >=
        75 || true,
    disciplinaryClear:
      !this.studentProfile?.disciplinaryStatus?.hasActiveCase &&
      this.studentProfile?.disciplinaryStatus?.status === "Clear",
  };

  const unmetRequirements = [];
  if (!requirements.feesPaid) unmetRequirements.push("Fees not paid");
  if (!requirements.previousSemesterComplete)
    unmetRequirements.push("Previous semester not completed");
  if (!requirements.prerequisitesMet)
    unmetRequirements.push("Prerequisites not met");
  if (!requirements.attendanceSatisfactory)
    unmetRequirements.push("Attendance below requirement");
  if (!requirements.disciplinaryClear)
    unmetRequirements.push("Active disciplinary case");

  return {
    allMet: unmetRequirements.length === 0,
    requirements: requirements,
    unmetRequirements: unmetRequirements,
  };
};

// Method to clear student for semester (to be called by Director Academic)
userSchema.methods.clearForSemester = function (clearanceData) {
  if (this.role !== "Student") {
    throw new Error("Only students can be cleared for semester");
  }

  const {
    clearedBy,
    clearedByName,
    clearanceLevel = "Full",
    clearanceNotes = "",
    requirements = {},
  } = clearanceData;

  // Determine if this is actually clearing the student
  const isClearing = ["Full", "Conditional", "Provisional"].includes(
    clearanceLevel,
  );

  // Update current semester clearance
  this.studentProfile.academicClearance.currentSemesterClearance = {
    semester: this.currentSemester || 1,
    academicYear: "2024/2025", // Get from system
    cleared: isClearing, // True only for Full/Conditional/Provisional
    clearedBy: clearedBy,
    clearedByName: clearedByName,
    clearedAt: new Date(),
    clearanceNotes: clearanceNotes,
    clearanceLevel: clearanceLevel,
    requirements: {
      feesPaid: requirements.feesPaid || false,
      previousSemesterComplete: requirements.previousSemesterComplete || false,
      prerequisitesMet: requirements.prerequisitesMet || false,
      attendanceSatisfactory: requirements.attendanceSatisfactory || true,
      disciplinaryClear: requirements.disciplinaryClear || true,
    },
    lastUpdated: new Date(),
    updatedBy: clearedBy,
  };

  // Add to clearance history
  if (!this.studentProfile.academicClearance.clearanceHistory) {
    this.studentProfile.academicClearance.clearanceHistory = [];
  }

  this.studentProfile.academicClearance.clearanceHistory.push({
    semester: this.currentSemester || 1,
    academicYear: "2024/2025",
    cleared: isClearing,
    clearedBy: clearedBy,
    clearedByName: clearedByName,
    clearedAt: new Date(),
    clearanceLevel: clearanceLevel,
    notes: clearanceNotes,
    semesterGPA: this.academicProgress?.cumulativeGPA || 0,
    creditsEarned: this.academicProgress?.totalCreditsEarned || 0,
    requirements: {
      feesPaid: requirements.feesPaid || false,
      previousSemesterComplete: requirements.previousSemesterComplete || false,
      prerequisitesMet: requirements.prerequisitesMet || false,
      attendanceSatisfactory: requirements.attendanceSatisfactory || true,
      disciplinaryClear: requirements.disciplinaryClear || true,
    },
  });

  // Update semester history if it exists
  const semesterHistory = this.semesterHistory.find(
    (sh) => sh.semester === this.currentSemester,
  );

  if (semesterHistory) {
    semesterHistory.cleared = isClearing;
    semesterHistory.clearanceLevel = clearanceLevel;
  }

  return this;
};

// Method to assign student ID (replaces assignNURTE)
userSchema.methods.assignStudentId = function (studentIdData) {
  const {
    studentId,
    assignedBy,
    assignedByName,
    effectiveSemester = this.currentSemester || 1,
  } = studentIdData;

  // Store student ID in studentProfile
  this.studentProfile.studentId = studentId;

  // Update current semester if different
  if (effectiveSemester !== this.currentSemester) {
    this.currentSemester = effectiveSemester;
  }

  // Also store assignment info (optional)
  if (!this.studentProfile.studentIdAssignment) {
    this.studentProfile.studentIdAssignment = {};
  }

  this.studentProfile.studentIdAssignment = {
    assignedBy: assignedBy,
    assignedByName: assignedByName,
    assignedAt: new Date(),
    effectiveSemester: effectiveSemester,
  };

  return this;
};

// Use email for login
userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
  errorMessages: {
    UserExistsError: "A user with this email already exists.",
  },
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ "studentProfile.studentId": 1 }, { sparse: true }); // Updated index
userSchema.index({ programme: 1 });
userSchema.index({
  "studentProfile.academicClearance.currentSemesterClearance.cleared": 1,
});
userSchema.index({
  "studentProfile.academicClearance.currentSemesterClearance.clearanceLevel": 1,
});
userSchema.index({
  "studentProfile.academicClearance.currentSemesterClearance.semester": 1,
});

module.exports = mongoose.model("User", userSchema);
