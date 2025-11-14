// routes/registrationRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  showRegistrationForm,
  submitRegistration,
} = require("../controllers/registrationController");

// Configure file upload for profile picture
const upload = multer({ dest: "uploads/" });

// Middleware to ensure only approved students can access
function ensureApprovedStudent(req, res, next) {
  if (!req.isAuthenticated() || req.user.role !== "Student") {
    req.flash("error_msg", "Access denied.");
    return res.redirect("/login");
  }

  if (req.user.studentProfile?.admissionStatus !== "Approved") {
    req.flash("error_msg", "You must be approved before registering.");
    return res.redirect("/dashboard/student");
  }

  next();
}

async function refreshUser(req, res, next) {
  if (req.isAuthenticated()) {
    const User = require("../models/User");
    req.user = await User.findById(req.user._id);
  }
  next();
}

// Routes
router.get(
  "/student/register",
  //  ensureApprovedStudent,
  showRegistrationForm
);
router.post(
  "/student/register",
  // ensureApprovedStudent,
  upload.single("profilePicture"),
  submitRegistration
);

module.exports = router;
