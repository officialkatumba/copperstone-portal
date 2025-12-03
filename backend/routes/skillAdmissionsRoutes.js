// backend/routes/skillAdmissionsRoutes.js
const express = require("express");
const router = express.Router();

const {
  listSkillApplications,
  viewSkillApplicationDetail,
  updateSkillApplicationStatus,
  viewSkillAcceptanceLetter,
} = require("../controllers/skillAdmissionsController");

// List all skill applications
router.get("/skills/applications", listSkillApplications);

// View single skill application
router.get("/skills/applications/:id", viewSkillApplicationDetail);

// Update status (approve/reject)
router.post("/skills/applications/:id/status", updateSkillApplicationStatus);

// View acceptance letter
router.get("/skills/applications/:id/letter", viewSkillAcceptanceLetter);

module.exports = router;
