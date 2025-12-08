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
