const express = require("express");
const router = express.Router();
const { ensureAuthenticated, ensureRole } = require("../middleware/auth");
const deanOfStudentsController = require("../controllers/deanOfStudentsController");

// ================= BOARDING MANAGEMENT =================

// Boarding dashboard
router.get(
  "/boarding",
  ensureAuthenticated,
  ensureRole("DeanOfStudents"),
  deanOfStudentsController.boardingManagement
);

// Create bed spaces (ONE TIME ONLY)
router.post(
  "/boarding/create-beds",
  ensureAuthenticated,
  ensureRole("DeanOfStudents"),
  deanOfStudentsController.createBedSpaces
);

// Allocate bed (BY STUDENT NAME)
router.post(
  "/boarding/allocate",
  ensureAuthenticated,
  ensureRole("DeanOfStudents"),
  deanOfStudentsController.allocateBed
);

// Mark boarding payment paid
router.post(
  "/boarding/mark-paid",
  ensureAuthenticated,
  ensureRole("DeanOfStudents"),
  deanOfStudentsController.markPaymentPaid
);

// Vacate bed
router.post(
  "/boarding/vacate",
  ensureAuthenticated,
  ensureRole("DeanOfStudents"),
  deanOfStudentsController.vacateBed
);

module.exports = router;
