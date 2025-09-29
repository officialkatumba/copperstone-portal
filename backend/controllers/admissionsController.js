// controllers/admissionsController.js
const Application = require("../models/Application");
// const Application = require("../models/Application");
// const Programme = require("../models/Programme");
// const User = require("../models/User");

exports.showAdmissionsDashboard = (req, res) => {
  res.render("dashboard/admissions", {
    title: "Admissions Dashboard",
    user: req.user,
  });
};

// View all student applications
exports.viewAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("applicant", "firstName surname email mobile")
      .populate("firstChoice", "name code level")
      .populate("secondChoice", "name code level")
      .sort({ createdAt: -1 });

    res.render("admissions/applications", {
      title: "All Applications",
      applications,
      user: req.user,
    });
  } catch (err) {
    console.error("Error fetching applications:", err);
    req.flash("error_msg", "Could not load applications.");
    res.redirect("/dashboard/admissions");
  }
};

// Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    await Application.findByIdAndUpdate(req.params.id, {
      status,
      remarks,
      reviewedAt: new Date(),
    });

    req.flash("success_msg", "Application status updated successfully.");
    res.redirect("/admissions/applications");
  } catch (err) {
    console.error("Error updating application:", err);
    req.flash("error_msg", "Failed to update application status.");
    res.redirect("/admissions/applications");
  }
};

// List all applications
exports.listApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("applicant", "firstName surname email mobile")
      .populate("firstChoice", "name code level")
      .populate("secondChoice", "name code level")
      .sort({ createdAt: -1 });

    res.render("admissions/applications", {
      title: "All Applications",
      applications,
      user: req.user,
    });
  } catch (err) {
    console.error("Error fetching applications:", err);
    req.flash("error_msg", "Failed to load applications.");
    res.redirect("/dashboard/admissions");
  }
};

// View application detail
exports.viewApplicationDetail = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate("applicant")
      .populate("firstChoice")
      .populate("secondChoice");

    if (!app) {
      req.flash("error_msg", "Application not found.");
      return res.redirect("/admissions/applications");
    }

    res.render("admissions/applicationDetail", {
      title: "Application Detail",
      application: app,
      user: req.user,
    });
  } catch (err) {
    console.error("Error fetching application detail:", err);
    req.flash("error_msg", "Failed to load application detail.");
    res.redirect("/admissions/applications");
  }
};

// Update application status (approve/reject)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const app = await Application.findById(req.params.id);
    if (!app) {
      req.flash("error_msg", "Application not found.");
      return res.redirect("/admissions/applications");
    }

    app.status = status;
    app.remarks = remarks || "";
    app.reviewedAt = new Date();
    await app.save();

    req.flash(
      "success_msg",
      `Application ${status.toLowerCase()} successfully.`
    );
    res.redirect("/admissions/applications");
  } catch (err) {
    console.error("Error updating application status:", err);
    req.flash("error_msg", "Failed to update application.");
    res.redirect("/admissions/applications");
  }
};
