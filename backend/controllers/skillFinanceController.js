// backend/controllers/skillFinanceController.js
const SkillApplication = require("../models/SkillApplication");
const Skill = require("../models/Skill");
const { generateSignedUrl } = require("../config/gcsUpload");

// ---------------------------------------------------------
// LIST ALL SKILL APPLICATION PAYMENTS
// ---------------------------------------------------------
exports.listFinanceSkillApplications = async (req, res) => {
  try {
    const applications = await SkillApplication.find()
      .populate("applicant", "firstName surname email mobile")
      .populate("skill", "name code duration")
      .sort({ createdAt: -1 })
      .lean();

    res.render("finance/skills/applications", {
      title: "Finance – Skill Applications & Payments",
      applications,
      user: req.user,
    });
  } catch (err) {
    console.error("Finance skill list error:", err);
    req.flash("error_msg", "Could not load skill applications.");
    res.redirect("/dashboard/finance");
  }
};

// ---------------------------------------------------------
// VIEW SINGLE SKILL APPLICATION IN DETAIL
// ---------------------------------------------------------
exports.viewFinanceSkillApplicationDetail = async (req, res) => {
  try {
    const app = await SkillApplication.findById(req.params.id)
      .populate("applicant")
      .populate("skill")
      .lean();

    if (!app) {
      req.flash("error_msg", "Skill application not found.");
      return res.redirect("/finance/skills/applications");
    }

    // Signed URLs for uploaded files
    for (const doc of app.documents) {
      if (doc.gcsPath) {
        doc.signedUrl = await generateSignedUrl(doc.gcsPath);
      } else {
        doc.signedUrl = doc.gcsUrl;
      }
    }

    res.render("finance/skills/applicationDetail", {
      title: "Finance – Skill Application Detail",
      application: app,
      user: req.user,
    });
  } catch (err) {
    console.error("Finance skill detail error:", err);
    req.flash("error_msg", "Failed to load skill application detail.");
    res.redirect("/finance/skills/applications");
  }
};

// ---------------------------------------------------------
// VERIFY / REJECT PAYMENT
// ---------------------------------------------------------
exports.verifySkillPayment = async (req, res) => {
  try {
    const { status, remarks } = req.body; // Verified / Rejected

    const app = await SkillApplication.findById(req.params.id);

    if (!app) {
      req.flash("error_msg", "Skill application not found.");
      return res.redirect("/finance/skills/applications");
    }

    app.payment.status = status;
    app.payment.remarks = remarks || "";
    app.payment.verifiedBy = req.user._id;
    app.payment.verifiedAt = new Date();

    await app.save();

    req.flash("success_msg", `Payment marked as ${status}.`);
    return res.redirect("/finance/skills/applications");
  } catch (err) {
    console.error("Verify skill payment error:", err);
    req.flash("error_msg", "Failed to verify skill payment.");
    res.redirect("/finance/skills/applications");
  }
};
