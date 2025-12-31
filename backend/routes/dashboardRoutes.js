// const express = require("express");
// const router = express.Router();
// const User = require("../models/User"); // ✅ add this line

// // Middleware to protect routes
// function ensureAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) return next();
//   req.flash("error", "Please log in to access this page.");
//   res.redirect("/login");
// }

// // Student Dashboard

// // const User = require("../models/User");
// const { generateSignedUrl } = require("../config/gcsUpload");
// // const { ensureAuthenticated } = require("../middleware/auth");

// router.get("/dashboard/student", ensureAuthenticated, async (req, res) => {
//   try {
//     // Load fresh user document with all relations
//     const dbUser = await User.findById(req.user._id)
//       .populate("appliedCourses.firstChoice")
//       .populate("appliedCourses.secondChoice")
//       .populate("approvedCourses.programme")
//       .lean(); // lean for faster rendering

//     // Default: no image
//     let profilePicUrl = null;

//     // Generate signed URL if picture exists
//     if (dbUser?.studentProfile?.profilePicture?.gcsPath) {
//       profilePicUrl = await generateSignedUrl(
//         dbUser.studentProfile.profilePicture.gcsPath
//       );
//     }

//     // Render dashboard with signed URL
//     res.render("dashboard/student", {
//       title: "Student Dashboard",
//       user: dbUser,
//       profilePicUrl,
//     });
//   } catch (err) {
//     console.error("Dashboard load error:", err);
//     req.flash("error_msg", "Failed to load dashboard.");
//     res.redirect("/login");
//   }
// });

// // Admin Dashboard
// router.get("/dashboard/admin", ensureAuthenticated, (req, res) => {
//   res.render("dashboard/admin", { user: req.user });
// });

// // Admissions Officer Dashboard
// router.get("/dashboard/admissions", ensureAuthenticated, (req, res) => {
//   res.render("dashboard/admissions", {
//     title: "Admissions Dashboard",
//     user: req.user,
//   });
// });

// // Dean Dashboard
// router.get("/dashboard/dean", ensureAuthenticated, (req, res) => {
//   if (req.user.role !== "Dean") {
//     req.flash("error_msg", "Access denied.");
//     return res.redirect("/login");
//   }

//   res.render("dashboard/dean", {
//     title: "Dean Dashboard",
//     user: req.user,
//   });
// });

// // Finance Officer Dashboard
// router.get("/dashboard/finance", ensureAuthenticated, (req, res) => {
//   res.render("dashboard/finance", {
//     title: "Finance Dashboard",
//     user: req.user,
//   });
// });

// // VC Dashboard
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
const User = require("../models/User"); // ✅ add this line

// Middleware to protect routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash("error", "Please log in to access this page.");
  res.redirect("/login");
}

// Student Dashboard

// const User = require("../models/User");
const { generateSignedUrl } = require("../config/gcsUpload");
// const { ensureAuthenticated } = require("../middleware/auth");

router.get("/dashboard/student", ensureAuthenticated, async (req, res) => {
  try {
    // Load fresh user document with all relations
    const dbUser = await User.findById(req.user._id)
      .populate("appliedCourses.firstChoice")
      .populate("appliedCourses.secondChoice")
      .populate("approvedCourses.programme")
      .lean(); // lean for faster rendering

    // Default: no image
    let profilePicUrl = null;

    // Generate signed URL if picture exists
    if (dbUser?.studentProfile?.profilePicture?.gcsPath) {
      profilePicUrl = await generateSignedUrl(
        dbUser.studentProfile.profilePicture.gcsPath
      );
    }

    // Render dashboard with signed URL
    res.render("dashboard/student", {
      title: "Student Dashboard",
      user: dbUser,
      profilePicUrl,
    });
  } catch (err) {
    console.error("Dashboard load error:", err);
    req.flash("error_msg", "Failed to load dashboard.");
    res.redirect("/login");
  }
});

// Admin Dashboard
router.get("/dashboard/admin", ensureAuthenticated, (req, res) => {
  res.render("dashboard/admin", { user: req.user });
});

// Admissions Officer Dashboard
router.get("/dashboard/admissions", ensureAuthenticated, (req, res) => {
  res.render("dashboard/admissions", {
    title: "Admissions Dashboard",
    user: req.user,
  });
});

// Dean Dashboard
router.get("/dashboard/dean", ensureAuthenticated, (req, res) => {
  if (req.user.role !== "Dean") {
    req.flash("error_msg", "Access denied.");
    return res.redirect("/login");
  }

  res.render("dashboard/dean", {
    title: "Dean Dashboard",
    user: req.user,
  });
});

// Finance Officer Dashboard
router.get("/dashboard/finance", ensureAuthenticated, (req, res) => {
  res.render("dashboard/finance", {
    title: "Finance Dashboard",
    user: req.user,
  });
});

// ============= REGISTRAR DASHBOARD =============
router.get("/dashboard/registrar", ensureAuthenticated, async (req, res) => {
  // Check if user is Registrar
  if (req.user.role !== "Registrar") {
    req.flash("error_msg", "Access denied. Registrar privileges required.");
    return res.redirect("/login");
  }

  try {
    // Get statistics for Registrar dashboard
    const totalStudents = await User.countDocuments({ role: "Student" });
    const activeStudents = await User.countDocuments({
      role: "Student",
      "studentProfile.registrationStatus": "Registered",
    });

    // Count pending applications (you might need to adjust this based on your Application model)
    // Assuming you have an Application model for student applications
    const Application = require("../models/Application");
    const pendingApplications = await Application.countDocuments({
      status: { $in: ["Pending", "Under Review"] },
    });

    const approvedApplications = await Application.countDocuments({
      status: "Approved",
    });

    // Count students by level
    const certificateStudents = await User.countDocuments({
      role: "Student",
      level: "Certificate",
    });

    const diplomaStudents = await User.countDocuments({
      role: "Student",
      level: "Diploma",
    });

    const bachelorStudents = await User.countDocuments({
      role: "Student",
      level: "Bachelor",
    });

    const mastersStudents = await User.countDocuments({
      role: "Student",
      level: "Masters",
    });

    // Sample inbox for Registrar (you can populate with real data)
    const inbox = [
      {
        from: "Admissions Office",
        subject: "New Applications for Review",
        date: new Date(),
        priority: "High",
      },
      {
        from: "Academic Affairs",
        subject: "Academic Calendar Approval",
        date: new Date(),
        priority: "Medium",
      },
      {
        from: "Student Records",
        subject: "Graduation List Verification",
        date: new Date(),
        priority: "High",
      },
    ];

    // Sample recent activities
    const activities = [
      {
        type: "approval",
        icon: "check-circle",
        description: "Approved 15 student registrations",
        time: "3 hours ago",
      },
      {
        type: "info",
        icon: "file-signature",
        description: "Updated academic policies",
        time: "1 day ago",
      },
      {
        type: "review",
        icon: "eye",
        description: "Reviewed 25 new applications",
        time: "2 days ago",
      },
    ];

    res.render("dashboard/registrar", {
      title: "Registrar Dashboard - Copperstone University",
      user: req.user,
      stats: {
        totalStudents,
        activeStudents,
        pendingApplications,
        approvedApplications,
        certificateStudents,
        diplomaStudents,
        bachelorStudents,
        mastersStudents,
        totalProgrammes:
          certificateStudents +
          diplomaStudents +
          bachelorStudents +
          mastersStudents,
        newApplications: Math.floor(pendingApplications * 0.3), // Example: 30% of pending are new
        toReview: Math.floor(pendingApplications * 0.5), // Example: 50% need review
        pendingGraduations: 45, // Example number
        graduationToApprove: 12, // Example number
        totalCourses: 156, // Example number
        activeCourses: 120, // Example number
      },
      inbox,
      activities,
    });
  } catch (err) {
    console.error("Registrar Dashboard error:", err);
    req.flash("error_msg", "Failed to load Registrar dashboard");
    res.redirect("/dashboard");
  }
});

// VC Dashboard
router.get("/dashboard/vc", ensureAuthenticated, async (req, res) => {
  if (req.user.role !== "VC") {
    req.flash("error_msg", "Access denied. VC privileges required.");
    return res.redirect("/login");
  }

  try {
    // Get statistics for VC dashboard
    const User = require("../models/User");

    // Get counts
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

    // Sample data for inbox and activities (you would fetch these from actual models)
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

module.exports = router;
