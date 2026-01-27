const User = require("../models/User");
const Programme = require("../models/Programme");
const Payment = require("../models/Payment");
const Expense = require("../models/Expense");
const Course = require("../models/Course");
const AuditLog = require("../models/AuditLog");
// const User = require("../models/User");
// const Payment = require("../models/Payment");

/**
 * ============================
 * DASHBOARD (Updated with all features)
 * ============================
 */
exports.dashboard = async (req, res) => {
  try {
    const currentAcademicYear = "2024/2025";
    const currentSemester = 1;

    // Get statistics
    const totalStudents = await User.countDocuments({ role: "Student" });

    // Students pending clearance for current term
    const pendingClearance = await User.countDocuments({
      role: "Student",
      $or: [
        {
          "studentProfile.academicClearance.currentSemesterClearance.cleared": false,
        },
        {
          "studentProfile.academicClearance.currentSemesterClearance": {
            $exists: false,
          },
        },
      ],
    });

    // Students cleared for current term
    const clearedForTerm = await User.countDocuments({
      role: "Student",
      "studentProfile.academicClearance.currentSemesterClearance.cleared": true,
      "studentProfile.academicClearance.currentSemesterClearance.semester":
        currentSemester,
    });

    // Students needing NURTE numbers
    const needNURTE = await User.countDocuments({
      role: "Student",
      "studentProfile.nurteNumber": { $exists: false },
      "studentProfile.admissionStatus": "Approved",
    });

    // Get total lecturers count
    const totalLecturers = await User.countDocuments({ role: "Lecturer" });

    // Recent clearance activities
    const recentClearances = await User.aggregate([
      {
        $match: {
          role: "Student",
          "studentProfile.academicClearance.currentSemesterClearance.cleared": true,
        },
      },
      {
        $sort: {
          "studentProfile.academicClearance.currentSemesterClearance.clearedAt":
            -1,
        },
      },
      { $limit: 5 },
      {
        $lookup: {
          from: "programmes",
          localField: "programme",
          foreignField: "_id",
          as: "programmeInfo",
        },
      },
      {
        $project: {
          studentName: { $concat: ["$firstName", " ", "$surname"] },
          studentEmail: "$email",
          studentId: "$_id",
          programme: { $arrayElemAt: ["$programmeInfo.name", 0] },
          semester: "$currentSemester",
          status:
            "$studentProfile.academicClearance.currentSemesterClearance.clearanceLevel",
          clearedByName:
            "$studentProfile.academicClearance.currentSemesterClearance.clearedByName",
          clearedAt:
            "$studentProfile.academicClearance.currentSemesterClearance.clearedAt",
        },
      },
    ]);

    // Quick stats by programme
    const programmeStats = await Programme.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "programme",
          as: "students",
        },
      },
      {
        $project: {
          name: 1,
          code: 1,
          totalStudents: { $size: "$students" },
          clearedStudents: {
            $size: {
              $filter: {
                input: "$students",
                as: "student",
                cond: {
                  $eq: [
                    "$$student.studentProfile.academicClearance.currentSemesterClearance.cleared",
                    true,
                  ],
                },
              },
            },
          },
        },
      },
      { $sort: { name: 1 } },
      { $limit: 5 },
    ]);

    res.render("dashboard/director-academic", {
      title: "Academic Director Dashboard",
      user: req.user,
      currentAcademicYear,
      currentSemester,
      totalLecturers,
      stats: {
        totalStudents,
        pendingClearance,
        clearedForTerm,
        needNURTE,
      },
      programmeStats,
      recentClearances,
    });
  } catch (err) {
    console.error("Director Academic Dashboard error:", err);
    res.status(500).render("error", {
      message: "Failed to load Director Academic dashboard",
      error: process.env.NODE_ENV === "development" ? err : {},
    });
  }
};

/**
 * ============================
 * STUDENT VIEWS
 * ============================
 */

// List all students with filtering and pagination
exports.listStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = (req.query.search || "").trim();
    const programme = req.query.programme || "";
    const semester = req.query.semester || "";

    const skip = (page - 1) * limit;

    // Build query
    const query = { role: "Student" };

    // Search filter
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, "i") },
        { surname: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
        { "studentProfile.nurteNumber": new RegExp(search, "i") },
      ];
    }

    // Programme filter
    if (programme) {
      query.programme = programme;
    }

    // Semester filter
    if (semester) {
      query.currentSemester = semester;
    }

    // Get students with pagination
    const students = await User.find(query)
      .populate("programme", "name code")
      .sort({ surname: 1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalCount = await User.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get all programmes for filter dropdown
    const programmes = await Programme.find({}).sort({ name: 1 });

    // Get clearance statistics
    const clearanceStats = await User.aggregate([
      { $match: { role: "Student" } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          cleared: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$studentProfile.academicClearance.currentSemesterClearance.clearanceLevel",
                    "Full",
                  ],
                },
                1,
                0,
              ],
            },
          },
          partial: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$studentProfile.academicClearance.currentSemesterClearance.clearanceLevel",
                    "Conditional",
                  ],
                },
                1,
                0,
              ],
            },
          },
          provisional: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$studentProfile.academicClearance.currentSemesterClearance.clearanceLevel",
                    "Provisional",
                  ],
                },
                1,
                0,
              ],
            },
          },
          pending: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$studentProfile.academicClearance.currentSemesterClearance.clearanceLevel",
                    "Pending",
                  ],
                },
                1,
                0,
              ],
            },
          },
          denied: {
            $sum: {
              $cond: [
                {
                  $eq: [
                    "$studentProfile.academicClearance.currentSemesterClearance.clearanceLevel",
                    "Denied",
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const stats = clearanceStats[0] || {
      total: 0,
      cleared: 0,
      conditional: 0,
      provisional: 0,
      pending: 0,
      denied: 0,
    };

    res.render("director-academic/students", {
      title: "All Students - Director Academic",
      user: req.user,
      students,
      programmes,
      stats,
      search,
      programmeFilter: programme,
      semesterFilter: semester,
      currentPage: page,
      totalPages,
      totalCount,
      limit,
    });
  } catch (error) {
    console.error("List students error:", error);
    req.flash("error_msg", "Failed to load students");
    res.redirect("/director-academic");
  }
};

/**
 * View single student profile - COMPLETE WORKING VERSION
 */
exports.viewStudent = async (req, res) => {
  try {
    // Get student with safe population
    const student = await User.findById(req.params.id)
      .populate("programme")
      .populate("deanPrograms")
      .populate("appliedCourses.firstChoice appliedCourses.secondChoice")
      .populate("approvedCourses.programme")
      .populate("skillsApproved.skill")
      .populate("assignedCourses.course")
      .populate("semesterHistory.courses.course")
      .populate("directorAcademicProfile.assignedProgrammes");

    if (!student) {
      req.flash("error_msg", "Student not found");
      return res.redirect("/director-academic/students");
    }

    // Get current semester from student data
    const currentSemester = student.currentSemester || 1;

    // Get current courses from assignedCourses
    let currentCourses = [];
    if (student.assignedCourses && Array.isArray(student.assignedCourses)) {
      currentCourses = student.assignedCourses.filter(
        (course) => course.semester === currentSemester,
      );
    }

    // Get semester history
    let academicHistory = [];
    if (student.semesterHistory && Array.isArray(student.semesterHistory)) {
      academicHistory = [...student.semesterHistory]
        .sort((a, b) => b.semester - a.semester)
        .map((semester) => ({
          semester: semester.semester,
          academicYear:
            semester.academicYear ||
            `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
          gpa: semester.semesterGPA || 0,
          creditsEarned: semester.creditsEarned || 0,
          creditsAttempted: semester.creditsAttempted || 0,
          status: semester.cleared ? "Cleared" : "Not Cleared",
          clearanceLevel: semester.clearanceLevel || "Pending",
        }));
    }

    // Get clearance data safely
    const clearanceData = student.studentProfile?.academicClearance
      ?.currentSemesterClearance || {
      semester: currentSemester,
      academicYear: "2024/2025",
      cleared: false,
      clearanceLevel: "Pending",
      requirements: {
        feesPaid: false,
        previousSemesterComplete: false,
        prerequisitesMet: false,
        attendanceSatisfactory: true,
        disciplinaryClear: true,
      },
    };

    // Get clearance history
    const clearanceHistory =
      student.studentProfile?.academicClearance?.clearanceHistory || [];

    // Get fees data
    let totalPaid = 0;
    let feesData = {};
    if (student.studentProfile?.feesStatus) {
      feesData = student.studentProfile.feesStatus;
      totalPaid =
        student.studentProfile.feesStatus.currentSemester?.amountPaid || 0;
    }

    // Get attendance data
    let attendanceData = {};
    if (student.attendanceRecord) {
      attendanceData = student.attendanceRecord;
    }

    // Get disciplinary status
    let disciplinaryData = {};
    if (student.studentProfile?.disciplinaryStatus) {
      disciplinaryData = student.studentProfile.disciplinaryStatus;
    }

    // Get NURTE data
    let nurteData = {};
    if (student.studentProfile?.nurteNumber) {
      nurteData = student.studentProfile.nurteNumber;
    }

    res.render("director-academic/student-profile", {
      title: `${student.firstName} ${student.surname} - Academic Profile`,
      user: req.user,
      student: student,
      currentSemester: currentSemester,
      currentCourses: currentCourses,
      academicHistory: academicHistory,
      clearanceData: clearanceData,
      clearanceHistory: clearanceHistory,
      feesData: feesData,
      totalPaid: totalPaid,
      attendanceData: attendanceData,
      disciplinaryData: disciplinaryData,
      nurteData: nurteData,
      payments: [],
      currentAttendance: [],
    });
  } catch (error) {
    console.error("View student error:", error);
    req.flash("error_msg", "Failed to load student profile");
    res.redirect("/director-academic/students");
  }
};

/**
 * ============================
 * ACADEMIC CLEARANCE (UPDATED to use new data structure)
 * ============================
 */
exports.getPendingClearances = async (req, res) => {
  try {
    // Find students with pending clearance using the new data structure
    const pendingStudents = await User.find({
      role: "Student",
      $or: [
        {
          "studentProfile.academicClearance.currentSemesterClearance.clearanceLevel":
            "Pending",
        },
        {
          "studentProfile.academicClearance.currentSemesterClearance": {
            $exists: false,
          },
        },
      ],
    })
      .populate("programme")
      .sort({ surname: 1 });

    res.render("director-academic/pending-clearances", {
      title: "Pending Academic Clearances",
      user: req.user,
      students: pendingStudents,
    });
  } catch (error) {
    console.error("Pending clearances error:", error);
    res.status(500).render("error", {
      message: "Error loading pending clearances",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

exports.getClearedStudents = async (req, res) => {
  try {
    // Find students with cleared status using the new data structure
    const clearedStudents = await User.find({
      role: "Student",
      "studentProfile.academicClearance.currentSemesterClearance.clearanceLevel":
        {
          $in: ["Full", "Conditional", "Provisional"],
        },
    })
      .populate("programme")
      .sort({ surname: 1 });

    res.render("director-academic/cleared-students", {
      title: "Cleared Students",
      user: req.user,
      students: clearedStudents,
    });
  } catch (error) {
    console.error("Cleared students error:", error);
    res.status(500).render("error", {
      message: "Error loading cleared students",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

exports.approveClearance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { clearanceType, remarks } = req.body;

    // Validate clearance type matches your enum
    const validTypes = [
      "Full",
      "Conditional",
      "Provisional",
      "Denied",
      "Pending",
    ];
    if (!validTypes.includes(clearanceType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid clearance type",
      });
    }

    // Update student's clearance status using new data structure
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Initialize academicClearance if it doesn't exist
    if (!student.studentProfile) student.studentProfile = {};
    if (!student.studentProfile.academicClearance)
      student.studentProfile.academicClearance = {};
    if (!student.studentProfile.academicClearance.currentSemesterClearance) {
      student.studentProfile.academicClearance.currentSemesterClearance = {};
    }

    // Update clearance
    student.studentProfile.academicClearance.currentSemesterClearance = {
      cleared:
        clearanceType === "Full" ||
        clearanceType === "Conditional" ||
        clearanceType === "Provisional",
      clearanceLevel: clearanceType,
      clearedAt: new Date(),
      clearedBy: req.user?._id,
      clearedByName: req.user
        ? `${req.user.firstName} ${req.user.surname}`
        : "System",
      remarks: remarks || "",
      semester: student.currentSemester || 1,
      academicYear: "2024/2025",
    };

    // Add to clearance history
    if (!student.studentProfile.academicClearance.clearanceHistory) {
      student.studentProfile.academicClearance.clearanceHistory = [];
    }

    student.studentProfile.academicClearance.clearanceHistory.push({
      semester: student.currentSemester || 1,
      academicYear: "2024/2025",
      clearanceLevel: clearanceType,
      clearedAt: new Date(),
      clearedBy: req.user?._id,
      clearedByName: req.user
        ? `${req.user.firstName} ${req.user.surname}`
        : "System",
      remarks: remarks || "",
    });

    await student.save();

    res.json({
      success: true,
      message: `Student clearance updated to ${clearanceType} successfully`,
      student: student,
    });
  } catch (error) {
    console.error("Approve clearance error:", error);
    res.status(500).json({
      success: false,
      message: "Error approving clearance",
      error: error.message,
    });
  }
};

/**
 * ============================
 * SEMESTER MAINTENANCE (UPDATED to use new data structure)
 * ============================
 */
exports.resetSemesterClearance = async (req, res) => {
  try {
    const { semester } = req.body;
    const currentSemester = semester || 1;
    const currentAcademicYear = "2024/2025";

    // Reset all student clearance statuses to pending using new data structure
    await User.updateMany(
      { role: "Student" },
      {
        $set: {
          "studentProfile.academicClearance.currentSemesterClearance": {
            cleared: false,
            clearanceLevel: "Pending",
            clearedAt: null,
            clearedBy: null,
            clearedByName: "",
            remarks: "",
            semester: currentSemester,
            academicYear: currentAcademicYear,
            requirements: {
              feesPaid: false,
              previousSemesterComplete: false,
              prerequisitesMet: false,
              attendanceSatisfactory: true,
              disciplinaryClear: true,
            },
          },
        },
      },
    );

    res.json({
      success: true,
      message: `Academic clearance reset successfully for ${semester || "new semester"}`,
    });
  } catch (error) {
    console.error("Reset semester error:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting semester clearance",
      error: error.message,
    });
  }
};

/**
 * ============================
 * CLEARANCE MANAGEMENT
 * ============================
 */

// Update clearance status
exports.updateClearance = async (req, res) => {
  try {
    const { id } = req.params;
    const { clearanceLevel, remarks, suspensionReason } = req.body;

    const student = await User.findById(id);
    if (!student) {
      req.flash("error_msg", "Student not found");
      return res.redirect("back");
    }

    // Update clearance status
    student.studentProfile.academicClearance.currentSemesterClearance = {
      cleared:
        clearanceLevel === "Full" ||
        clearanceLevel === "Conditional" ||
        clearanceLevel === "Provisional",
      clearanceLevel,
      clearedAt: new Date(),
      clearedBy: req.user._id,
      clearedByName: `${req.user.firstName} ${req.user.surname}`,
      remarks: remarks || "",
      semester: student.currentSemester || 1,
      academicYear: "2024/2025",
    };

    // Handle suspension
    if (suspensionReason) {
      student.studentProfile.status = "Suspended";
      student.studentProfile.suspensionReason = suspensionReason;
      student.studentProfile.suspendedAt = new Date();
      student.studentProfile.suspendedBy = req.user._id;
    } else if (clearanceLevel === "Full") {
      student.studentProfile.status = "Active";
    }

    // Add to clearance history
    if (!student.studentProfile.academicClearance.clearanceHistory) {
      student.studentProfile.academicClearance.clearanceHistory = [];
    }

    student.studentProfile.academicClearance.clearanceHistory.push({
      semester: student.currentSemester || 1,
      academicYear: "2024/2025",
      clearanceLevel: clearanceLevel,
      clearedAt: new Date(),
      clearedBy: req.user._id,
      clearedByName: `${req.user.firstName} ${req.user.surname}`,
      remarks: remarks || "",
    });

    await student.save();

    // Log the action
    await AuditLog.create({
      action: "Clearance Update",
      performedBy: req.user._id,
      targetUser: student._id,
      details: {
        clearanceLevel,
        remarks,
        previousStatus: req.body.previousStatus,
      },
      ipAddress: req.ip,
    });

    req.flash("success_msg", "Student clearance updated successfully");
    res.redirect(`/director-academic/students/${id}`);
  } catch (error) {
    console.error("Update clearance error:", error);
    req.flash("error_msg", "Failed to update clearance");
    res.redirect("back");
  }
};

// Suspend student
exports.suspendStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { suspensionReason, duration } = req.body;

    const student = await User.findById(id);
    if (!student) {
      req.flash("error_msg", "Student not found");
      return res.redirect("back");
    }

    student.studentProfile.status = "Suspended";
    student.studentProfile.suspensionReason = suspensionReason;
    student.studentProfile.suspendedAt = new Date();
    student.studentProfile.suspendedBy = req.user._id;
    student.studentProfile.suspensionDuration = duration;

    await student.save();

    // Log the action
    await AuditLog.create({
      action: "Student Suspension",
      performedBy: req.user._id,
      targetUser: student._id,
      details: {
        reason: suspensionReason,
        duration,
      },
      ipAddress: req.ip,
    });

    req.flash("success_msg", "Student has been suspended");
    res.redirect(`/director-academic/students/${id}`);
  } catch (error) {
    console.error("Suspend student error:", error);
    req.flash("error_msg", "Failed to suspend student");
    res.redirect("back");
  }
};

// Reinstate student
exports.reinstateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await User.findById(id);
    if (!student) {
      req.flash("error_msg", "Student not found");
      return res.redirect("back");
    }

    student.studentProfile.status = "Active";
    student.studentProfile.reinstatedAt = new Date();
    student.studentProfile.reinstatedBy = req.user._id;

    await student.save();

    // Log the action
    await AuditLog.create({
      action: "Student Reinstatement",
      performedBy: req.user._id,
      targetUser: student._id,
      details: {
        previousStatus: "Suspended",
      },
      ipAddress: req.ip,
    });

    req.flash("success_msg", "Student has been reinstated");
    res.redirect(`/director-academic/students/${id}`);
  } catch (error) {
    console.error("Reinstate student error:", error);
    req.flash("error_msg", "Failed to reinstate student");
    res.redirect("back");
  }
};

// // List all payments
// exports.listPayments = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20;
//     const search = (req.query.search || "").trim();
//     const category = (req.query.category || "").trim();

//     const skip = (page - 1) * limit;

//     // Build query
//     const query = {};

//     // Category filter
//     if (category) {
//       query.category = category;
//     }

//     // Student search
//     if (search) {
//       const students = await User.find({
//         role: "Student",
//         $or: [
//           { firstName: new RegExp(search, "i") },
//           { surname: new RegExp(search, "i") },
//           { email: new RegExp(search, "i") },
//         ],
//       }).select("_id");

//       query.student = { $in: students.map((s) => s._id) };
//     }

//     // Get payments
//     const payments = await Payment.find(query)
//       .populate("student", "firstName surname email")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     const totalCount = await Payment.countDocuments(query);
//     const totalPages = Math.ceil(totalCount / limit);

//     // Summary totals
//     const now = new Date();
//     const startOfToday = new Date(now.setHours(0, 0, 0, 0));
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfYear = new Date(now.getFullYear(), 0, 1);

//     const sum = async (from) => {
//       const r = await Payment.aggregate([
//         { $match: { createdAt: { $gte: from } } },
//         { $group: { _id: null, total: { $sum: "$amount" } } },
//       ]);
//       return r.length ? r[0].total : 0;
//     };

//     const [totalToday, totalMonth, totalYear, totalAll] = await Promise.all([
//       sum(startOfToday),
//       sum(startOfMonth),
//       sum(startOfYear),
//       sum(new Date(0)),
//     ]);

//     res.render("directorAcademic/payments", {
//       title: "All Payments - Director Academic",
//       payments,
//       totalToday,
//       totalMonth,
//       totalYear,
//       totalAll,
//       search,
//       category,
//       currentPage: page,
//       totalPages,
//       totalCount,
//       limit,
//       user: req.user,
//     });
//   } catch (error) {
//     console.error("List payments error:", error);
//     req.flash("error_msg", "Failed to load payments");
//     res.redirect("/director-academic");
//   }
// };

// List all expenses
exports.listExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({})
      .populate("approvedBy", "firstName surname")
      .populate("category", "name")
      .sort({ date: -1 });

    res.render("director-academic/expenses", {
      title: "All Expenses - Director Academic",
      expenses,
      user: req.user,
    });
  } catch (error) {
    console.error("List expenses error:", error);
    req.flash("error_msg", "Failed to load expenses");
    res.redirect("/director-academic");
  }
};

// List boarding students
exports.listBoardingStudents = async (req, res) => {
  try {
    const students = await User.find({
      role: "Student",
      "studentProfile.boarding": { $exists: true },
    })
      .populate("programme", "name")
      .populate("studentProfile.boarding.hostel", "name block")
      .sort({ surname: 1 });

    res.render("director-academic/boarding", {
      title: "Students in Boarding - Director Academic",
      students,
      user: req.user,
    });
  } catch (error) {
    console.error("List boarding students error:", error);
    req.flash("error_msg", "Failed to load boarding students");
    res.redirect("/director-academic");
  }
};

// List all lecturers
exports.listLecturers = async (req, res) => {
  try {
    const lecturers = await User.find({ role: "Lecturer" })
      .populate("department", "name")
      .populate("programmes", "name code")
      .sort({ surname: 1 });

    res.render("director-academic/lecturers", {
      title: "All Lecturers - Director Academic",
      lecturers,
      user: req.user,
    });
  } catch (error) {
    console.error("List lecturers error:", error);
    req.flash("error_msg", "Failed to load lecturers");
    res.redirect("/director-academic");
  }
};

// View lecturer profile
exports.viewLecturer = async (req, res) => {
  try {
    const lecturer = await User.findById(req.params.id)
      .populate("department", "name")
      .populate("programmes", "name code")
      .populate("assignedCourses", "name code semester");

    // Get lecturer's courses for current semester
    const currentCourses = await Course.find({
      assignedLecturer: req.params.id,
      semester: 1,
    });

    res.render("director-academic/lecturer-profile", {
      title: `${lecturer.firstName} ${lecturer.surname} - Lecturer Profile`,
      lecturer,
      currentCourses,
      user: req.user,
    });
  } catch (error) {
    console.error("View lecturer error:", error);
    req.flash("error_msg", "Failed to load lecturer profile");
    res.redirect("/director-academic/lecturers");
  }
};

// List academic reports
exports.listReports = async (req, res) => {
  try {
    // Get clearance statistics
    const clearanceStats = await User.aggregate([
      { $match: { role: "Student" } },
      {
        $group: {
          _id: "$studentProfile.academicClearance.currentSemesterClearance.clearanceLevel",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get programme-wise statistics
    const programmeStats = await Programme.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "programme",
          as: "students",
        },
      },
      {
        $project: {
          name: 1,
          code: 1,
          totalStudents: { $size: "$students" },
          clearedStudents: {
            $size: {
              $filter: {
                input: "$students",
                as: "student",
                cond: {
                  $eq: [
                    "$$student.studentProfile.academicClearance.currentSemesterClearance.clearanceLevel",
                    "Full",
                  ],
                },
              },
            },
          },
        },
      },
      { $sort: { totalStudents: -1 } },
    ]);

    res.render("director-academic/reports", {
      title: "Academic Reports - Director Academic",
      clearanceStats,
      programmeStats,
      user: req.user,
    });
  } catch (error) {
    console.error("List reports error:", error);
    req.flash("error_msg", "Failed to load reports");
    res.redirect("/director-academic");
  }
};

// listPayments

// In directorAcademicController.js - Updated viewAllPaymentsDirectorAcademic function

// exports.viewAllPaymentsDirectorAcademic = async (req, res) => {

exports.listPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = (req.query.search || "").trim();
    const category = (req.query.category || "").trim();

    const skip = (page - 1) * limit;

    // ============================
    // BUILD QUERY
    // ============================
    const query = {};

    // CATEGORY FILTER
    if (category) {
      query.category = category;
    }

    // STUDENT SEARCH (name OR email OR NURTE)
    if (search) {
      const students = await User.find({
        role: "Student",
        $or: [
          { firstName: new RegExp(search, "i") },
          { surname: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
          { "studentProfile.nurteNumber": new RegExp(search, "i") },
        ],
      }).select("_id");

      query.student = { $in: students.map((s) => s._id) };
    }

    // ============================
    // PAYMENTS
    // ============================
    const payments = await Payment.find(query)
      .populate({
        path: "student",
        select: "firstName surname email studentProfile.nurteNumber",
        populate: {
          path: "programme",
          select: "name code",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Payment.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // ============================
    // SIMPLIFIED TOTALS FOR DIRECTOR ACADEMIC
    // ============================
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const sum = async (from) => {
      const r = await Payment.aggregate([
        { $match: { createdAt: { $gte: from } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      return r.length ? r[0].total : 0;
    };

    // Overall totals (4 cards like original)
    const [totalToday, totalMonth, totalYear, totalAll] = await Promise.all([
      sum(startOfToday),
      sum(startOfMonth),
      sum(startOfYear),
      sum(new Date(0)), // From beginning of time
    ]);

    // Format dates for display
    const todayFormatted = new Date().toLocaleDateString();
    const monthStartFormatted = startOfMonth.toLocaleDateString();
    const nowFormatted = now.toLocaleDateString();
    const monthRange = `${monthStartFormatted} - ${nowFormatted}`;
    const yearRange = `${startOfYear.getFullYear()} - ${now.getFullYear()}`;

    res.render("director-academic/payments", {
      title: "Director Academic - All Payments",
      payments,

      // Simplified summary (4 cards) - ALL REQUIRED VARIABLES
      totalToday,
      totalMonth,
      totalYear,
      totalAll,

      // Date variables for display
      today: todayFormatted,
      monthRange: monthRange,
      yearRange: yearRange,

      // Filters
      search,
      category,

      // Pagination
      currentPage: page,
      totalPages,
      totalCount,
      limit,

      user: req.user,
    });
  } catch (err) {
    console.error("Director Academic Payments Error:", err);
    req.flash("error_msg", "Unable to load payments.");
    res.redirect("/director-academic");
  }
};
