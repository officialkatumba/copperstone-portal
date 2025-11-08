// backend/controllers/admissionsController.js
const Application = require("../models/Application");
const User = require("../models/User");
const { generateAcceptancePDF } = require("../utils/pdfGenerator");
const { uploadFile, getSignedUrl } = require("../utils/gcs");
const { sendEmail } = require("../utils/mailer");
const fs = require("fs");
const path = require("path");

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

// List all applications (alias for viewAllApplications)
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

// // View application detail

// View application detail
const { generateSignedUrl } = require("../config/gcsUpload");

// View application detail
// const { generateSignedUrl } = require("../config/gcsUpload");

exports.viewApplicationDetail = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id)
      .populate("applicant")
      .populate("firstChoice")
      .populate("secondChoice")
      .lean();

    if (!app) {
      req.flash("error_msg", "Application not found.");
      return res.redirect("/admissions/applications");
    }

    // 🔐 Generate signed URLs for each document (WORKING LOGIC)
    for (const doc of app.documents) {
      if (doc.gcsPath) {
        doc.signedUrl = await generateSignedUrl(doc.gcsPath);
      } else if (doc.gcsUrl) {
        doc.signedUrl = doc.gcsUrl;
      }
    }

    // 🔐 Generate signed URL for acceptance letter USING EXACT SAME LOGIC AS DOCUMENTS
    if (app.acceptanceLetter && app.acceptanceLetter.gcsPath) {
      try {
        // Use the EXACT same function and logic as documents
        app.acceptanceLetter.signedUrl = await generateSignedUrl(
          app.acceptanceLetter.gcsPath
        );
        console.log(
          "✅ Acceptance letter signed URL generated using document logic"
        );
      } catch (error) {
        console.error("❌ Error generating acceptance letter URL:", error);
        // Fallback to public URL if signed URL fails, same as documents
        app.acceptanceLetter.signedUrl = app.acceptanceLetter.gcsUrl;
      }
    }

    // Debug logging to see what we have
    console.log("DEBUG - Application details:", {
      applicationId: app._id,
      status: app.status,
      documentsCount: app.documents.length,
      hasAcceptanceLetter: !!app.acceptanceLetter,
      acceptanceLetter: app.acceptanceLetter
        ? {
            name: app.acceptanceLetter.name,
            gcsPath: app.acceptanceLetter.gcsPath,
            hasSignedUrl: !!app.acceptanceLetter.signedUrl,
          }
        : null,
    });

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

// // Update application status (approve/reject)

// Update application status (approve/reject)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, remarks, selectedChoice, startDate } = req.body;

    const app = await Application.findById(req.params.id)
      .populate("applicant", "firstName surname email mobile")
      .populate("firstChoice")
      .populate("secondChoice");

    if (!app) {
      req.flash("error_msg", "Application not found.");
      return res.redirect("/admissions/applications");
    }

    // ✅ Enhanced email validation
    let recipientEmail = app.applicant?.email || app.applicantEmail;

    // If still no email, try to get it from the User model directly
    if (!recipientEmail && app.applicant) {
      const user = await User.findById(app.applicant._id).select("email");
      recipientEmail = user?.email;
    }

    // Final validation - if no email, fail early
    if (!recipientEmail) {
      console.error(`❌ No valid email found for application ${app._id}`);
      req.flash(
        "error_msg",
        "Applicant has no valid email address. Cannot send notification."
      );
      return res.redirect("/admissions/applications");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      console.error(`❌ Invalid email format: ${recipientEmail}`);
      req.flash("error_msg", "Applicant email address is invalid.");
      return res.redirect("/admissions/applications");
    }

    console.log(`📧 Sending email to: ${recipientEmail}`);

    // ✅ Sync applicant email for consistency
    if (app.applicant && app.applicant.email) {
      app.applicantEmail = app.applicant.email;
    }

    app.status = status;
    app.remarks = remarks || "";
    app.reviewedAt = new Date();

    const applicant = app.applicant;

    if (status === "Approved") {
      const chosenProgramme =
        selectedChoice === "second" ? app.secondChoice : app.firstChoice;

      if (!chosenProgramme) {
        req.flash("error_msg", "No programme selected for approval.");
        return res.redirect("/admissions/applications");
      }

      // Update user record with approved programme
      await User.findByIdAndUpdate(applicant._id, {
        $push: {
          approvedCourses: {
            programme: chosenProgramme._id,
            approvalDate: new Date(),
            startDate: startDate || null,
          },
        },
      });

      // 1️⃣ Generate PDF
      const pdfPath = await generateAcceptancePDF(
        app,
        chosenProgramme,
        startDate
      );

      // 2️⃣ Upload PDF to GCS
      const destPath = `applications/Acceptance_${app._id}_${Date.now()}.pdf`;
      await uploadFile(pdfPath, destPath);

      // ✅ SAVE ACCEPTANCE LETTER USING THE SCHEMA STRUCTURE
      app.acceptanceLetter = {
        name: "Official Acceptance Letter",
        gcsUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${destPath}`,
        gcsPath: destPath,
        uploadedAt: new Date(),
      };

      await app.save();

      console.log(
        "✅ Acceptance letter saved to database:",
        app.acceptanceLetter
      );

      // 3️⃣ Generate signed URL using the same function as documents
      const signedUrl = await generateSignedUrl(destPath);

      // 4️⃣ Send email
      await sendEmail({
        to: recipientEmail,
        subject: "🎓 Admission Offer - Copperstone University",
        html: `
          <p>Dear ${applicant.firstName || "Applicant"},</p>
          <p>Congratulations! Your application to <strong>${
            chosenProgramme.name
          }</strong> has been <strong>approved</strong>.</p>
          <p>Your programme is scheduled to start on <strong>${new Date(
            startDate
          ).toLocaleDateString()}</strong>.</p>
          <p>You can download your official acceptance letter here: <a href="${signedUrl}">Download acceptance letter</a></p>
          <br/>
          <p>Warm regards,<br/>Copperstone University Admissions Office</p>
        `,
        attachments: [{ filename: "Acceptance_Letter.pdf", path: pdfPath }],
      });

      // Clean up local temp file
      try {
        fs.unlinkSync(pdfPath);
      } catch (e) {
        console.warn("⚠️ Failed to remove temporary PDF:", e.message);
      }
    } else if (status === "Rejected") {
      await sendEmail({
        to: recipientEmail,
        subject: "🎓 Application Update - Copperstone University",
        html: `
          <p>Dear ${applicant.firstName || "Applicant"},</p>
          <p>We regret to inform you that your application was not successful at this time.</p>
          <p><strong>Remarks:</strong> ${
            remarks || "We encourage you to apply again next intake."
          }</p>
          <p>Sincerely,<br/>Admissions Office</p>
        `,
      });

      await app.save();
    }

    req.flash(
      "success_msg",
      `Application ${status.toLowerCase()} successfully. Email sent to ${recipientEmail}.`
    );
    res.redirect("/admissions/applications");
  } catch (err) {
    console.error("❌ Error updating application status:", err);
    req.flash("error_msg", "Failed to update application.");
    res.redirect("/admissions/applications");
  }
};

// Add this to your admissionsController.js or create a new controller

// View acceptance letter
exports.viewAcceptanceLetter = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);

    if (!app) {
      req.flash("error_msg", "Application not found.");
      return res.redirect("/dashboard/student");
    }

    // Check if acceptance letter exists
    if (!app.acceptanceLetter || !app.acceptanceLetter.gcsName) {
      req.flash("error_msg", "Acceptance letter not available yet.");
      return res.redirect("/dashboard/student");
    }

    // Generate signed URL for the acceptance letter
    const signedUrl = await getSignedUrl(app.acceptanceLetter.gcsName, 1); // 1 hour expiry

    // Redirect to the signed URL
    res.redirect(signedUrl);
  } catch (err) {
    console.error("Error fetching acceptance letter:", err);
    req.flash("error_msg", "Failed to load acceptance letter.");
    res.redirect("/dashboard/student");
  }
};
