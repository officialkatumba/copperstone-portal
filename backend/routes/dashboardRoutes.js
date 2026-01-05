// // backend/routes/dashboardRoutes.js

// const express = require("express");
// const router = express.Router();
// const User = require("../models/User");
// const { generateSignedUrl } = require("../config/gcsUpload");

// // ✅ USE AUTH MIDDLEWARE (DO NOT REDEFINE)
// const { ensureAuthenticated, ensureRole } = require("../middleware/auth");

// // ================= STUDENT DASHBOARD =================
// router.get(
//   "/dashboard/student",
//   ensureAuthenticated,
//   ensureRole("Student"),
//   async (req, res) => {
//     try {
//       const dbUser = await User.findById(req.user._id)
//         .populate("appliedCourses.firstChoice")
//         .populate("appliedCourses.secondChoice")
//         .populate("approvedCourses.programme")
//         .lean();

//       let profilePicUrl = null;
//       if (dbUser?.studentProfile?.profilePicture?.gcsPath) {
//         profilePicUrl = await generateSignedUrl(
//           dbUser.studentProfile.profilePicture.gcsPath
//         );
//       }

//       res.render("dashboard/student", {
//         title: "Student Dashboard",
//         user: dbUser,
//         profilePicUrl,
//       });
//     } catch (err) {
//       console.error("Dashboard load error:", err);
//       req.flash("error_msg", "Failed to load dashboard.");
//       res.redirect("/auth/login");
//     }
//   }
// );

// // ================= ADMIN DASHBOARD =================
// router.get(
//   "/dashboard/admin",
//   ensureAuthenticated,
//   ensureRole("Admin"),
//   (req, res) => {
//     res.render("dashboard/admin", { user: req.user });
//   }
// );

// // ================= ADMISSIONS DASHBOARD =================
// router.get(
//   "/dashboard/admissions",
//   ensureAuthenticated,
//   ensureRole("AdmissionsOfficer"),
//   (req, res) => {
//     res.render("dashboard/admissions", {
//       title: "Admissions Dashboard",
//       user: req.user,
//     });
//   }
// );

// // ================= DEAN DASHBOARD =================
// router.get(
//   "/dashboard/dean",
//   ensureAuthenticated,
//   ensureRole("Dean"),
//   (req, res) => {
//     res.render("dashboard/dean", {
//       title: "Dean Dashboard",
//       user: req.user,
//     });
//   }
// );

// // ================= FINANCE DASHBOARD =================
// router.get(
//   "/dashboard/finance",
//   ensureAuthenticated,
//   ensureRole("FinanceOfficer"),
//   (req, res) => {
//     res.render("dashboard/finance", {
//       title: "Finance Dashboard",
//       user: req.user,
//     });
//   }
// );

// // ================= DEAN OF STUDENTS DASHBOARD =================
// router.get(
//   "/dashboard/dean-of-students",
//   ensureAuthenticated,
//   ensureRole("DeanOfStudents"),
//   (req, res) => {
//     console.log("LOGGED IN ROLE =", req.user.role);
//     res.render("dashboard/dean-of-students", {
//       title: "Dean of Students Dashboard",
//       user: req.user,
//     });
//   }
// );

// // ================= REGISTRAR DASHBOARD =================
// router.get(
//   "/dashboard/registrar",
//   ensureAuthenticated,
//   ensureRole("Registrar"),
//   async (req, res) => {
//     try {
//       const totalStudents = await User.countDocuments({ role: "Student" });
//       const activeStudents = await User.countDocuments({
//         role: "Student",
//         "studentProfile.registrationStatus": "Registered",
//       });

//       const Application = require("../models/Application");

//       const pendingApplications = await Application.countDocuments({
//         status: { $in: ["Pending", "Under Review"] },
//       });

//       const approvedApplications = await Application.countDocuments({
//         status: "Approved",
//       });

//       const certificateStudents = await User.countDocuments({
//         role: "Student",
//         level: "Certificate",
//       });

//       const diplomaStudents = await User.countDocuments({
//         role: "Student",
//         level: "Diploma",
//       });

//       const bachelorStudents = await User.countDocuments({
//         role: "Student",
//         level: "Bachelor",
//       });

//       const mastersStudents = await User.countDocuments({
//         role: "Student",
//         level: "Masters",
//       });

//       res.render("dashboard/registrar", {
//         title: "Registrar Dashboard - Copperstone University",
//         user: req.user,
//         stats: {
//           totalStudents,
//           activeStudents,
//           pendingApplications,
//           approvedApplications,
//           certificateStudents,
//           diplomaStudents,
//           bachelorStudents,
//           mastersStudents,
//           totalProgrammes:
//             certificateStudents +
//             diplomaStudents +
//             bachelorStudents +
//             mastersStudents,
//           newApplications: Math.floor(pendingApplications * 0.3),
//           toReview: Math.floor(pendingApplications * 0.5),
//           pendingGraduations: 45,
//           graduationToApprove: 12,
//           totalCourses: 156,
//           activeCourses: 120,
//         },
//       });
//     } catch (err) {
//       console.error("Registrar Dashboard error:", err);
//       req.flash("error_msg", "Failed to load Registrar dashboard");
//       res.redirect("/dashboard");
//     }
//   }
// );

// // ================= VC DASHBOARD =================

// router.get("/dashboard/vc", ensureAuthenticated, async (req, res) => {
//   if (req.user.role !== "VC") {
//     req.flash("error_msg", "Access denied. VC privileges required.");
//     return res.redirect("/login");
//   }

//   try {
//     // Get statistics for VC dashboard
//     const User = require("../models/User");

//     // Get counts
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

//     // Sample data for inbox and activities (you would fetch these from actual models)
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

// module.exports = router;

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
          dbUser.studentProfile.profilePicture.gcsPath
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
  }
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
  }
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
  }
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
  }
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
  }
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

router.get("/vc", ensureAuthenticated, async (req, res) => {
  if (req.user.role !== "VC") {
    req.flash("error_msg", "Access denied. VC privileges required.");
    return res.redirect("/auth/login"); // fixed auth namespace
  }

  try {
    const User = require("../models/User");

    const totalStudents = await User.countDocuments({ role: "Student" });
    const activeStudents = await User.countDocuments({
      role: "Student",
      "studentProfile.registrationStatus": "Registered",
    });

    const totalStaff = await User.countDocuments({
      role: {
        $in: ["TeachingStaff", "Admin", "AdmissionsOfficer", "FinanceOfficer"],
      },
    });

    const academicStaff = await User.countDocuments({ role: "TeachingStaff" });
    const totalDeans = await User.countDocuments({ role: "Dean" });
    const totalHODs = await User.countDocuments({ role: "HOD" });
    const totalDVCs = await User.countDocuments({ role: "DVC" });

    const inbox = [
      {
        from: "University Registrar",
        subject: "Council Meeting Agenda",
        date: new Date(),
        priority: "High",
      },
      {
        from: "Finance Director",
        subject: "Annual Budget Report",
        date: new Date(),
        priority: "Medium",
      },
      {
        from: "Dean of Sciences",
        subject: "New Programme Proposal",
        date: new Date(),
        priority: "High",
      },
    ];

    const activities = [
      {
        type: "approval",
        icon: "check-circle",
        description: "Approved Engineering Faculty Budget",
        time: "2 hours ago",
      },
      {
        type: "info",
        icon: "file-signature",
        description: "Signed Memorandum of Understanding",
        time: "1 day ago",
      },
      {
        type: "approval",
        icon: "user-check",
        description: "Appointed new Head of Department",
        time: "2 days ago",
      },
    ];

    res.render("dashboard/vc", {
      title: "Vice-Chancellor Dashboard - Copperstone University",
      user: req.user,
      stats: {
        totalStudents,
        activeStudents,
        totalStaff,
        academicStaff,
        totalDeans,
        totalHODs,
        totalDVCs,
        seniorStaff: totalDeans + totalHODs + totalDVCs,
        pendingApprovals: 12,
        urgentApprovals: 3,
        activeIssues: 5,
        disciplineCases: 2,
        pendingDiscipline: 3,
      },
      inbox,
      activities,
    });
  } catch (err) {
    console.error("VC Dashboard error:", err);
    req.flash("error_msg", "Failed to load VC dashboard");
    res.redirect("/dashboard");
  }
});

// router.get("/dashboard/lecturer", lecturerController.showLecturerDashboard);

module.exports = router;
