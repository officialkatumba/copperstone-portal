const express = require("express");
const router = express.Router();
const lecturerController = require("../controllers/lecturerController");
const { ensureAuthenticated, ensureLecturer } = require("../middleware/auth");
const upload = require("../config/multer"); // For file uploads

// Middleware to ensure user is a lecturer
// function ensureLecturer(req, res, next) {
//   if (req.user && req.user.role === "Lecturer") {
//     return next();
//   }
//   req.flash("error_msg", "Access denied. Lecturer privileges required.");
//   res.redirect("/login");
// }

// Apply both authentication and lecturer check
router.use(ensureAuthenticated);
router.use(ensureLecturer);

// Dashboard
router.get("/dashboard/lecturer", lecturerController.showLecturerDashboard);

// Courses
router.get("/lecturer/courses", lecturerController.viewMyCourses);
router.get("/lecturer/class-list/:courseId", lecturerController.viewClassList);

// Grade Management
router.get("/lecturer/grades/upload", lecturerController.showGradeUploadForm);
router.post(
  "/lecturer/grades/upload",
  upload.single("gradeFile"),
  lecturerController.uploadGrades
);

router.get("/lecturer/grades/manual", lecturerController.showManualGradeEntry);
router.post(
  "/lecturer/grades/manual/save",
  lecturerController.saveManualGrades
);

router.get("/lecturer/grades/manage", lecturerController.manageGrades);
router.post("/lecturer/grades/submit", lecturerController.submitForApproval);
router.get("/lecturer/grades/approvals", lecturerController.viewGradeApprovals);
router.delete("/lecturer/grades/:gradeId", lecturerController.deleteGrade);

module.exports = router;
