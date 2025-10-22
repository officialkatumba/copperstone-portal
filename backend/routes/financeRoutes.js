// backend/routes/financeRoutes.js
const express = require("express");
const router = express.Router();
const {
  listFinanceApplications,
  viewFinanceApplicationDetail,
  verifyPayment,
} = require("../controllers/financeController");

// const { ensureAuthenticated } = require("../middleware/auth");

router.get("/applications", listFinanceApplications);
router.get("/applications/:id", viewFinanceApplicationDetail);
router.post("/applications/:id/verify", verifyPayment);

module.exports = router;
