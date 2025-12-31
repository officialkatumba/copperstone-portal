const Course = require("../models/Course");
const User = require("../models/User");
const Grade = require("../models/Grade"); // You'll need to create this model

// Show Lecturer Dashboard
exports.showLecturerDashboard = async (req, res) => {
  try {
    // Get lecturer's courses
    const coursesTeaching = await Course.countDocuments({
      lecturers: req.user._id,
    });

    // Get total students in lecturer's courses
    const totalStudents = await User.countDocuments({
      role: "Student",
      "assignedCourses.course": {
        $in: await Course.find({ lecturers: req.user._id }).distinct("_id"),
      },
    });

    // Get grade statistics
    const gradesSubmitted = await Grade.countDocuments({
      lecturer: req.user._id,
      status: { $in: ["Submitted", "Approved", "Official"] },
    });

    const pendingGrades = await Grade.countDocuments({
      lecturer: req.user._id,
      status: "Draft",
    });

    const pendingApprovals = await Grade.countDocuments({
      lecturer: req.user._id,
      status: "Submitted",
    });

    // Sample recent activities
    const recentActivities = [
      {
        type: "grade",
        icon: "check-circle",
        description: "Submitted grades for PSY101",
        time: "2 hours ago",
      },
      {
        type: "upload",
        icon: "file-upload",
        description: "Uploaded lecture materials",
        time: "1 day ago",
      },
      {
        type: "approval",
        icon: "paper-plane",
        description: "Grades approved by Dean",
        time: "3 days ago",
      },
    ];

    res.render("dashboard/lecturer", {
      title: "Lecturer Dashboard",
      user: req.user,
      stats: {
        coursesTeaching,
        totalStudents,
        gradesSubmitted,
        pendingGrades,
        pendingApprovals,
      },
      recentActivities,
    });
  } catch (error) {
    console.error("Error loading lecturer dashboard:", error);
    req.flash("error_msg", "Failed to load dashboard");
    res.redirect("/dashboard");
  }
};

// View Lecturer's Courses
exports.viewMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ lecturers: req.user._id })
      .populate("programmes", "name code")
      .sort({ code: 1 });

    res.render("lecturer/courses", {
      title: "My Courses",
      courses,
      user: req.user,
    });
  } catch (error) {
    console.error("Error loading lecturer courses:", error);
    req.flash("error_msg", "Failed to load courses");
    res.redirect("/lecturer/dashboard");
  }
};

// View Class List for a Course
exports.viewClassList = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).populate(
      "programmes",
      "name"
    );

    if (!course) {
      req.flash("error_msg", "Course not found");
      return res.redirect("/lecturer/courses");
    }

    // Check if lecturer teaches this course
    if (!course.lecturers.includes(req.user._id)) {
      req.flash("error_msg", "You are not assigned to teach this course");
      return res.redirect("/lecturer/courses");
    }

    // Get students enrolled in this course
    const students = await User.find({
      role: "Student",
      "assignedCourses.course": courseId,
      "assignedCourses.status": "Active",
    })
      .select("firstName surname email studentId currentSemester")
      .populate("programme", "name")
      .sort({ surname: 1 });

    // Get existing grades for this course
    const existingGrades = await Grade.find({
      course: courseId,
      semester: { $exists: true },
    });

    res.render("lecturer/classList", {
      title: `Class List - ${course.code}`,
      course,
      students,
      existingGrades,
      user: req.user,
    });
  } catch (error) {
    console.error("Error loading class list:", error);
    req.flash("error_msg", "Failed to load class list");
    res.redirect("/lecturer/courses");
  }
};

// Show Grade Upload Form
exports.showGradeUploadForm = async (req, res) => {
  try {
    const courses = await Course.find({ lecturers: req.user._id })
      .select("code name")
      .sort({ code: 1 });

    res.render("lecturer/uploadGrades", {
      title: "Upload Student Grades",
      courses,
      user: req.user,
    });
  } catch (error) {
    console.error("Error loading grade upload form:", error);
    req.flash("error_msg", "Failed to load upload form");
    res.redirect("/lecturer/dashboard");
  }
};

// Handle Grade Upload (CSV/Excel)
exports.uploadGrades = async (req, res) => {
  try {
    const { courseId, semester, academicYear } = req.body;

    if (!req.file) {
      req.flash("error_msg", "Please select a file to upload");
      return res.redirect("back");
    }

    const course = await Course.findById(courseId);
    if (!course) {
      req.flash("error_msg", "Course not found");
      return res.redirect("back");
    }

    // Parse CSV/Excel file
    const gradesData = await parseGradeFile(req.file.path);

    // Validate and process grades
    for (const gradeData of gradesData) {
      const student = await User.findOne({
        studentId: gradeData.studentId,
        "assignedCourses.course": courseId,
      });

      if (student) {
        await Grade.create({
          student: student._id,
          course: courseId,
          lecturer: req.user._id,
          semester: parseInt(semester),
          academicYear,
          grade: gradeData.grade,
          percentage: gradeData.percentage,
          marks: gradeData.marks,
          status: "Draft",
          lecturerComments: gradeData.comments || "",
        });
      }
    }

    req.flash(
      "success_msg",
      `Successfully uploaded ${gradesData.length} grades`
    );
    res.redirect("/lecturer/grades/manage?course=" + courseId);
  } catch (error) {
    console.error("Error uploading grades:", error);
    req.flash(
      "error_msg",
      "Failed to upload grades. Please check file format."
    );
    res.redirect("back");
  }
};

// Manual Grade Entry
exports.showManualGradeEntry = async (req, res) => {
  try {
    const { courseId } = req.query;

    let course = null;
    let students = [];

    if (courseId) {
      course = await Course.findById(courseId).populate("programmes", "name");

      if (course && course.lecturers.includes(req.user._id)) {
        students = await User.find({
          role: "Student",
          "assignedCourses.course": courseId,
          "assignedCourses.status": "Active",
        })
          .select("firstName surname email studentId")
          .sort({ surname: 1 });

        // Get existing grades
        const existingGrades = await Grade.find({
          course: courseId,
          lecturer: req.user._id,
          status: { $ne: "Official" },
        }).populate("student", "studentId");

        // Merge existing grades with students
        students.forEach((student) => {
          const existingGrade = existingGrades.find(
            (g) => g.student.studentId === student.studentId
          );
          if (existingGrade) {
            student.existingGrade = existingGrade.grade;
            student.existingPercentage = existingGrade.percentage;
            student.existingComments = existingGrade.lecturerComments;
          }
        });
      }
    }

    const courses = await Course.find({ lecturers: req.user._id })
      .select("code name")
      .sort({ code: 1 });

    res.render("lecturer/manualGrades", {
      title: "Manual Grade Entry",
      courses,
      selectedCourse: course,
      students,
      currentSemester: new Date().getMonth() < 6 ? 2 : 1, // Example: Determine semester
      currentYear: new Date().getFullYear(),
      user: req.user,
    });
  } catch (error) {
    console.error("Error loading manual grade entry:", error);
    req.flash("error_msg", "Failed to load grade entry form");
    res.redirect("/lecturer/dashboard");
  }
};

// Save Manual Grades
exports.saveManualGrades = async (req, res) => {
  try {
    const { courseId, semester, academicYear, grades } = req.body;

    const course = await Course.findById(courseId);
    if (!course || !course.lecturers.includes(req.user._id)) {
      req.flash("error_msg", "Invalid course or unauthorized");
      return res.redirect("back");
    }

    let savedCount = 0;
    let updatedCount = 0;

    // Process each grade
    for (const studentId in grades) {
      const gradeData = grades[studentId];

      if (gradeData.grade) {
        const student = await User.findById(studentId);

        if (student) {
          // Check if grade already exists
          const existingGrade = await Grade.findOne({
            student: studentId,
            course: courseId,
            semester: parseInt(semester),
            academicYear,
          });

          if (existingGrade) {
            // Update existing grade
            existingGrade.grade = gradeData.grade;
            existingGrade.percentage = gradeData.percentage;
            existingGrade.marks = gradeData.marks;
            existingGrade.lecturerComments = gradeData.comments || "";
            existingGrade.status = gradeData.submitForApproval
              ? "Submitted"
              : "Draft";
            if (gradeData.submitForApproval) {
              existingGrade.submittedAt = new Date();
            }
            await existingGrade.save();
            updatedCount++;
          } else {
            // Create new grade
            await Grade.create({
              student: studentId,
              course: courseId,
              lecturer: req.user._id,
              semester: parseInt(semester),
              academicYear,
              grade: gradeData.grade,
              percentage: gradeData.percentage,
              marks: gradeData.marks,
              status: gradeData.submitForApproval ? "Submitted" : "Draft",
              lecturerComments: gradeData.comments || "",
              submittedAt: gradeData.submitForApproval ? new Date() : null,
            });
            savedCount++;
          }
        }
      }
    }

    req.flash(
      "success_msg",
      `Grades saved successfully! ${savedCount} new, ${updatedCount} updated. ` +
        (req.body.submitForApproval
          ? "Submitted for approval."
          : "Saved as draft.")
    );

    res.redirect("/lecturer/grades/manage?course=" + courseId);
  } catch (error) {
    console.error("Error saving manual grades:", error);
    req.flash("error_msg", "Failed to save grades");
    res.redirect("back");
  }
};

// View and Manage Grades
exports.manageGrades = async (req, res) => {
  try {
    const { courseId, status } = req.query;

    const filter = { lecturer: req.user._id };

    if (courseId) {
      filter.course = courseId;
    }

    if (status) {
      filter.status = status;
    }

    const grades = await Grade.find(filter)
      .populate("course", "code name")
      .populate("student", "firstName surname studentId")
      .sort({ updatedAt: -1 });

    const courses = await Course.find({ lecturers: req.user._id })
      .select("code name")
      .sort({ code: 1 });

    res.render("lecturer/manageGrades", {
      title: "Manage Grades",
      grades,
      courses,
      selectedCourse: courseId,
      selectedStatus: status,
      user: req.user,
    });
  } catch (error) {
    console.error("Error managing grades:", error);
    req.flash("error_msg", "Failed to load grades");
    res.redirect("/lecturer/dashboard");
  }
};

// Submit Grades for Approval
exports.submitForApproval = async (req, res) => {
  try {
    const { gradeIds } = req.body;

    if (!gradeIds || !Array.isArray(gradeIds)) {
      req.flash("error_msg", "No grades selected for submission");
      return res.redirect("back");
    }

    const result = await Grade.updateMany(
      { _id: { $in: gradeIds }, lecturer: req.user._id },
      {
        status: "Submitted",
        submittedAt: new Date(),
      }
    );

    req.flash(
      "success_msg",
      `${result.modifiedCount} grades submitted for approval`
    );
    res.redirect("/lecturer/grades/approvals");
  } catch (error) {
    console.error("Error submitting grades:", error);
    req.flash("error_msg", "Failed to submit grades for approval");
    res.redirect("back");
  }
};

// View Grade Approvals Status
exports.viewGradeApprovals = async (req, res) => {
  try {
    const grades = await Grade.find({
      lecturer: req.user._id,
      status: { $in: ["Submitted", "Under Review", "Approved", "Rejected"] },
    })
      .populate("course", "code name")
      .populate("student", "firstName surname studentId")
      .sort({ submittedAt: -1 });

    // Group by status
    const groupedGrades = {
      Submitted: grades.filter((g) => g.status === "Submitted"),
      UnderReview: grades.filter((g) => g.status === "Under Review"),
      Approved: grades.filter((g) => g.status === "Approved"),
      Rejected: grades.filter((g) => g.status === "Rejected"),
    };

    res.render("lecturer/gradeApprovals", {
      title: "Grade Approvals",
      groupedGrades,
      user: req.user,
    });
  } catch (error) {
    console.error("Error loading grade approvals:", error);
    req.flash("error_msg", "Failed to load approval status");
    res.redirect("/lecturer/dashboard");
  }
};

// Delete Grade Entry
exports.deleteGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;

    const grade = await Grade.findOneAndDelete({
      _id: gradeId,
      lecturer: req.user._id,
      status: "Draft",
    });

    if (!grade) {
      req.flash("error_msg", "Grade not found or cannot be deleted");
      return res.redirect("back");
    }

    req.flash("success_msg", "Grade deleted successfully");
    res.redirect("back");
  } catch (error) {
    console.error("Error deleting grade:", error);
    req.flash("error_msg", "Failed to delete grade");
    res.redirect("back");
  }
};

// Helper function to parse grade file
async function parseGradeFile(filePath) {
  // This is a simplified example
  // In production, use a library like csv-parser or xlsx
  const fs = require("fs");
  const csv = require("csv-parser"); // You'll need to install this

  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        // Clean up temp file
        fs.unlinkSync(filePath);
        resolve(results);
      })
      .on("error", reject);
  });
}
