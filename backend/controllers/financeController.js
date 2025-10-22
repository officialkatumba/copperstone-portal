// backend/controllers/financeController.js
const Application = require("../models/Application");
const { generateSignedUrl } = require("../config/gcsUpload");

// List all applications with payments
exports.listFinanceApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("applicant", "firstName surname email mobile")
      .populate("firstChoice", "name code level")
      .populate("secondChoice", "name code level")
      .sort({ createdAt: -1 })
      .lean();

    res.render("finance/applications", {
      title: "Finance - Applications & Payments",
      applications,
      user: req.user,
    });
  } catch (err) {
    console.error("Finance list error:", err);
    req.flash("error_msg", "Could not load finance applications.");
    res.redirect("/dashboard/finance");
  }
};

// View single application + payment
exports.viewFinanceApplicationDetail = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate("applicant")
      .populate("firstChoice")
      .populate("secondChoice")
      .lean();

    if (!app) {
      req.flash("error_msg", "Application not found.");
      return res.redirect("/finance/applications");
    }

    // Generate signed URLs for docs
    for (const doc of app.documents) {
      if (doc.gcsPath) doc.signedUrl = await generateSignedUrl(doc.gcsPath);
      else if (doc.gcsUrl) doc.signedUrl = doc.gcsUrl;
    }

    res.render("finance/applicationDetail", {
      title: "Finance - Application Detail",
      application: app,
      user: req.user,
    });
  } catch (err) {
    console.error("Finance detail error:", err);
    req.flash("error_msg", "Failed to load application detail.");
    res.redirect("/finance/applications");
  }
};

// Verify / reject payment
exports.verifyPayment = async (req, res) => {
  try {
    const { status, remarks } = req.body; // status = Verified / Rejected
    const app = await Application.findById(req.params.id);

    if (!app) {
      req.flash("error_msg", "Application not found.");
      return res.redirect("/finance/applications");
    }

    app.payment.status = status;
    app.payment.remarks = remarks || "";
    app.payment.verifiedBy = req.user._id;
    app.payment.verifiedAt = new Date();
    await app.save();

    req.flash("success_msg", `Payment marked as ${status}.`);
    res.redirect("/finance/applications");
  } catch (err) {
    console.error("Verify payment error:", err);
    req.flash("error_msg", "Failed to verify payment.");
    res.redirect("/finance/applications");
  }
};
