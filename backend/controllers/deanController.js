const User = require("../models/User");
const Course = require("../models/Course");

// deanController.js
module.exports.showAssignCourses = async (req, res) => {
  try {
    // Get all students with their programme and approved courses info
    const students = await User.find({ role: "Student" })
      .select(
        "firstName surname email programme level approvedCourses currentSemester"
      )
      .populate("programme", "name code")
      .populate("approvedCourses.programme", "name code")
      .sort({ firstName: 1 });

    const courses = await Course.find()
      .select("code name credits programmes")
      .populate("programmes", "name code")
      .sort({ code: 1 });

    res.render("dean/assignCourses", {
      title: "Assign Courses - Copperstone University",
      students,
      courses,
      // Flash messages will be available via res.locals from your existing setup
    });
  } catch (error) {
    console.error("Error loading assign courses page:", error);
    res.status(500).render("error", { error: "Failed to load page" });
  }
};

module.exports.assignCoursesToStudent = async (req, res) => {
  try {
    const { studentId, courseIds, semester, startDate, endDate } = req.body;

    // Find student with programme info
    const student = await User.findById(studentId)
      .populate("programme", "name")
      .populate("approvedCourses.programme", "name");

    if (!student) {
      req.flash("error_msg", "Student not found");
      return res.redirect("/dean/assign-courses");
    }

    // Convert single course ID to array if needed
    const courseIdsArray = Array.isArray(courseIds) ? courseIds : [courseIds];

    // Create course assignments
    const courseAssignments = courseIdsArray.map((courseId) => ({
      course: courseId,
      semester: parseInt(semester),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "Active",
    }));

    // Add to assignedCourses array
    student.assignedCourses.push(...courseAssignments);

    // Update current semester if assigned semester is higher
    if (parseInt(semester) > (student.currentSemester || 0)) {
      student.currentSemester = parseInt(semester);
    }

    await student.save();

    req.flash(
      "success_msg",
      `Courses assigned successfully to ${student.firstName} ${student.surname} for Semester ${semester}`
    );
    res.redirect("/dean/assign-courses");
  } catch (error) {
    console.error("Error assigning courses:", error);
    req.flash("error_msg", "Failed to assign courses");
    res.redirect("/dean/assign-courses");
  }
};
