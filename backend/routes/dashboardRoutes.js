// const express = require("express");
// const router = express.Router();

// // Middleware to protect routes
// function ensureAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) return next();
//   req.flash("error", "Please log in to access this page.");
//   res.redirect("/login");
// }

// // Student Dashboard

// // router.get("/dashboard/student", (req, res) => {
// //   res.render("dashboard/student", {
// //     title: "Student Dashboard",
// //     user: req.user, // make sure `req.user` is set by your auth middleware
// //   });
// // });

// const User = require("../models/User");

// router.get("/dashboard/student", ensureAuthenticated, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id)
//       .populate("appliedCourses.firstChoice")
//       .populate("appliedCourses.secondChoice")
//       .populate("approvedCourses.programme")
//       .lean();

//     res.render("dashboard/student", {
//       title: "Student Dashboard",
//       user,
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
// // router.get("/dashboard/admissions", ensureAuthenticated, (req, res) => {
// //   res.render("dashboard/admissions", { user: req.user });
// // });

// // Admissions Officer Dashboard
// router.get("/dashboard/admissions", ensureAuthenticated, (req, res) => {
//   res.render("dashboard/admissions", {
//     title: "Admissions Dashboard",
//     user: req.user,
//   });
// });

// // Finance Officer Dashboard
// // router.get("/dashboard/finance", ensureAuthenticated, (req, res) => {
// //   res.render("dashboard/finance", { user: req.user });
// // });

// router.get("/dashboard/finance", ensureAuthenticated, (req, res) => {
//   res.render("dashboard/finance", {
//     title: "Finance Dashboard",
//     user: req.user,
//   });
// });

// module.exports = router;
// //teaching staff dashboard route
// // Teaching Staff Dashboard
// // router.get("/dashboard/staff", ensureAuthenticated, (req, res) => {
// //   res.render("dashboard/staff", {

// //     title: "Teaching Staff Dashboard",
// //     user: req.user,
// //   });
// // } );

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
// router.get("/dashboard/student", ensureAuthenticated, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id)
//       .populate("appliedCourses.firstChoice")
//       .populate("appliedCourses.secondChoice")
//       .populate("approvedCourses.programme")
//       .lean();

//     res.render("dashboard/student", {
//       title: "Student Dashboard",
//       user,
//     });
//   } catch (err) {
//     console.error("Dashboard load error:", err);
//     req.flash("error_msg", "Failed to load dashboard.");
//     res.redirect("/login");
//   }
// });

// router.get("/dashboard/student", ensureAuthenticated, async (req, res) => {
//   try {
//     const dbUser = await User.findById(req.user._id)
//       .populate("appliedCourses.firstChoice")
//       .populate("appliedCourses.secondChoice")
//       .populate("approvedCourses.programme");
//     res.render("dashboard/student", {
//       title: "Student Dashboard",
//       user: dbUser, // ✅ use fresh dbUser, not req.user
//     });
//   } catch (err) {
//     console.error("Dashboard load error:", err);
//     req.flash("error_msg", "Failed to load dashboard.");
//     res.redirect("/login");
//   }
// });

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

module.exports = router;
