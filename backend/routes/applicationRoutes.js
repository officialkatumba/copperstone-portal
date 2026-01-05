// // routes/applicationRoutes.js
// const express = require("express");
// const router = express.Router();
// const { multerUpload } = require("../config/gcsUpload");
// // const { ensureAuthenticated } = require("../middleware/auth");

// const {
//   showApplicationForm,
//   submitApplication,
//   getMyApplications, // ✅ add this
//   viewAcceptanceLetter, // ← Make sure this line exists and is spelled correctly
//   viewReceipt,
//   viewApplicationDetails,
//   viewMyCourses,
//   generateResultsCard,
// } = require("../controllers/applicationController");

// // GET → Display the application form
// // router.get("/apply", ensureAuthenticated, showApplicationForm);

// router.get("/apply", showApplicationForm);

// // POST → Submit application with documents
// router.post(
//   "/apply",
//   //   ensureAuthenticated,
//   multerUpload.array("documents", 5),
//   submitApplication
// );

// router.get("/applications/:id/receipt", viewReceipt);

// // My applications
// router.get(
//   "/my",
//   //  ensureAuthenticated,
//   getMyApplications
// );

// // Show acceptance letter
// router.get(
//   "/applications/:id/letter",
//   // ensureAuthenticated,
//   viewAcceptanceLetter // ✅ Use the controller
// );

// // router.get("/programs/applications/:id/letter", viewAcceptanceLetter);

// router.get(
//   "/applications/:id",
//   // isAuthenticated,
//   viewApplicationDetails
// );

// router.get(
//   "/student/courses",
//   // ensureAuthenticated,
//   viewMyCourses
// );

// // In your student routes
// router.get(
//   "/student/results/:semester/:year",
//   // ensureAuthenticated,
//   generateResultsCard
// );

// module.exports = router;

// routes/applicationRoutes.js
const express = require("express");
const router = express.Router();
const { multerUpload } = require("../config/gcsUpload");

// Controllers
const {
  showApplicationForm,
  submitApplication,
  getMyApplications,
  viewAcceptanceLetter,
  viewReceipt,
  viewApplicationDetails,
  viewMyCourses,
  generateResultsCard,
} = require("../controllers/applicationController");

/**
 * MOUNTED AT:
 * app.use("/applications", applicationRoutes);
 *
 * Final URLs are shown in comments
 */

// ================= APPLY =================

// GET → Display application form
// GET /applications/apply
router.get("/apply", showApplicationForm);

// POST → Submit application
// POST /applications/apply
router.post("/apply", multerUpload.array("documents", 5), submitApplication);

// ================= MY APPLICATIONS =================

// GET /applications/my
router.get("/my", getMyApplications);

// ================= APPLICATION DETAILS =================

// GET /applications/:id
router.get("/:id", viewApplicationDetails);

// ================= RECEIPTS =================

// GET /applications/:id/receipt
router.get("/:id/receipt", viewReceipt);

// ================= ACCEPTANCE LETTER =================

// GET /applications/:id/letter
router.get("/:id/letter", viewAcceptanceLetter);

// ================= STUDENT COURSES =================

// GET /applications/student/courses
router.get("/student/courses", viewMyCourses);

// ================= RESULTS =================

// GET /applications/student/results/:semester/:year
router.get("/student/results/:semester/:year", generateResultsCard);

module.exports = router;
