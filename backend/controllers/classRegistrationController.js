// controllers/classRegistrationController.js
const User = require("../models/User");
const Course = require("../models/Course"); // assuming you have a Course model

// Show class registration form
exports.showClassRegistrationForm = async (req, res) => {
  try {
    // Fetch available courses (limit to student's program or level if desired)
    const courses = await Course.find().lean();

    res.render("students/classRegistration", {
      title: "Register for Classes",
      user: req.user,
      courses,
    });
  } catch (err) {
    console.error("❌ Error loading class registration form:", err);
    req.flash("error_msg", "Failed to load class registration form.");
    res.redirect("/dashboard/student");
  }
};

// Handle registration submission
exports.submitClassRegistration = async (req, res) => {
  try {
    const selectedCourses = req.body.courses; // e.g., array of course IDs

    if (!selectedCourses || selectedCourses.length === 0) {
      req.flash("error_msg", "Please select at least one course.");
      return res.redirect("/student/register-classes");
    }

    // Update user record
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        "studentProfile.registrationStatus": "Approved",
      },
      $addToSet: {
        enrolledCourses: { $each: selectedCourses }, // optional if you add this field
      },
    });

    req.flash("success_msg", "Class registration completed successfully!");
    res.redirect("/dashboard/student");
  } catch (err) {
    console.error("❌ Error submitting class registration:", err);
    req.flash("error_msg", "Failed to complete class registration.");
    res.redirect("/student/register-classes");
  }
};
