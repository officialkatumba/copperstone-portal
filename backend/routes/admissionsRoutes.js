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

const Application = require("../models/Application");
const { getSignedUrl } = require("../utils/gcs");
// const { ensureAuthenticated } = require("../middleware/auth");

// Show acceptance letter link (students and admissions staff can view)
router.get(
  "/applications/:id/letter",
  // ensureAuthenticated,
  async (req, res) => {
    try {
      const app = await Application.findById(req.params.id).populate(
        "applicant"
      );
      if (!app || !app.acceptanceLetter?.gcsName) {
        req.flash("error_msg", "Acceptance letter not found.");
        return res.redirect("back");
      }

      // Security: allow only admissions staff or the applicant to access
      const user = req.user;
      const isApplicant = user._id.toString() === app.applicant._id.toString();
      const isAdmissionStaff = [
        "AdmissionsOfficer",
        "Admin",
        "Registrar",
        "VC",
      ].includes(user.role);

      if (!isApplicant && !isAdmissionStaff) {
        req.flash("error_msg", "Unauthorized.");
        return res.redirect("back");
      }

      const signedUrl = await getSignedUrl(app.acceptanceLetter.gcsName, 30); // valid 30 days
      return res.redirect(signedUrl);
    } catch (err) {
      console.error(err);
      req.flash("error_msg", "Failed to get letter.");
      return res.redirect("back");
    }
  }
);

module.exports = router;
