// // routes/skillApplicationRoutes.js
// const express = require("express");
// const router = express.Router();
// const { multerUpload } = require("../config/gcsUpload");

// const {
//   showSkillApplicationForm,
//   submitSkillApplication,
//   getMySkillApplications,
//   viewSkillAcceptanceLetter,
// } = require("../controllers/skillApplicationController");

// // GET → Display Skill Application Form
// router.get("/apply", showSkillApplicationForm);

// // POST → Submit skill application
// router.post(
//   "/apply",
//   multerUpload.array("documents", 5),
//   submitSkillApplication
// );

// // GET → My Skill Applications
// router.get("/my", getMySkillApplications);

// // GET → View acceptance letter for skills
// router.get("/applications/:id/letter", viewSkillAcceptanceLetter);

// router.get("/back", (req, res) => {
//   return res.redirect("/skills/apply");
// });

// module.exports = router;

// routes/skillApplicationRoutes.js
// const express = require("express");
// const router = express.Router();
// const { multerUpload } = require("../config/gcsUpload");
// const { ensureAuthenticated } = require("../middleware/auth");

// const {
//   showSkillApplicationForm,
//   submitSkillApplication,
//   getMySkillApplications,
//   viewSkillAcceptanceLetter,
// } = require("../controllers/skillApplicationController");

// // Show form
// router.get("/apply", ensureAuthenticated, showSkillApplicationForm);

// // Submit skill application
// router.post(
//   "/apply",
//   ensureAuthenticated,
//   multerUpload.array("documents", 5),
//   submitSkillApplication
// );

// // My skill applications
// router.get("/my", ensureAuthenticated, getMySkillApplications);

// // Acceptance letter
// router.get(
//   "/applications/:id/letter",
//   ensureAuthenticated,
//   viewSkillAcceptanceLetter
// );

// // Fallback
// router.get("/back", (req, res) => res.redirect("/skills/apply"));

// module.exports = router;

// routes/skillApplicationRoutes.js
const express = require("express");
const router = express.Router();
const { multerUpload } = require("../config/gcsUpload");

const {
  showSkillApplicationForm,
  submitSkillApplication,
  getMySkillApplications,
  viewSkillAcceptanceLetter,
} = require("../controllers/skillApplicationController");

// Show Skill Application Form
router.get("/apply", showSkillApplicationForm);

// Submit Skill Application
router.post(
  "/apply",
  multerUpload.array("documents", 5),
  submitSkillApplication
);

// View My Skill Applications
router.get("/my", getMySkillApplications);

// View Skill Acceptance Letter
router.get("/applications/:id/letter", viewSkillAcceptanceLetter);

// Fallback route
router.get("/back", (req, res) => {
  res.redirect("/skills/apply");
});

module.exports = router;
