// controllers/studentAffairsController.js
const Student = require("../models/Student");
const Payment = require("../models/Payment");
const Complaint = require("../models/Complaint");
const Attendance = require("../models/Attendance");

exports.getDashboard = async (req, res) => {
  try {
    console.log("DEBUG: Student Affairs Dashboard accessed");
    console.log("DEBUG: User role is:", req.user.role);
    console.log("DEBUG: User ID is:", req.user._id);

    // Get basic counts with error handling
    let totalStudents = 0;
    let presentToday = 0;
    let pendingComplaints = 0;
    let recentPayments = 0;

    try {
      totalStudents = await Student.countDocuments();
      console.log("DEBUG: Total students count:", totalStudents);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      presentToday = await Attendance.countDocuments({
        date: { $gte: today },
        status: "present",
      });
      console.log("DEBUG: Present today count:", presentToday);

      pendingComplaints = await Complaint.countDocuments({
        status: "pending",
      });
      console.log("DEBUG: Pending complaints count:", pendingComplaints);

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      recentPayments = await Payment.countDocuments({
        createdAt: { $gte: oneWeekAgo },
      });
      console.log("DEBUG: Recent payments count:", recentPayments);
    } catch (dbError) {
      console.error("DEBUG: Database error:", dbError.message);
      // Continue with zero values if DB errors
    }

    res.render("studentAffairs/dashboard", {
      title: "Student Affairs Admin Dashboard",
      user: req.user,
      stats: {
        totalStudents,
        presentToday,
        pendingComplaints,
        recentPayments,
      },
      debugMode: true, // For testing
    });
  } catch (error) {
    console.error("DEBUG: Controller error:", error);
    req.flash("error_msg", "Error loading dashboard: " + error.message);
    res.redirect("/dashboard");
  }
};

exports.getStats = async (req, res) => {
  try {
    console.log("DEBUG: Stats endpoint called");

    // Simple stats for testing
    const totalStudents = await Student.countDocuments();
    const totalComplaints = await Complaint.countDocuments();
    const totalPayments = await Payment.countDocuments({
      status: "completed",
    });

    res.json({
      success: true,
      data: {
        totalStudents,
        totalComplaints,
        totalPayments,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("DEBUG: Stats error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.viewStudents = async (req, res) => {
  try {
    console.log("DEBUG: View students called");

    const students = await Student.find({})
      .select("firstName lastName email program year gender")
      .limit(10)
      .sort({ createdAt: -1 });

    res.render("studentAffairs/students", {
      title: "Students Overview",
      user: req.user,
      students: students,
    });
  } catch (error) {
    console.error("DEBUG: View students error:", error);
    req.flash("error_msg", "Error loading students");
    res.redirect("/student-affairs/dashboard");
  }
};

exports.viewComplaints = async (req, res) => {
  try {
    console.log("DEBUG: View complaints called");

    const complaints = await Complaint.find({})
      .populate("student", "firstName lastName email")
      .limit(10)
      .sort({ createdAt: -1 });

    res.render("studentAffairs/complaints", {
      title: "Complaints Overview",
      user: req.user,
      complaints: complaints,
    });
  } catch (error) {
    console.error("DEBUG: View complaints error:", error);
    req.flash("error_msg", "Error loading complaints");
    res.redirect("/student-affairs/dashboard");
  }
};

exports.viewAttendance = async (req, res) => {
  try {
    console.log("DEBUG: View attendance called");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({ date: { $gte: today } })
      .populate("student", "firstName lastName email")
      .limit(10)
      .sort({ createdAt: -1 });

    res.render("studentAffairs/attendance", {
      title: "Today's Attendance",
      user: req.user,
      attendance: attendance,
    });
  } catch (error) {
    console.error("DEBUG: View attendance error:", error);
    req.flash("error_msg", "Error loading attendance");
    res.redirect("/student-affairs/dashboard");
  }
};
