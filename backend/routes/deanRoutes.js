const express = require("express");
const router = express.Router();

function ensureDean(req, res, next) {
  if (req.isAuthenticated() && req.user.role === "Dean") return next();
  req.flash("error_msg", "Access denied.");
  res.redirect("/login");
}

const {
  showAssignCourses,
  assignCoursesToStudent,
} = require("../controllers/deanController");

// Reports
router.get("/dean/reports", ensureDean, (req, res) => {
  res.render("dean/reports", { user: req.user });
});

// Programme approvals
router.get("/dean/programmes", ensureDean, (req, res) => {
  res.render("dean/programmes", { user: req.user });
});

// Lecturer performance
router.get("/dean/lecturers", ensureDean, (req, res) => {
  res.render("dean/lecturers", { user: req.user });
});

// NEW ROUTE — Show assign form
router.get("/dean/assign-courses", ensureDean, showAssignCourses);

// NEW ROUTE — Assign courses
router.post("/dean/assign-courses", ensureDean, assignCoursesToStudent);

module.exports = router;
