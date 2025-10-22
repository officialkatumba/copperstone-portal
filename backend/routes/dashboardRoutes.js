const express = require("express");
const router = express.Router();

// Middleware to protect routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash("error", "Please log in to access this page.");
  res.redirect("/login");
}

// Student Dashboard

router.get("/dashboard/student", (req, res) => {
  res.render("dashboard/student", {
    title: "Student Dashboard",
    user: req.user, // make sure `req.user` is set by your auth middleware
  });
});

// Admin Dashboard
router.get("/dashboard/admin", ensureAuthenticated, (req, res) => {
  res.render("dashboard/admin", { user: req.user });
});

// Admissions Officer Dashboard
// router.get("/dashboard/admissions", ensureAuthenticated, (req, res) => {
//   res.render("dashboard/admissions", { user: req.user });
// });

// Admissions Officer Dashboard
router.get("/dashboard/admissions", ensureAuthenticated, (req, res) => {
  res.render("dashboard/admissions", {
    title: "Admissions Dashboard",
    user: req.user,
  });
});

// Finance Officer Dashboard
// router.get("/dashboard/finance", ensureAuthenticated, (req, res) => {
//   res.render("dashboard/finance", { user: req.user });
// });

router.get("/dashboard/finance", ensureAuthenticated, (req, res) => {
  res.render("dashboard/finance", {
    title: "Finance Dashboard",
    user: req.user,
  });
});

module.exports = router;
