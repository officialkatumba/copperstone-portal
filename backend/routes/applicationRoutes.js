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
  getMyPayments,
  viewMyReceipt,
  viewMyProofOfPayment,
} = require("../controllers/applicationController");

/**
 * MOUNTED AT:
 * app.use("/applications", applicationRoutes);
 *
 * Final URLs are shown in comments
 */

// ================= IMPORTANT: SPECIFIC ROUTES FIRST =================
// These must come BEFORE the /:id route to avoid "payments" being interpreted as an ID

// Student payments routes
// GET /applications/payments
router.get("/payments", getMyPayments);

// GET /applications/payments/:id/receipt
router.get("/payments/:id/receipt", viewMyReceipt);

// GET /applications/payments/:id/proof
router.get("/payments/:id/proof", viewMyProofOfPayment);

// ================= STUDENT COURSES =================
// GET /applications/student/courses
router.get("/student/courses", viewMyCourses);

// ================= RESULTS =================
// GET /applications/student/results/:semester/:year
router.get("/student/results/:semester/:year", generateResultsCard);

// ================= APPLY =================
// GET /applications/apply
router.get("/apply", showApplicationForm);

// POST /applications/apply
router.post("/apply", multerUpload.array("documents", 5), submitApplication);

// ================= MY APPLICATIONS =================
// GET /applications/my
router.get("/my", getMyApplications);

// ================= APPLICATION DETAILS =================
// ⚠️ THIS PARAMETERIZED ROUTE MUST COME AFTER ALL SPECIFIC ROUTES ⚠️
// GET /applications/:id
router.get("/:id", viewApplicationDetails);

// ================= RECEIPTS =================
// GET /applications/:id/receipt
router.get("/:id/receipt", viewReceipt);

// ================= ACCEPTANCE LETTER =================
// GET /applications/:id/letter
router.get("/:id/letter", viewAcceptanceLetter);

module.exports = router;
