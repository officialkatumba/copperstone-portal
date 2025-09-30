// controllers/applicationController.js
const Programme = require("../models/Programme");
const Application = require("../models/Application");
const { uploadToGCS } = require("../config/gcsUpload");

/**
 * Render the application form
 */
exports.showApplicationForm = async (req, res) => {
  try {
    const programmes = await Programme.find().sort({ name: 1 });
    res.render("programmes/apply", {
      title: "Apply for a Program",
      programmes,
      user: req.user,
    });
  } catch (err) {
    console.error("Error loading application form:", err);
    req.flash("error_msg", "Failed to load application form.");
    res.redirect("/dashboard/student");
  }
};

/**
 * Handle application submission
//  */

exports.submitApplication = async (req, res) => {
  try {
    const { firstChoice, secondChoice } = req.body;
    const applicationYear = new Date().getFullYear();

    const programme = await Programme.findById(firstChoice);
    if (!programme) {
      req.flash("error_msg", "Invalid programme selected");
      return res.redirect("back");
    }

    const programmeCode = programme.code;

    // ✅ Upload supporting documents
    const gcsDocs = [];
    for (const file of req.files) {
      const uploaded = await uploadToGCS(
        file,
        req.user,
        programmeCode,
        applicationYear
      );

      gcsDocs.push({
        name: file.originalname,
        gcsUrl: uploaded.publicUrl, // fallback
        gcsPath: uploaded.path, // secure internal path
      });
    }

    await Application.create({
      applicant: req.user._id,
      firstChoice,
      secondChoice: secondChoice || null,
      documents: gcsDocs,
    });

    req.flash("success_msg", "Application submitted successfully!");
    res.redirect("/dashboard/student");
  } catch (err) {
    console.error("Application Error:", err);
    req.flash("error_msg", "Failed to submit application.");
    res.redirect("back");
  }
};
// view my aplplications

const { generateSignedUrl } = require("../config/gcsUpload");

exports.getMyApplications = async (req, res) => {
  try {
    let applications = await Application.find({ applicant: req.user._id })
      .populate("firstChoice")
      .populate("secondChoice")
      .sort({ createdAt: -1 })
      .lean();

    for (const app of applications) {
      for (const doc of app.documents) {
        if (doc.gcsPath) {
          // ✅ New secure way
          doc.signedUrl = await generateSignedUrl(doc.gcsPath);
        } else if (doc.gcsUrl) {
          // fallback for old records
          doc.signedUrl = doc.gcsUrl;
        }
      }
    }

    res.render("applications/myApplications", {
      title: "My Applications",
      applications,
      user: req.user,
    });
  } catch (err) {
    console.error("Error loading applications:", err);
    req.flash("error_msg", "Failed to load your applications.");
    res.redirect("/dashboard/student");
  }
};
