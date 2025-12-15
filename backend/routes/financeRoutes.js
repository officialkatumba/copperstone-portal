// backend/routes/financeRoutes.js
const express = require("express");
const router = express.Router();
const {
  listFinanceApplications,
  viewFinanceApplicationDetail,
  verifyPayment,
  viewReceipt,
  // ✅ NEW PAYMENT FEATURES
  showInitiatePaymentForm,
  createPayment,
  listPayments,
  viewPaymentReceipt,
  searchStudents,
} = require("../controllers/financeController");

// const { ensureAuthenticated } = require("../middleware/auth");

router.get("/applications", listFinanceApplications);
router.get("/applications/:id", viewFinanceApplicationDetail);
router.post("/applications/:id/verify", verifyPayment);
router.get("/applications/:id/receipt", viewReceipt);

// ===============================
// EXISTING APPLICATION ROUTES
// ===============================
router.get(
  "/applications",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  listFinanceApplications
);

router.get(
  "/applications/:id",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  viewFinanceApplicationDetail
);

router.post(
  "/applications/:id/verify",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  verifyPayment
);

// ===============================
// NEW PAYMENT ROUTES
// ===============================

// Show initiate payment form
router.get(
  "/payments/new",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  showInitiatePaymentForm
);

// Create payment
router.post(
  "/payments",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  createPayment
);

// List all payments
router.get(
  "/payments",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  listPayments
);

// View receipt
router.get(
  "/payments/:id/receipt",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  viewPaymentReceipt
);

// New route for searching students
router.get("/search-students", searchStudents);

module.exports = router;

module.exports = router;
