// backend/routes/skillFinanceRoutes.js
const express = require("express");
const router = express.Router();

const {
  listFinanceSkillApplications,
  viewFinanceSkillApplicationDetail,
  verifySkillPayment,
} = require("../controllers/skillFinanceController");

// ---------------------------------------------------------
// 1. Redirect /finance/skills → /finance/skills/applications
// ---------------------------------------------------------
router.get("/skills", (req, res) => {
  res.redirect("/finance/skills/applications");
});

// ---------------------------------------------------------
// 2. LIST all skill applications
//    GET /finance/skills/applications
// ---------------------------------------------------------
router.get("/skills/applications", listFinanceSkillApplications);

// ---------------------------------------------------------
// 3. VIEW ONE application
//    GET /finance/skills/applications/:id
// ---------------------------------------------------------
router.get("/skills/applications/:id", viewFinanceSkillApplicationDetail);

// ---------------------------------------------------------
// 4. VERIFY PAYMENT (POST)
//    POST /finance/skills/applications/:id/verify
// ---------------------------------------------------------
router.post("/skills/applications/:id/verify", verifySkillPayment);

module.exports = router;
