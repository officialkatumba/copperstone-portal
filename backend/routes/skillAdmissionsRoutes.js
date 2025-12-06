// // // backend/routes/skillAdmissionsRoutes.js
// // const express = require("express");
// // const router = express.Router();

// // const {
// //   listSkillApplications,
// //   viewSkillApplicationDetail,
// //   updateSkillApplicationStatus,
// //   viewSkillAcceptanceLetter,
// // } = require("../controllers/skillAdmissionsController");

// // // List all skill applications
// // router.get("/skills/applications", listSkillApplications);

// // // View single skill application
// // router.get("/skills/applications/:id", viewSkillApplicationDetail);

// // // Update status (approve/reject)
// // router.post("/skills/applications/:id/status", updateSkillApplicationStatus);

// // // // View acceptance letter
// // // router.get("/skills/applications/:id/letter", viewSkillAcceptanceLetter);

// // // 🔥 FIXED: View acceptance letter
// // router.get("/applications/:id/letter", viewSkillAcceptanceLetter);

// // module.exports = router;

// // const express = require("express");
// // const router = express.Router();

// // const {
// //   listSkillApplications,
// //   viewSkillApplicationDetail,
// //   updateSkillApplicationStatus,
// //   viewSkillAcceptanceLetter,
// // } = require("../controllers/skillAdmissionsController");

// // // List skill applications
// // router.get("/", listSkillApplications);

// // // View one skill application
// // router.get("/:id", viewSkillApplicationDetail);

// // // Update status
// // router.post("/:id/status", updateSkillApplicationStatus);

// // // View acceptance letter
// // router.get("/:id/letter", viewSkillAcceptanceLetter);

// // module.exports = router;

// // // routes/skillAdmissionsRoutes.js
// // const express = require("express");
// // const router = express.Router();
// // // const { ensureAuthenticated } = require("../middleware/auth");
// // const { ensureAuthenticated } = require("../middleware/authMiddleware");

// // const {
// //   listSkillApplications,
// //   viewSkillApplicationDetail,
// //   approveSkillApplication,
// //   rejectSkillApplication,
// // } = require("../controllers/skillAdmissionsController");

// // // 🔥 LIST ALL SKILL APPLICATIONS
// // router.get(
// //   "/applications",
// //   //  ensureAuthenticated,
// //   listSkillApplications
// // );

// // // 🔥 VIEW A SINGLE SKILL APPLICATION
// // router.get(
// //   "/applications/:id",
// //   // ensureAuthenticated,
// //   viewSkillApplicationDetail
// // );

// // // 🔥 APPROVE SKILL APPLICATION
// // router.post(
// //   "/applications/:id/approve",
// //   // ensureAuthenticated,
// //   approveSkillApplication
// // );

// // // 🔥 REJECT SKILL APPLICATION
// // router.post(
// //   "/applications/:id/reject",
// //   // ensureAuthenticated,
// //   rejectSkillApplication
// // );

// // module.exports = router;

// // routes/skillAdmissionsRoutes.js
// // backend/routes/skillAdmissionsRoutes.js
// const express = require("express");
// const router = express.Router();

// const {
//   listSkillApplications,
//   viewSkillApplicationDetail,
//   updateSkillApplicationStatus,
//   viewSkillAcceptanceLetter,
// } = require("../controllers/skillAdmissionsController");

// // List all skill applications
// router.get("/skills/applications", listSkillApplications);

// // View single skill application
// router.get("/skills/applications/:id", viewSkillApplicationDetail);

// // Update status (approve/reject)
// router.post("/skills/applications/:id/status", updateSkillApplicationStatus);

// // 🔥 FIXED: View acceptance letter (consistent with student route structure)
// router.get("/skills/applications/:id/letter", viewSkillAcceptanceLetter);

// module.exports = router;

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
router.get("/applications", listSkillApplications);

// View single skill application
router.get("/applications/:id", viewSkillApplicationDetail);

// Update status (approve/reject)
router.post("/applications/:id/status", updateSkillApplicationStatus);

// View acceptance letter
router.get("/applications/:id/letter", viewSkillAcceptanceLetter);

module.exports = router;
