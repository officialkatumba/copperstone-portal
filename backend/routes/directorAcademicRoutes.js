// const express = require("express");
// const router = express.Router();

// const {
//   dashboard,
//   getPendingClearances,
//   getClearedStudents,
//   approveClearance,
//   resetSemesterClearance,
//   listStudents,
//   viewStudent,
// } = require("../controllers/directorAcademicController");

// // const { ensureAuthenticated, ensureRole } = require("../middleware/auth");

// // 🔐 Protect all Director Academic routes
// // router.use(ensureAuthenticated, ensureRole("DirectorAcademic"));

// /**
//  * ============================
//  * DASHBOARD
//  * ============================
//  */
// router.get("/", dashboard);

// /**
//  * ============================
//  * STUDENT VIEWS
//  * ============================
//  */
// router.get("/students", listStudents);
// router.get("/students/:id", viewStudent);

// /**
//  * ============================
//  * ACADEMIC CLEARANCE
//  * ============================
//  */
// router.get("/clearance/pending", getPendingClearances);
// router.get("/clearance/cleared", getClearedStudents);
// router.post("/clearance/:studentId/approve", approveClearance);

// /**
//  * ============================
//  * SEMESTER MAINTENANCE
//  * ============================
//  */
// router.post("/clearance/reset-semester", resetSemesterClearance);

// // Add these after your existing routes
// router.get("/payments", (req, res) => {
//   res.render("director-academic/payments", {
//     title: "All Payments",
//     user: req.user,
//   });
// });

// router.get("/expenses", (req, res) => {
//   res.render("director-academic/expenses", {
//     title: "All Expenses",
//     user: req.user,
//   });
// });

// router.get("/boarding", (req, res) => {
//   res.render("director-academic/boarding", {
//     title: "Students in Boarding",
//     user: req.user,
//   });
// });

// router.get("/lecturers", async (req, res) => {
//   try {
//     const lecturers = await User.find({ role: "Lecturer" })
//       .populate("department", "name")
//       .sort({ surname: 1 });

//     res.render("director-academic/lecturers", {
//       title: "All Lecturers",
//       user: req.user,
//       lecturers,
//     });
//   } catch (error) {
//     console.error("Lecturers error:", error);
//     res.status(500).render("error", {
//       message: "Error loading lecturers",
//       error: process.env.NODE_ENV === "development" ? error : {},
//     });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();

const {
  dashboard,
  getPendingClearances,
  getClearedStudents,
  approveClearance,
  resetSemesterClearance,
  listStudents,
  viewStudent,
  updateClearance,
  suspendStudent,
  reinstateStudent,
  listPayments,
  listExpenses,
  listBoardingStudents,
  listLecturers,
  viewLecturer,
  listReports,
} = require("../controllers/directorAcademicController");

const User = require("../models/User"); // Add this import
const { ensureAuthenticated, ensureRole } = require("../middleware/auth");

// 🔐 Protect all Director Academic routes
router.use(ensureAuthenticated, ensureRole("DirectorAcademic"));

/**
 * ============================
 * DASHBOARD
 * ============================
 */
router.get("/", dashboard);

/**
 * ============================
 * STUDENT MANAGEMENT
 * ============================
 */
router.get("/students", listStudents);
router.get("/students/:id", viewStudent);
router.post("/students/:id/clearance", updateClearance);
router.post("/students/:id/suspend", suspendStudent);
router.post("/students/:id/reinstate", reinstateStudent);

/**
 * ============================
 * ACADEMIC CLEARANCE
 * ============================
 */
router.get("/clearance/pending", getPendingClearances);
router.get("/clearance/cleared", getClearedStudents);
router.post("/clearance/:studentId/approve", approveClearance);

/**
 * ============================
 * PAYMENTS & FINANCE
 * ============================
 */
router.get("/payments", listPayments);

/**
 * ============================
 * EXPENSES
 * ============================
 */
router.get("/expenses", listExpenses);

/**
 * ============================
 * BOARDING STUDENTS
 * ============================
 */
router.get("/boarding", listBoardingStudents);

/**
 * ============================
 * LECTURER MANAGEMENT
 * ============================
 */
router.get("/lecturers", listLecturers);
router.get("/lecturers/:id", viewLecturer);

/**
 * ============================
 * REPORTS
 * ============================
 */
router.get("/reports", listReports);

/**
 * ============================
 * SEMESTER MAINTENANCE
 * ============================
 */
router.post("/clearance/reset-semester", resetSemesterClearance);

module.exports = router;
