const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { generateSignedUrl } = require("../config/gcsUpload");

const { ensureAuthenticated, ensureRole } = require("../middleware/auth");

// ================= STUDENT DASHBOARD =================
router.get(
  "/student",
  ensureAuthenticated,
  ensureRole("Student"),
  async (req, res) => {
    try {
      const dbUser = await User.findById(req.user._id)
        .populate("appliedCourses.firstChoice")
        .populate("appliedCourses.secondChoice")
        .populate("approvedCourses.programme")
        .lean();

      let profilePicUrl = null;
      if (dbUser?.studentProfile?.profilePicture?.gcsPath) {
        profilePicUrl = await generateSignedUrl(
          dbUser.studentProfile.profilePicture.gcsPath,
        );
      }

      res.render("dashboard/student", {
        title: "Student Dashboard",
        user: dbUser,
        profilePicUrl,
      });
    } catch (err) {
      console.error("Dashboard load error:", err);
      req.flash("error_msg", "Failed to load dashboard.");
      res.redirect("/auth/login");
    }
  },
);

// ================= ADMIN DASHBOARD =================
router.get("/admin", ensureAuthenticated, ensureRole("Admin"), (req, res) => {
  res.render("dashboard/admin", { user: req.user });
});

// ================= ADMISSIONS DASHBOARD =================
router.get(
  "/admissions",
  ensureAuthenticated,
  ensureRole("AdmissionsOfficer"),
  (req, res) => {
    res.render("dashboard/admissions", {
      title: "Admissions Dashboard",
      user: req.user,
    });
  },
);

// ================= DEAN DASHBOARD =================
router.get("/dean", ensureAuthenticated, ensureRole("Dean"), (req, res) => {
  res.render("dashboard/dean", {
    title: "Dean Dashboard",
    user: req.user,
  });
});

// ================= FINANCE DASHBOARD =================
router.get(
  "/finance",
  ensureAuthenticated,
  ensureRole("FinanceOfficer"),
  (req, res) => {
    res.render("dashboard/finance", {
      title: "Finance Dashboard",
      user: req.user,
    });
  },
);

// ================= DEAN OF STUDENTS =================
router.get(
  "/dean-of-students",
  ensureAuthenticated,
  ensureRole("DeanOfStudents"),
  (req, res) => {
    res.render("dashboard/dean-of-students", {
      title: "Dean of Students Dashboard",
      user: req.user,
    });
  },
);

// ================= REGISTRAR DASHBOARD =================
router.get(
  "/registrar",
  ensureAuthenticated,
  ensureRole("Registrar"),
  async (req, res) => {
    try {
      const totalStudents = await User.countDocuments({ role: "Student" });
      const activeStudents = await User.countDocuments({
        role: "Student",
        "studentProfile.registrationStatus": "Registered",
      });

      res.render("dashboard/registrar", {
        title: "Registrar Dashboard",
        user: req.user,
        stats: { totalStudents, activeStudents },
      });
    } catch (err) {
      console.error("Registrar Dashboard error:", err);
      req.flash("error_msg", "Failed to load Registrar dashboard");
      res.redirect("/dashboard/registrar");
    }
  },
);

// ================= VC DASHBOARD =================
// router.get("/vc", ensureAuthenticated, async (req, res) => {
//   if (req.user.role !== "VC") {
//     req.flash("error_msg", "Access denied. VC privileges required.");
//     return res.redirect("/auth/login");
//   }

//   res.render("dashboard/vc", {
//     title: "Vice-Chancellor Dashboard",
//     user: req.user,
//   });
// });

// ================= VC DASHBOARD =================

// router.get("/vc", ensureAuthenticated, async (req, res) => {
//   if (req.user.role !== "VC") {
//     req.flash("error_msg", "Access denied. VC privileges required.");
//     return res.redirect("/auth/login"); // fixed auth namespace
//   }

//   try {
//     const User = require("../models/User");

//     const totalStudents = await User.countDocuments({ role: "Student" });
//     const activeStudents = await User.countDocuments({
//       role: "Student",
//       "studentProfile.registrationStatus": "Registered",
//     });

//     const totalStaff = await User.countDocuments({
//       role: {
//         $in: ["TeachingStaff", "Admin", "AdmissionsOfficer", "FinanceOfficer"],
//       },
//     });

//     const academicStaff = await User.countDocuments({ role: "TeachingStaff" });
//     const totalDeans = await User.countDocuments({ role: "Dean" });
//     const totalHODs = await User.countDocuments({ role: "HOD" });
//     const totalDVCs = await User.countDocuments({ role: "DVC" });

//     const inbox = [
//       {
//         from: "University Registrar",
//         subject: "Council Meeting Agenda",
//         date: new Date(),
//         priority: "High",
//       },
//       {
//         from: "Finance Director",
//         subject: "Annual Budget Report",
//         date: new Date(),
//         priority: "Medium",
//       },
//       {
//         from: "Dean of Sciences",
//         subject: "New Programme Proposal",
//         date: new Date(),
//         priority: "High",
//       },
//     ];

//     const activities = [
//       {
//         type: "approval",
//         icon: "check-circle",
//         description: "Approved Engineering Faculty Budget",
//         time: "2 hours ago",
//       },
//       {
//         type: "info",
//         icon: "file-signature",
//         description: "Signed Memorandum of Understanding",
//         time: "1 day ago",
//       },
//       {
//         type: "approval",
//         icon: "user-check",
//         description: "Appointed new Head of Department",
//         time: "2 days ago",
//       },
//     ];

//     res.render("dashboard/vc", {
//       title: "Vice-Chancellor Dashboard - Copperstone University",
//       user: req.user,
//       stats: {
//         totalStudents,
//         activeStudents,
//         totalStaff,
//         academicStaff,
//         totalDeans,
//         totalHODs,
//         totalDVCs,
//         seniorStaff: totalDeans + totalHODs + totalDVCs,
//         pendingApprovals: 12,
//         urgentApprovals: 3,
//         activeIssues: 5,
//         disciplineCases: 2,
//         pendingDiscipline: 3,
//       },
//       inbox,
//       activities,
//     });
//   } catch (err) {
//     console.error("VC Dashboard error:", err);
//     req.flash("error_msg", "Failed to load VC dashboard");
//     res.redirect("/dashboard");
//   }
// });

// In your dashboard route file (where this route is)
router.get("/vc", ensureAuthenticated, async (req, res) => {
  if (req.user.role !== "VC") {
    req.flash("error_msg", "Access denied. VC privileges required.");
    return res.redirect("/auth/login");
  }

  try {
    const User = require("../models/User");

    const totalStudents = await User.countDocuments({ role: "Student" });
    const totalStaff = await User.countDocuments({
      role: {
        $in: ["TeachingStaff", "Admin", "AdmissionsOfficer", "FinanceOfficer"],
      },
    });

    const academicStaff = await User.countDocuments({ role: "TeachingStaff" });
    const totalDeans = await User.countDocuments({ role: "Dean" });
    const totalHODs = await User.countDocuments({ role: "HOD" });
    const totalDVCs = await User.countDocuments({ role: "DVC" });

    // Calculate total staff properly (include all staff types)
    const allStaffCount = totalStaff; // Already counting multiple roles

    // For the simplified dashboard, we only need these 4 stats
    const simplifiedStats = {
      totalStudents: totalStudents || 0,
      totalStaff: allStaffCount || 0,
      pendingApprovals: 12, // Your placeholder
      activeIssues: 5, // Your placeholder
    };

    res.render("dashboard/vc", {
      title: "Vice-Chancellor Dashboard - Copperstone University",
      user: req.user,
      stats: simplifiedStats, // Use simplified stats for the new template
      // Remove inbox and activities if not used in the new template
    });
  } catch (err) {
    console.error("VC Dashboard error:", err);
    req.flash("error_msg", "Failed to load VC dashboard");
    res.redirect("/dashboard");
  }
});

// ================= DIRECTOR ACADEMIC DASHBOARD =================
router.get(
  "/director-academic",
  ensureAuthenticated,
  ensureRole("DirectorAcademic"),
  async (req, res) => {
    try {
      const User = require("../models/User");
      const Programme = require("../models/Programme");

      const currentAcademicYear = "2024/2025";
      const currentSemester = 1;

      // Get statistics
      const totalStudents = await User.countDocuments({ role: "Student" });

      // Add this line: Count total lecturers
      const totalLecturers = await User.countDocuments({ role: "Lecturer" });

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
        stats: {
          totalStudents,
          pendingClearance,
          clearedForTerm,
          needNURTE,
        },
        programmeStats,
        recentClearances,
        totalLecturers, // Add this line to pass the variable to the template
      });
    } catch (err) {
      console.error("Director Academic Dashboard error:", err);
      req.flash("error_msg", "Failed to load Director Academic dashboard");
      res.redirect("/dashboard");
    }
  },
);

// router.get("/dashboard/lecturer", lecturerController.showLecturerDashboard);

module.exports = router;
