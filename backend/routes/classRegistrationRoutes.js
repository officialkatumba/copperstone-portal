// routes/classRegistrationRoutes.js
const express = require("express");
const router = express.Router();
const {
  showClassRegistrationForm,
  submitClassRegistration,
} = require("../controllers/classRegistrationController");

// Middleware to ensure only logged-in students access this
function ensureStudent(req, res, next) {
  if (!req.isAuthenticated() || req.user.role !== "Student") {
    req.flash("error_msg", "Access denied. Please log in as a student.");
    return res.redirect("/login");
  }
  next();
}

// === ROUTES ===

// Show registration form
router.get(
  "/student/register-classes",
  ensureStudent,
  showClassRegistrationForm
);

// Handle submission
router.post(
  "/student/register-classes",
  ensureStudent,
  submitClassRegistration
);

module.exports = router;
