// backend/routes/financeRoutes.js

const express = require("express");
const router = express.Router();
const {
  listFinanceApplications,
  viewFinanceApplicationDetail,
  // verifyPayment,
  verifyPaymentDirect,
  viewReceipt,
  cancelReceipt,
  // ✅ NEW PAYMENT FEATURES
  showInitiatePaymentForm,
  createPayment,
  listPayments,
  viewPaymentReceipt,
  searchStudents,
  showReportsPage,
  generatePaymentReport,
  quickStatsReport,
} = require("../controllers/financeController");

// Import multer middleware from your existing GCS config
const { multerUpload } = require("../config/gcsUpload");

// const { ensureAuthenticated } = require("../middleware/auth");

router.get("/applications", listFinanceApplications);
router.get("/applications/:id", viewFinanceApplicationDetail);
// router.post("/applications/:id/verify", verifyPayment);
router.get("/applications/:id/receipt", viewReceipt);

// ===============================
// EXISTING APPLICATION ROUTES
// ===============================
router.get(
  "/applications",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  listFinanceApplications,
);

router.get(
  "/applications/:id",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  viewFinanceApplicationDetail,
);

// ===============================
// NEW PAYMENT ROUTES
// ===============================

// Show initiate payment form
router.get(
  "/payments/new",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  showInitiatePaymentForm,
);

// Create payment WITH FILE UPLOAD SUPPORT
router.post(
  "/payments",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  multerUpload.single("paymentProof"), // ADD THIS MIDDLEWARE
  createPayment,
);

// List all payments
router.get(
  "/payments",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  listPayments,
);

// View receipt
router.get(
  "/payments/:id/receipt",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  viewPaymentReceipt,
);

// New route for searching students
router.get("/search-students", searchStudents);

const Payment = require("../models/Payment");

// Add this to financeRoutes.js
router.get("/payments/:id/proof", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment || !payment.proofOfPayment) {
      return res.status(404).send("Payment proof not found");
    }

    // Check if we have gcsPath or gcsUrl
    if (payment.proofOfPayment.gcsPath) {
      const { generateSignedUrl } = require("../config/gcsUpload");
      const signedUrl = await generateSignedUrl(payment.proofOfPayment.gcsPath);
      res.redirect(signedUrl);
    } else if (payment.proofOfPayment.gcsUrl) {
      res.redirect(payment.proofOfPayment.gcsUrl);
    } else {
      res.status(404).send("Proof file not found");
    }
  } catch (err) {
    console.error("Error viewing payment proof:", err);
    res.status(500).send("Error viewing payment proof");
  }
});

// Verify payment directly (from payments list)
router.post(
  "/payments/:id/verify",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  verifyPaymentDirect, // Add this controller
);

// In your finance routes file
router.post(
  "/payments/:id/cancel-receipt",
  // ensureAuthenticated,
  // ensureFinance,
  cancelReceipt,
);

// ===============================
// REPORT ROUTES
// ===============================

// Show reports page
router.get(
  "/reports",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  showReportsPage,
);

// Generate payment report (HTML or PDF)
router.get(
  "/reports/generate",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  generatePaymentReport,
);

// Quick stats API endpoint
router.get(
  "/reports/quick-stats",
  // ensureAuthenticated,
  // ensureFinanceOfficer,
  quickStatsReport,
);

module.exports = router;
