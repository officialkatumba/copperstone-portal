const Skill = require("../models/Skill");
const SkillApplication = require("../models/SkillApplication");
const { uploadToGCS, generateSignedUrl } = require("../config/gcsUpload");

exports.showSkillApplicationForm = async (req, res) => {
  try {
    const skills = await Skill.find().sort({ name: 1 });

    res.render("skills/apply", {
      title: "Apply for a Skill",
      skills,
      user: req.user,
    });
  } catch (err) {
    console.error("Error loading skill application form:", err);
    req.flash("error_msg", "Failed to load skill application form.");
    res.redirect("/dashboard/student");
  }
};

exports.submitSkillApplication = async (req, res) => {
  try {
    const skillChoice = req.body.skill; // FIXED: correct field name

    const skill = await Skill.findById(skillChoice);
    if (!skill) {
      req.flash("error_msg", "Invalid skill selection.");
      return res.redirect("back");
    }

    const applicationYear = new Date().getFullYear();
    const skillCode = skill.code;

    const gcsDocs = [];
    for (const file of req.files) {
      const uploaded = await uploadToGCS(
        file,
        req.user,
        skillCode,
        applicationYear
      );

      gcsDocs.push({
        name: file.originalname,
        gcsUrl: uploaded.publicUrl,
        gcsPath: uploaded.path,
      });
    }

    await SkillApplication.create({
      applicant: req.user._id,
      applicantEmail: req.user.email,
      skill: skillChoice,
      documents: gcsDocs,
      payment: {
        method: req.body.paymentMethod,
        amount: req.body.paymentAmount || 0,
        status: "Pending",
      },
    });

    req.flash("success_msg", "Skill application submitted successfully!");
    res.redirect("/dashboard/student");
  } catch (err) {
    console.error("Skill Application Error:", err);
    req.flash("error_msg", "Failed to submit skill application.");
    res.redirect("/skills/apply");
  }
};

exports.getMySkillApplications = async (req, res) => {
  try {
    const applications = await SkillApplication.find({
      applicant: req.user._id,
    })
      .populate("skill")
      .sort({ createdAt: -1 })
      .lean();

    for (const app of applications) {
      for (const doc of app.documents) {
        if (doc.gcsPath) {
          doc.signedUrl = await generateSignedUrl(doc.gcsPath);
        } else {
          doc.signedUrl = doc.gcsUrl;
        }
      }
    }

    res.render("skills/mySkillApplications", {
      title: "My Skill Applications",
      applications,
      user: req.user,
    });
  } catch (err) {
    console.error("Error loading skill applications:", err);
    req.flash("error_msg", "Failed to load your skill applications.");
    res.redirect("/dashboard/student");
  }
};
exports.viewSkillAcceptanceLetter = async (req, res) => {
  try {
    const app = await SkillApplication.findById(req.params.id).populate(
      "applicant"
    );

    if (!app || !app.acceptanceLetter?.gcsPath) {
      req.flash("error_msg", "Acceptance letter not found.");
      return res.redirect("back");
    }

    const user = req.user;
    const isApplicant = user._id.toString() === app.applicant._id.toString();
    const isStaff = ["Admin", "Registrar", "AdmissionsOfficer"].includes(
      user.role
    );

    if (!isApplicant && !isStaff) {
      req.flash("error_msg", "Unauthorized.");
      return res.redirect("back");
    }

    const signedUrl = await generateSignedUrl(app.acceptanceLetter.gcsPath);
    return res.redirect(signedUrl);
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to load acceptance letter.");
    return res.redirect("back");
  }
};
