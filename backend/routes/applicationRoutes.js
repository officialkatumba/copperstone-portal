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

// My applications
router.get(
  "/my",
  //  ensureAuthenticated,
  getMyApplications
);

module.exports = router;
