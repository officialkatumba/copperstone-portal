// routes/studentRoutes.js

const express = require("express");
const router = express.Router();
const { ensureAuthenticated, ensureRole } = require("../middleware/auth");
const studentController = require("../controllers/studentController");

// All routes in this file are protected and require Student role
router.use(ensureAuthenticated);
router.use(ensureRole("Student"));

// ================= STUDENT DASHBOARD =================
router.get("/dashboard", studentController.getStudentDashboard);

// ================= STUDENT PAYMENTS =================
router.get("/payments", studentController.getMyPayments);
router.get("/payments/:id/receipt", studentController.viewMyReceipt);
router.get("/payments/:id/proof", studentController.viewMyProofOfPayment);

// ================= STUDENT PROFILE =================
router.get("/profile", studentController.getStudentProfile);
router.post("/profile", studentController.updateStudentProfile);

module.exports = router;
