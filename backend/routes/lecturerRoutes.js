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

// Courses
router.get("/courses", lecturerController.viewMyCourses);
router.get("/class-list/:courseId", lecturerController.viewClassList);

// Grade Management
router.get("/grades/upload", lecturerController.showGradeUploadForm);
router.post(
  "/grades/upload",
  upload.single("gradeFile"),
  lecturerController.uploadGrades
);

router.get("/grades/manual", lecturerController.showManualGradeEntry);
router.post("/grades/manual/save", lecturerController.saveManualGrades);

router.get("/grades/manage", lecturerController.manageGrades);
router.post("/grades/submit", lecturerController.submitForApproval);
router.get("/grades/approvals", lecturerController.viewGradeApprovals);
router.delete("/grades/:gradeId", lecturerController.deleteGrade);

module.exports = router;
