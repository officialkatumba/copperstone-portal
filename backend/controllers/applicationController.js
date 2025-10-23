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

// exports.submitApplication = async (req, res) => {
//   try {
//     const { firstChoice, secondChoice } = req.body;
//     const applicationYear = new Date().getFullYear();

//     const programme = await Programme.findById(firstChoice);
//     if (!programme) {
//       req.flash("error_msg", "Invalid programme selected");
//       return res.redirect("back");
//     }

//     const programmeCode = programme.code;

//     // ✅ Upload supporting documents
//     const gcsDocs = [];
//     for (const file of req.files) {
//       const uploaded = await uploadToGCS(
//         file,
//         req.user,
//         programmeCode,
//         applicationYear
//       );

//       gcsDocs.push({
//         name: file.originalname,
//         gcsUrl: uploaded.publicUrl, // fallback
//         gcsPath: uploaded.path, // secure internal path
//       });
//     }

//     await Application.create({
//       applicant: req.user._id,
//       firstChoice,
//       secondChoice: secondChoice || null,
//       documents: gcsDocs,
//     });

//     req.flash("success_msg", "Application submitted successfully!");
//     res.redirect("/dashboard/student");
//   } catch (err) {
//     console.error("Application Error:", err);
//     req.flash("error_msg", "Failed to submit application.");
//     res.redirect("back");
//   }
// };

exports.submitApplication = async (req, res) => {
  try {
    const { firstChoice, secondChoice, paymentMethod, paymentAmount } =
      req.body;
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
        gcsUrl: uploaded.publicUrl,
        gcsPath: uploaded.path,
      });
    }

    await Application.create({
      applicant: req.user._id,
      firstChoice,
      secondChoice: secondChoice || null,
      documents: gcsDocs,
      payment: {
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        status: "Pending",
      },
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

// In applicationController.js - add this function
// const Application = require("../models/Application");
// const { generateSignedUrl } = require("../config/gcsUpload");

exports.viewAcceptanceLetter = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id).populate("applicant");

    // FIX: Use gcsPath instead of gcsName to match the schema
    if (!app || !app.acceptanceLetter?.gcsPath) {
      req.flash("error_msg", "Acceptance letter not found.");
      return res.redirect("back");
    }

    // Security: allow only admissions staff or the applicant to access
    const user = req.user;
    const isApplicant = user._id.toString() === app.applicant._id.toString();
    const isAdmissionStaff = [
      "AdmissionsOfficer",
      "Admin",
      "Registrar",
      "VC",
    ].includes(user.role);

    if (!isApplicant && !isAdmissionStaff) {
      req.flash("error_msg", "Unauthorized.");
      return res.redirect("back");
    }

    // FIX: Use the same generateSignedUrl function that works for documents
    const signedUrl = await generateSignedUrl(app.acceptanceLetter.gcsPath); // Use same function as documents
    return res.redirect(signedUrl);
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to get letter.");
    return res.redirect("back");
  }
};
