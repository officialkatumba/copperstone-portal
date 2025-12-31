// routes/applicationRoutes.js
const express = require("express");
const router = express.Router();
const { multerUpload } = require("../config/gcsUpload");
// const { ensureAuthenticated } = require("../middleware/auth");
// const {
//   showApplicationForm,
//   submitApplication,
// } = require("../controllers/applicationController");
// const { ensureAuthenticated } = require("../middleware/auth");
const {
  showApplicationForm,
  submitApplication,
  getMyApplications, // ✅ add this
  viewAcceptanceLetter, // ← Make sure this line exists and is spelled correctly
  viewReceipt,
  viewApplicationDetails,
  viewMyCourses,
  generateResultsCard,
} = require("../controllers/applicationController");

// GET → Display the application form
// router.get("/apply", ensureAuthenticated, showApplicationForm);

router.get("/apply", showApplicationForm);

// POST → Submit application with documents
router.post(
  "/apply",
  //   ensureAuthenticated,
  multerUpload.array("documents", 5),
  submitApplication
);

router.get("/applications/:id/receipt", viewReceipt);

// My applications
router.get(
  "/my",
  //  ensureAuthenticated,
  getMyApplications
);

// Show acceptance letter
router.get(
  "/applications/:id/letter",
  // ensureAuthenticated,
  viewAcceptanceLetter // ✅ Use the controller
);

// router.get("/programs/applications/:id/letter", viewAcceptanceLetter);

router.get(
  "/applications/:id",
  // isAuthenticated,
  viewApplicationDetails
);

router.get(
  "/student/courses",
  // ensureAuthenticated,
  viewMyCourses
);

// In your student routes
router.get(
  "/student/results/:semester/:year",
  // ensureAuthenticated,
  generateResultsCard
);

module.exports = router;
