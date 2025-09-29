// // routes/admissionsRoutes.js
// const express = require("express");
// const router = express.Router();
// const {
//   showAdmissionsDashboard,
//   viewAllApplications,
//   updateApplicationStatus,
// } = require("../controllers/admissionsController");
// // const { ensureAuthenticated } = require("../middleware/auth");

// // Admissions dashboard
// router.get(
//   "/dashboard",
//   // , ensureAuthenticated
//   showAdmissionsDashboard
// );

// // View all applications
// router.get(
//   "/applications",
//   // , ensureAuthenticated
//   viewAllApplications
// );

// // Update application status
// router.post(
//   "/applications/:id/update",
//   //   ensureAuthenticated,
//   updateApplicationStatus
// );

// module.exports = router;

// const express = require("express");
// const router = express.Router();
// const {
//   listApplications,
//   viewApplicationDetail,
//   updateApplicationStatus,
// } = require("../controllers/admissionsController");

// // Ensure only AdmissionsOfficer can access
// const { ensureAuthenticated } = require("../middleware/auth");

// router.get("/applications", ensureAuthenticated, listApplications);
// router.get("/applications/:id", ensureAuthenticated, viewApplicationDetail);
// router.post(
//   "/applications/:id/status",
//   ensureAuthenticated,
//   updateApplicationStatus
// );

// module.exports = router;

// routes/admissionsRoutes.js
const express = require("express");
const router = express.Router();
const {
  showAdmissionsDashboard,
  listApplications,
  viewApplicationDetail,
  updateApplicationStatus,
} = require("../controllers/admissionsController");

// const { ensureAuthenticated } = require("../middleware/auth");

// Admissions dashboard
router.get(
  "/dashboard",
  // ensureAuthenticated,
  showAdmissionsDashboard
);

// View all applications
router.get(
  "/applications",
  // ensureAuthenticated,
  listApplications
);

// View single application detail
router.get(
  "/applications/:id",
  // ensureAuthenticated,
  viewApplicationDetail
);

// Update application status (approve/reject/under review)
router.post(
  "/applications/:id/status",
  // ensureAuthenticated,
  updateApplicationStatus
);

module.exports = router;
