// backend/controllers/admissionsController.js
const Application = require("../models/Application");
const User = require("../models/User");
const { generateAcceptancePDF } = require("../utils/pdfGenerator");
const { uploadFile, getSignedUrl } = require("../utils/gcs");
const { sendEmail } = require("../utils/mailer");
const fs = require("fs");
const path = require("path");
const { generateSignedUrl } = require("../config/gcsUpload");

exports.showAdmissionsDashboard = (req, res) => {
  res.render("dashboard/admissions", {
    title: "Admissions Dashboard",
    user: req.user,
  });
};

// // Also update listApplications function similarly:
// exports.listApplications = async (req, res) => {
//   try {
//     const applications = await Application.find()
//       .populate("applicant", "firstName surname email mobile")
//       .populate("firstChoice", "name code level")
//       .populate("secondChoice", "name code level")
//       .populate("payment", "amount method status reference") // ADD THIS LINE
//       .sort({ createdAt: -1 });

//     // 🔧 FIX: Ensure each application has a valid applicant object
//     applications.forEach((app) => {
//       if (!app.applicant) {
//         app.applicant = {
//           firstName: "Unknown",
//           surname: "Applicant",
//           email: "email@not.found",
//           mobile: "N/A",
//         };
//       }
//     });

//     res.render("admissions/applications", {
//       title: "All Applications",
//       applications,
//       user: req.user,
//     });
//   } catch (err) {
//     console.error("Error fetching applications:", err);
//     req.flash("error_msg", "Failed to load applications.");
//     res.redirect("/dashboard/admissions");
//   }
// };

// LIST ALL APPLICATIONS (ADMISSIONS)
// exports.listApplications = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20; // START AT 20
//     const search = (req.query.search || "").trim();
//     const applicationStatus = (req.query.applicationStatus || "").trim();
//     const paymentStatus = (req.query.paymentStatus || "").trim();

//     const skip = (page - 1) * limit;

//     // ============================
//     // BUILD QUERY
//     // ============================
//     const query = {};

//     // APPLICATION STATUS FILTER
//     if (applicationStatus) {
//       query.status = applicationStatus;
//     }

//     // PAYMENT STATUS FILTER
//     if (paymentStatus) {
//       query["payment.status"] = paymentStatus;
//     }

//     // APPLICANT SEARCH (name OR email)
//     if (search) {
//       const applicants = await User.find({
//         role: "Student",
//         $or: [
//           { firstName: new RegExp(search, "i") },
//           { surname: new RegExp(search, "i") },
//           { email: new RegExp(search, "i") },
//         ],
//       }).select("_id");

//       query.applicant = { $in: applicants.map((a) => a._id) };
//     }

//     // ============================
//     // APPLICATIONS
//     // ============================
//     const applications = await Application.find(query)
//       .populate("applicant", "firstName surname email mobile")
//       .populate("firstChoice", "name code level")
//       .populate("secondChoice", "name code level")
//       .populate("payment", "amount method status reference createdAt")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     // 🔧 FIX: Ensure each application has a valid applicant object
//     applications.forEach((app) => {
//       if (!app.applicant) {
//         app.applicant = {
//           firstName: "Unknown",
//           surname: "Applicant",
//           email: "email@not.found",
//           mobile: "N/A",
//         };
//       }
//     });

//     const totalCount = await Application.countDocuments(query);
//     const totalPages = Math.ceil(totalCount / limit);

//     res.render("admissions/applications", {
//       title: "All Applications",
//       applications,

//       // filters
//       search,
//       applicationStatus,
//       paymentStatus,

//       // pagination
//       currentPage: page,
//       totalPages,
//       totalCount,
//       limit,

//       user: req.user,
//     });
//   } catch (err) {
//     console.error("Error fetching applications:", err);
//     req.flash("error_msg", "Failed to load applications.");
//     res.redirect("/dashboard/admissions");
//   }
// };

// LIST ALL APPLICATIONS (ADMISSIONS)
exports.listApplications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = (req.query.search || "").trim();
    const applicationStatus = (req.query.applicationStatus || "").trim();
    const paymentStatus = (req.query.paymentStatus || "").trim();

    const skip = (page - 1) * limit;

    // ============================
    // BUILD QUERY
    // ============================
    const query = {};

    // APPLICATION STATUS FILTER
    if (applicationStatus) {
      query.status = applicationStatus;
    }

    // APPLICANT SEARCH (name OR email)
    if (search) {
      const applicants = await User.find({
        $or: [
          { firstName: new RegExp(search, "i") },
          { surname: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
        ],
      }).select("_id");

      query.applicant = { $in: applicants.map((a) => a._id) };
    }

    // ============================
    // FETCH APPLICATIONS WITH PAYMENTS
    // ============================
    // Get applications first
    let applications = await Application.find(query)
      .populate("applicant", "firstName surname email mobile")
      .populate("firstChoice", "name code level")
      .populate("payment", "status amount method reference") // Populate payment details
      .sort({ createdAt: -1 });

    // ============================
    // FILTER BY PAYMENT STATUS (after populating)
    // ============================
    if (paymentStatus) {
      if (paymentStatus === "hasPayment") {
        // Applications that have a payment reference
        applications = applications.filter(
          (app) => app.payment && app.payment._id,
        );
      } else if (paymentStatus === "noPayment") {
        // Applications without payment
        applications = applications.filter(
          (app) => !app.payment || !app.payment._id,
        );
      } else {
        // Applications with specific payment status
        applications = applications.filter(
          (app) => app.payment && app.payment.status === paymentStatus,
        );
      }
    }

    // ============================
    // PAGINATION SLICE
    // ============================
    const totalCount = applications.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Get the slice for current page
    const paginatedApplications = applications.slice(skip, skip + limit);

    // 🔧 FIX: Ensure each application has a valid applicant object
    paginatedApplications.forEach((app) => {
      if (!app.applicant) {
        app.applicant = {
          firstName: "Unknown",
          surname: "Applicant",
          email: "email@not.found",
          mobile: "N/A",
        };
      }
    });

    res.render("admissions/applications", {
      title: "All Applications",
      applications: paginatedApplications,

      // filters
      search,
      applicationStatus,
      paymentStatus,

      // pagination
      currentPage: page,
      totalPages,
      totalCount,
      limit,

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
      .populate("secondChoice")
      .populate("payment") // ADD THIS LINE - populate the payment reference
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

    // 🔐 Generate signed URL for acceptance letter
    if (app.acceptanceLetter && app.acceptanceLetter.gcsPath) {
      try {
        app.acceptanceLetter.signedUrl = await generateSignedUrl(
          app.acceptanceLetter.gcsPath,
        );
        console.log("✅ Acceptance letter signed URL generated");
      } catch (error) {
        console.error("❌ Error generating acceptance letter URL:", error);
        app.acceptanceLetter.signedUrl = app.acceptanceLetter.gcsUrl;
      }
    }

    // Debug logging
    console.log("DEBUG - Application details:", {
      applicationId: app._id,
      status: app.status,
      hasPayment: !!app.payment,
      paymentStatus: app.payment?.status,
      documentsCount: app.documents.length,
      hasAcceptanceLetter: !!app.acceptanceLetter,
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
        "Applicant has no valid email address. Cannot send notification.",
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

      // ✅ FIXED: Update user record with approved programme AND set main programme field
      await User.findByIdAndUpdate(applicant._id, {
        $push: {
          approvedCourses: {
            programme: chosenProgramme._id,
            approvalDate: new Date(),
            startDate: startDate || null,
          },
        },
        // ✅ ADDED THESE TWO LINES TO SET THE MAIN PROGRAMME FIELD:
        programme: chosenProgramme._id, // Set the main programme field
        level: chosenProgramme.level || "Certificate", // Set the level based on programme
      });

      // 1️⃣ Generate PDF
      const pdfPath = await generateAcceptancePDF(
        app,
        chosenProgramme,
        startDate,
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
        app.acceptanceLetter,
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
            startDate,
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
      `Application ${status.toLowerCase()} successfully. Email sent to ${recipientEmail}.`,
    );
    res.redirect("/admissions/applications");
  } catch (err) {
    console.error("❌ Error updating application status:", err);
    req.flash("error_msg", "Failed to update application.");
    res.redirect("/admissions/applications");
  }
};

// View acceptance letter - LINE 273

exports.viewAcceptanceLetter = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);

    if (!app) {
      req.flash("error_msg", "Application not found.");
      return res.redirect("/dashboard/student");
    }

    // Check if acceptance letter exists - USE gcsPath NOT gcsName
    if (!app.acceptanceLetter || !app.acceptanceLetter.gcsPath) {
      req.flash("error_msg", "Acceptance letter not available yet.");
      return res.redirect("/dashboard/student");
    }

    // Generate signed URL for the acceptance letter - USE gcsPath NOT gcsName
    const signedUrl = await getSignedUrl(app.acceptanceLetter.gcsPath, 1); // 1 hour expiry

    // Redirect to the signed URL
    res.redirect(signedUrl);
  } catch (err) {
    console.error("Error fetching acceptance letter:", err);
    req.flash("error_msg", "Failed to load acceptance letter.");
    res.redirect("/dashboard/student");
  }
};

// Delete single application (Admissions Officer)
// exports.deleteApplication = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Check if user has permission (Admissions Officer or Admin)
//     if (!["AdmissionsOfficer", "Admin"].includes(req.user.role)) {
//       req.flash("error_msg", "Unauthorized access.");
//       return res.redirect("/admissions/applications");
//     }

//     const application = await Application.findById(id).populate(
//       "applicant",
//       "firstName surname email",
//     );

//     if (!application) {
//       req.flash("error_msg", "Application not found.");
//       return res.redirect("/admissions/applications");
//     }

//     // Don't allow deletion of approved applications
//     if (application.status === "Approved") {
//       req.flash("error_msg", "Cannot delete an approved application.");
//       return res.redirect(`/admissions/applications/${id}`);
//     }

//     // Store applicant info for flash message
//     const applicantName = application.applicant
//       ? `${application.applicant.firstName} ${application.applicant.surname}`
//       : "Unknown Applicant";

//     // Delete the application
//     await Application.findByIdAndDelete(id);

//     // Log the deletion
//     console.log(`Application deleted by ${req.user.email}:`, {
//       applicationId: id,
//       applicant: applicantName,
//       programme: application.firstChoice,
//       status: application.status,
//       deletedAt: new Date(),
//     });

//     req.flash(
//       "success_msg",
//       `Application for ${applicantName} deleted successfully.`,
//     );
//     res.redirect("/admissions/applications");
//   } catch (err) {
//     console.error("Error deleting application:", err);
//     req.flash("error_msg", "Failed to delete application.");
//     res.redirect("/admissions/applications");
//   }
// };

// Update the existing deleteApplication function in admissionsController.js
// backend/controllers/admissionsController.js
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the application first
    const application = await Application.findById(id);

    if (!application) {
      req.flash("error_msg", "Application not found.");
      return res.redirect("/admissions/applications");
    }

    // Simple check - don't delete approved applications
    if (application.status === "Approved") {
      req.flash("error_msg", "Cannot delete an approved application.");
      return res.redirect(`/admissions/applications/${id}`);
    }

    // Get applicant name for flash message
    const applicant = await User.findById(application.applicant).select(
      "firstName surname",
    );
    const applicantName = applicant
      ? `${applicant.firstName} ${applicant.surname}`
      : "Unknown";

    // Delete the application (simple - no fancy cleanup)
    await Application.findByIdAndDelete(id);

    // Flash success message
    req.flash(
      "success_msg",
      `Application for ${applicantName} has been deleted.`,
    );

    // Redirect to applications list
    res.redirect("/admissions/applications");
  } catch (err) {
    console.error("Error deleting application:", err);
    req.flash("error_msg", "Failed to delete application.");
    res.redirect("/admissions/applications");
  }
};

// Delete all duplicate applications except most recent for a specific applicant
exports.deleteDuplicateApplications = async (req, res) => {
  try {
    const { applicantId } = req.params;

    // Check if user has permission
    if (!["AdmissionsOfficer", "Admin"].includes(req.user.role)) {
      req.flash("error_msg", "Unauthorized access.");
      return res.redirect("/admissions/applications");
    }

    // Get all applications for this applicant, sorted by date (most recent first)
    const applications = await Application.find({ applicant: applicantId })
      .populate("applicant", "firstName surname email")
      .populate("firstChoice", "name code")
      .sort({ submittedAt: -1 });

    if (applications.length <= 1) {
      req.flash("info_msg", "Applicant has only one application.");
      return res.redirect("/admissions/applications");
    }

    // Determine which application to keep (most recent OR approved if exists)
    let keepApplication =
      applications.find((app) => app.status === "Approved") || applications[0];

    // Get IDs to delete
    const deleteIds = applications
      .filter((app) => app._id.toString() !== keepApplication._id.toString())
      .map((app) => app._id);

    // Delete duplicate applications
    await Application.deleteMany({ _id: { $in: deleteIds } });

    // Log the bulk deletion
    console.log(`Bulk delete by ${req.user.email}:`, {
      applicantId,
      applicantName: applications[0].applicant
        ? `${applications[0].applicant.firstName} ${applications[0].applicant.surname}`
        : "Unknown",
      applicationsDeleted: deleteIds.length,
      keptApplication: keepApplication._id,
      deletedAt: new Date(),
    });

    req.flash(
      "success_msg",
      `Deleted ${deleteIds.length} duplicate application(s). Kept the most recent application.`,
    );
    res.redirect("/admissions/applications");
  } catch (err) {
    console.error("Error deleting duplicate applications:", err);
    req.flash("error_msg", "Failed to delete duplicate applications.");
    res.redirect("/admissions/applications");
  }
};

// Find all applicants with multiple applications
exports.findDuplicateApplicants = async (req, res) => {
  try {
    // Check if user has permission
    if (!["AdmissionsOfficer", "Admin"].includes(req.user.role)) {
      req.flash("error_msg", "Unauthorized access.");
      return res.redirect("/admissions/applications");
    }

    // Aggregate to find applicants with multiple applications
    const duplicates = await Application.aggregate([
      {
        $group: {
          _id: "$applicant",
          count: { $sum: 1 },
          applications: {
            $push: {
              id: "$_id",
              status: "$status",
              submittedAt: "$submittedAt",
              firstChoice: "$firstChoice",
            },
          },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    // Populate applicant details
    const populatedDuplicates = await Promise.all(
      duplicates.map(async (dup) => {
        const applicant = await User.findById(dup._id).select(
          "firstName surname email mobile",
        );

        const applications = await Promise.all(
          dup.applications.map(async (app) => {
            const programme = await Programme.findById(app.firstChoice).select(
              "name code",
            );
            return {
              ...app,
              programme,
            };
          }),
        );

        return {
          applicant: applicant || {
            firstName: "Unknown",
            surname: "Applicant",
          },
          count: dup.count,
          applications,
        };
      }),
    );

    res.render("admissions/duplicates", {
      title: "Duplicate Applications",
      duplicates: populatedDuplicates,
      user: req.user,
    });
  } catch (err) {
    console.error("Error finding duplicate applicants:", err);
    req.flash("error_msg", "Failed to find duplicate applications.");
    res.redirect("/admissions/applications");
  }
};
