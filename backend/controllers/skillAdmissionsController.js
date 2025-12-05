// // // backend/controllers/skillAdmissionsController.js
// // const SkillApplication = require("../models/SkillApplication");
// // const Skill = require("../models/Skill");
// // const User = require("../models/User");
// // const { generateAcceptancePDF } = require("../utils/pdfGenerator"); // reuse same PDF generator
// // const { uploadFile, getSignedUrl } = require("../utils/gcs");
// // const { sendEmail } = require("../utils/mailer");
// // const fs = require("fs");
// // const path = require("path");
// // const {
// //   generateSignedUrl: generateSignedUrlConfig,
// // } = require("../config/gcsUpload"); // fallback signed URL util

// // // List all skill applications for admissions
// // exports.listSkillApplications = async (req, res) => {
// //   try {
// //     const applications = await SkillApplication.find()
// //       .populate("applicant", "firstName surname email mobile")
// //       .populate("skill", "name code duration")
// //       .sort({ createdAt: -1 })
// //       .lean();

// //     // prepare signed urls for documents (lazy: views will use them too but we can precompute)
// //     for (const app of applications) {
// //       for (const doc of app.documents || []) {
// //         if (doc.gcsPath) {
// //           doc.signedUrl = await generateSignedUrlConfig(doc.gcsPath);
// //         } else {
// //           doc.signedUrl = doc.gcsUrl;
// //         }
// //       }
// //     }

// //     res.render("admissions/skills/applications", {
// //       title: "Admissions - Skill Applications",
// //       applications,
// //       user: req.user,
// //     });
// //   } catch (err) {
// //     console.error("Skill admissions list error:", err);
// //     req.flash("error_msg", "Could not load skill applications.");
// //     res.redirect("/admissions/dashboard");
// //   }
// // };

// // // View single skill application detail
// // exports.viewSkillApplicationDetail = async (req, res) => {
// //   try {
// //     const app = await SkillApplication.findById(req.params.id)
// //       .populate("applicant")
// //       .populate("skill")
// //       .lean();

// //     if (!app) {
// //       req.flash("error_msg", "Skill application not found.");
// //       return res.redirect("/admissions/skills/applications");
// //     }

// //     // generate signed urls for documents
// //     for (const doc of app.documents || []) {
// //       if (doc.gcsPath)
// //         doc.signedUrl = await generateSignedUrlConfig(doc.gcsPath);
// //       else doc.signedUrl = doc.gcsUrl;
// //     }

// //     // acceptance letter signed URL (if present)
// //     if (app.acceptanceLetter && app.acceptanceLetter.gcsPath) {
// //       try {
// //         app.acceptanceLetter.signedUrl = await generateSignedUrlConfig(
// //           app.acceptanceLetter.gcsPath
// //         );
// //       } catch (e) {
// //         app.acceptanceLetter.signedUrl = app.acceptanceLetter.gcsUrl;
// //       }
// //     }

// //     res.render("admissions/skills/applicationDetail", {
// //       title: "Skill Application Detail",
// //       application: app,
// //       user: req.user,
// //     });
// //   } catch (err) {
// //     console.error("Skill admissions detail error:", err);
// //     req.flash("error_msg", "Failed to load skill application detail.");
// //     res.redirect("/admissions/skills/applications");
// //   }
// // };

// // // Approve / Reject application (and generate acceptance letter on approve)
// // exports.updateSkillApplicationStatus = async (req, res) => {
// //   try {
// //     const { status, remarks, startDate } = req.body; // status: Approved / Rejected / Under Review
// //     const app = await SkillApplication.findById(req.params.id)
// //       .populate("applicant")
// //       .populate("skill");

// //     if (!app) {
// //       req.flash("error_msg", "Skill application not found.");
// //       return res.redirect("/admissions/skills/applications");
// //     }

// //     // Find reliable recipient email
// //     let recipientEmail = app.applicant?.email || app.applicantEmail;
// //     if (!recipientEmail && app.applicant) {
// //       const u = await User.findById(app.applicant._id).select("email");
// //       recipientEmail = u?.email;
// //     }

// //     if (!recipientEmail) {
// //       req.flash(
// //         "error_msg",
// //         "Applicant has no valid email address. Cannot send notification."
// //       );
// //       return res.redirect(`/admissions/skills/applications/${app._id}`);
// //     }

// //     // basic email validation
// //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// //     if (!emailRegex.test(recipientEmail)) {
// //       req.flash("error_msg", "Applicant email address is invalid.");
// //       return res.redirect(`/admissions/skills/applications/${app._id}`);
// //     }

// //     // update status & remarks
// //     app.status = status;
// //     app.remarks = remarks || "";
// //     app.reviewedAt = new Date();

// //     // If approved -> generate acceptance PDF, upload, attach, update user record
// //     if (status === "Approved") {
// //       // 1) Save approval to user's skillsApproved array
// //       if (app.applicant) {
// //         await User.findByIdAndUpdate(app.applicant._id, {
// //           $push: {
// //             skillsApproved: {
// //               skill: app.skill._id,
// //               approvalDate: new Date(),
// //               startDate: startDate || null,
// //             },
// //           },
// //         });
// //       }

// //       // 2) Generate acceptance PDF using existing helper (reuses same function)
// //       // Note: generateAcceptancePDF(app, chosenProgrammeOrSkill, startDate)
// //       const pdfPath = await generateAcceptancePDF(app, app.skill, startDate);

// //       // 3) Upload PDF to GCS
// //       const destPath = `applications/skills/Acceptance_${
// //         app._id
// //       }_${Date.now()}.pdf`;
// //       await uploadFile(pdfPath, destPath);

// //       // 4) Save acceptanceLetter object in SkillApplication
// //       app.acceptanceLetter = {
// //         name: "Official Skill Acceptance Letter",
// //         gcsUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${destPath}`,
// //         gcsPath: destPath,
// //         uploadedAt: new Date(),
// //       };

// //       await app.save();

// //       // 5) Generate signed URL & send email with signed URL + attach pdf
// //       let signedUrl;
// //       try {
// //         signedUrl = await getSignedUrl(destPath, 60 * 24 * 30); // e.g., 30 days (utility supports minutes/hours depending on impl)
// //       } catch (err) {
// //         // fallback to generateSignedUrl from config if utils/gcs doesn't have getSignedUrl
// //         signedUrl = await generateSignedUrlConfig(destPath);
// //       }

// //       // Send email
// //       await sendEmail({
// //         to: recipientEmail,
// //         subject: "🎓 Skill Training Admission Offer",
// //         html: `
// //             <p>Dear ${app.applicant.firstName || "Applicant"},</p>
// //             <p>Congratulations! Your application for <strong>${
// //               app.skill.name
// //             }</strong> has been <strong>approved</strong>.</p>
// //             ${
// //               startDate
// //                 ? `<p>Training Start Date: <strong>${new Date(
// //                     startDate
// //                   ).toLocaleDateString()}</strong></p>`
// //                 : ""
// //             }
// //             <p>You can download your official acceptance letter here: <a href="${signedUrl}">Download acceptance letter</a></p>
// //             <br/>
// //             <p>Kind regards,<br/>Admissions Office</p>
// //         `,
// //         attachments: [{ filename: "Acceptance_Letter.pdf", path: pdfPath }],
// //       });

// //       // cleanup temp PDF
// //       try {
// //         fs.unlinkSync(pdfPath);
// //       } catch (e) {
// //         console.warn("Failed to delete temp pdf:", e.message);
// //       }
// //     } else if (status === "Rejected") {
// //       // If rejected, save and email rejection notification
// //       await sendEmail({
// //         to: recipientEmail,
// //         subject: "Skill Application Update - Copperstone University",
// //         html: `
// //             <p>Dear ${app.applicant.firstName || "Applicant"},</p>
// //             <p>We regret to inform you that your application for <strong>${
// //               app.skill.name
// //             }</strong> was not successful at this time.</p>
// //             <p><strong>Remarks:</strong> ${
// //               remarks || "No remarks provided."
// //             }</p>
// //             <p>Sincerely,<br/>Admissions Office</p>
// //         `,
// //       });

// //       await app.save();
// //     } else {
// //       // Under Review or other statuses
// //       await app.save();
// //     }

// //     req.flash(
// //       "success_msg",
// //       `Application ${status.toLowerCase()} successfully. Email sent to ${recipientEmail}.`
// //     );
// //     res.redirect("/admissions/skills/applications");
// //   } catch (err) {
// //     console.error("Error updating skill application status:", err);
// //     req.flash("error_msg", "Failed to update skill application.");
// //     res.redirect("/admissions/skills/applications");
// //   }
// // };

// // // View acceptance letter (redirect to signed URL)
// // // exports.viewSkillAcceptanceLetter = async (req, res) => {
// // //   try {
// // //     const app = await SkillApplication.findById(req.params.id).populate(
// // //       "applicant"
// // //     );
// // //     if (!app) {
// // //       req.flash("error_msg", "Skill application not found.");
// // //       return res.redirect("/dashboard/student");
// // //     }

// // //     if (!app.acceptanceLetter || !app.acceptanceLetter.gcsPath) {
// // //       req.flash("error_msg", "Acceptance letter not available yet.");
// // //       return res.redirect("/dashboard/student");
// // //     }

// // //     // generate signed url
// // //     let signedUrl;
// // //     try {
// // //       signedUrl = await getSignedUrl(
// // //         app.acceptanceLetter.gcsPath,
// // //         60 * 24 * 30
// // //       );
// // //     } catch (e) {
// // //       signedUrl = await generateSignedUrlConfig(app.acceptanceLetter.gcsPath);
// // //     }

// // //     return res.redirect(signedUrl);
// // //   } catch (err) {
// // //     console.error("Error fetching skill acceptance letter:", err);
// // //     req.flash("error_msg", "Failed to load acceptance letter.");
// // //     res.redirect("/dashboard/student");
// // //   }
// // // };

// // // View acceptance letter (redirect to signed URL)
// // exports.viewSkillAcceptanceLetter = async (req, res) => {
// //   try {
// //     const app = await SkillApplication.findById(req.params.id).populate(
// //       "applicant"
// //     );

// //     if (!app) {
// //       req.flash("error_msg", "Skill application not found.");
// //       return res.redirect("/dashboard/student");
// //     }

// //     if (!app.acceptanceLetter || !app.acceptanceLetter.gcsPath) {
// //       req.flash("error_msg", "Acceptance letter not available yet.");
// //       return res.redirect("/dashboard/student");
// //     }

// //     // Generate signed URL (same logic as programme documents!)
// //     let signedUrl;
// //     try {
// //       signedUrl = await getSignedUrl(
// //         app.acceptanceLetter.gcsPath,
// //         3600 * 24 * 30
// //       );
// //     } catch (e) {
// //       console.error("Signed URL (getSignedUrl) failed, trying fallback...");
// //       signedUrl = await generateSignedUrlConfig(app.acceptanceLetter.gcsPath);
// //     }

// //     return res.redirect(signedUrl);
// //   } catch (err) {
// //     console.error("Error fetching skill acceptance letter:", err);
// //     req.flash("error_msg", "Failed to load acceptance letter.");
// //     res.redirect("/dashboard/student");
// //   }
// // };

// // controllers/skillAdmissionsController.js
// const SkillApplication = require("../models/SkillApplication");
// const Skill = require("../models/Skill");
// const User = require("../models/User");

// const { generateAcceptancePDF } = require("../utils/pdfGenerator");
// const { uploadFile, getSignedUrl } = require("../utils/gcs");
// const { generateSignedUrl } = require("../config/gcsUpload");
// const { sendEmail } = require("../utils/mailer");

// const fs = require("fs");
// const path = require("path");

// // ---------------------------------------------------------------------
// // LIST ALL SKILL APPLICATIONS
// // ---------------------------------------------------------------------
// exports.listSkillApplications = async (req, res) => {
//   try {
//     const applications = await SkillApplication.find()
//       .populate("applicant", "firstName surname email mobile")
//       .populate("skill")
//       .sort({ createdAt: -1 });

//     res.render("admissions/skills/applications", {
//       title: "Skill Applications",
//       applications,
//       user: req.user,
//     });
//   } catch (err) {
//     console.error("Error loading skill applications:", err);
//     req.flash("error_msg", "Failed to load skill applications.");
//     res.redirect("/dashboard/admissions");
//   }
// };

// // ---------------------------------------------------------------------
// // VIEW SINGLE SKILL APPLICATION DETAIL
// // ---------------------------------------------------------------------
// exports.viewSkillApplicationDetail = async (req, res) => {
//   try {
//     const app = await SkillApplication.findById(req.params.id)
//       .populate("applicant")
//       .populate("skill")
//       .lean();

//     if (!app) {
//       req.flash("error_msg", "Application not found.");
//       return res.redirect("/admissions/skills/applications");
//     }

//     // 🔐 Generate signed URLs for documents
//     for (const doc of app.documents) {
//       if (doc.gcsPath) {
//         try {
//           doc.signedUrl = await generateSignedUrl(doc.gcsPath);
//         } catch (e) {
//           doc.signedUrl = doc.gcsUrl || "";
//         }
//       }
//     }

//     // 🔐 Acceptance letter signed URL
//     if (app.acceptanceLetter && app.acceptanceLetter.gcsPath) {
//       try {
//         app.acceptanceLetter.signedUrl = await generateSignedUrl(
//           app.acceptanceLetter.gcsPath
//         );
//       } catch (e) {
//         app.acceptanceLetter.signedUrl = app.acceptanceLetter.gcsUrl || "";
//       }
//     }

//     res.render("admissions/skills/applicationDetail", {
//       title: "Skill Application Detail",
//       application: app,
//       user: req.user,
//     });
//   } catch (err) {
//     console.error("Error loading skill application:", err);
//     req.flash("error_msg", "Failed to load skill application.");
//     res.redirect("/admissions/skills/applications");
//   }
// };

// // ---------------------------------------------------------------------
// // UPDATE STATUS (APPROVE / REJECT)
// // ---------------------------------------------------------------------
// exports.updateSkillApplicationStatus = async (req, res) => {
//   try {
//     const { status, remarks, startDate } = req.body;

//     const app = await SkillApplication.findById(req.params.id)
//       .populate("applicant")
//       .populate("skill");

//     if (!app) {
//       req.flash("error_msg", "Application not found.");
//       return res.redirect("/admissions/skills/applications");
//     }

//     const recipientEmail = app.applicant?.email;

//     if (!recipientEmail) {
//       req.flash("error_msg", "Applicant does not have a valid email.");
//       return res.redirect("/admissions/skills/applications");
//     }

//     // Update status
//     app.status = status;
//     app.remarks = remarks || "";
//     app.reviewedAt = new Date();

//     const applicant = app.applicant;
//     const skill = app.skill;

//     // ------------------------------------------------------------------
//     // APPROVED
//     // ------------------------------------------------------------------
//     if (status === "Approved") {
//       // 1️⃣ Generate PDF
//       const pdfPath = await generateAcceptancePDF(app, skill, startDate);

//       // 2️⃣ Upload
//       const destPath = `skill_acceptance/Acceptance_${
//         app._id
//       }_${Date.now()}.pdf`;
//       await uploadFile(pdfPath, destPath);

//       // 3️⃣ Save to DB
//       app.acceptanceLetter = {
//         name: "Skill Acceptance Letter",
//         gcsUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${destPath}`,
//         gcsPath: destPath,
//         uploadedAt: new Date(),
//       };

//       await app.save();

//       // 4️⃣ Signed URL
//       const signedUrl = await generateSignedUrl(destPath);

//       // 5️⃣ Email applicant
//       await sendEmail({
//         to: recipientEmail,
//         subject: "Copperstone University - Skill Training Acceptance",
//         html: `
//           <p>Dear ${applicant.firstName},</p>
//           <p>Your Skill Training Application for <strong>${
//             skill.name
//           }</strong> has been <strong>APPROVED</strong>.</p>
//           <p>You may download your official acceptance letter here:<br>
//           <a href="${signedUrl}" target="_blank">Download Acceptance Letter</a></p>
//           <p>Start Date: <strong>${startDate || "To be announced"}</strong></p>
//           <br>
//           <p>Regards,<br/>Admissions Office</p>
//         `,
//         attachments: [{ filename: "Skill_Acceptance.pdf", path: pdfPath }],
//       });

//       // Remove local temp file
//       try {
//         fs.unlinkSync(pdfPath);
//       } catch {}
//     }

//     // ------------------------------------------------------------------
//     // REJECTED
//     // ------------------------------------------------------------------
//     if (status === "Rejected") {
//       await sendEmail({
//         to: recipientEmail,
//         subject: "Copperstone University - Skill Application Update",
//         html: `
//           <p>Dear ${applicant.firstName},</p>
//           <p>We regret to inform you that your application for <strong>${
//             skill.name
//           }</strong> was not successful.</p>
//           <p>Remarks: ${remarks || "No remarks provided."}</p>
//           <p>Regards,<br>Admissions Office</p>
//         `,
//       });

//       await app.save();
//     }

//     req.flash("success_msg", "Application updated successfully.");
//     res.redirect("/admissions/skills/applications");
//   } catch (err) {
//     console.error("Error updating skill status:", err);
//     req.flash("error_msg", "Failed to update application.");
//     res.redirect("/admissions/skills/applications");
//   }
// };

// // ---------------------------------------------------------------------
// // VIEW ACCEPTANCE LETTER (Student + Admin)
// // ---------------------------------------------------------------------
// exports.viewSkillAcceptanceLetter = async (req, res) => {
//   try {
//     const app = await SkillApplication.findById(req.params.id);

//     if (!app) {
//       req.flash("error_msg", "Application not found.");
//       return res.redirect("/dashboard/student");
//     }

//     if (!app.acceptanceLetter || !app.acceptanceLetter.gcsPath) {
//       req.flash("error_msg", "Acceptance letter not available.");
//       return res.redirect("/dashboard/student");
//     }

//     let signedUrl;

//     try {
//       signedUrl = await generateSignedUrl(app.acceptanceLetter.gcsPath);
//     } catch (e) {
//       signedUrl = app.acceptanceLetter.gcsUrl;
//     }

//     return res.redirect(signedUrl);
//   } catch (err) {
//     console.error("Error loading skill acceptance letter:", err);
//     req.flash("error_msg", "Failed to load acceptance letter.");
//     res.redirect("/dashboard/student");
//   }
// };

// controllers/skillAdmissionsController.js - UPDATED
const SkillApplication = require("../models/SkillApplication");
const Skill = require("../models/Skill");
const User = require("../models/User");

// 🔥 UPDATED IMPORT: Use skill-specific generator
const { generateSkillAcceptancePDF } = require("../utils/skillPdfGenerator");
const { uploadFile, getSignedUrl } = require("../utils/gcs");
const { generateSignedUrl } = require("../config/gcsUpload");
const { sendEmail } = require("../utils/mailer");

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------
// LIST ALL SKILL APPLICATIONS
// ---------------------------------------------------------------------
exports.listSkillApplications = async (req, res) => {
  try {
    const applications = await SkillApplication.find()
      .populate("applicant", "firstName surname email mobile")
      .populate("skill")
      .sort({ createdAt: -1 });

    res.render("admissions/skills/applications", {
      title: "Skill Applications",
      applications,
      user: req.user,
    });
  } catch (err) {
    console.error("Error loading skill applications:", err);
    req.flash("error_msg", "Failed to load skill applications.");
    res.redirect("/dashboard/admissions");
  }
};

// ---------------------------------------------------------------------
// VIEW SINGLE SKILL APPLICATION DETAIL
// ---------------------------------------------------------------------
exports.viewSkillApplicationDetail = async (req, res) => {
  try {
    const app = await SkillApplication.findById(req.params.id)
      .populate("applicant")
      .populate("skill")
      .lean();

    if (!app) {
      req.flash("error_msg", "Application not found.");
      return res.redirect("/admissions/skills/applications");
    }

    // 🔐 Generate signed URLs for documents
    for (const doc of app.documents) {
      if (doc.gcsPath) {
        try {
          doc.signedUrl = await generateSignedUrl(doc.gcsPath);
        } catch (e) {
          doc.signedUrl = doc.gcsUrl || "";
        }
      }
    }

    // 🔐 Acceptance letter signed URL
    if (app.acceptanceLetter && app.acceptanceLetter.gcsPath) {
      try {
        app.acceptanceLetter.signedUrl = await generateSignedUrl(
          app.acceptanceLetter.gcsPath
        );
      } catch (e) {
        app.acceptanceLetter.signedUrl = app.acceptanceLetter.gcsUrl || "";
      }
    }

    res.render("admissions/skills/applicationDetail", {
      title: "Skill Application Detail",
      application: app,
      user: req.user,
    });
  } catch (err) {
    console.error("Error loading skill application:", err);
    req.flash("error_msg", "Failed to load skill application.");
    res.redirect("/admissions/skills/applications");
  }
};

// ---------------------------------------------------------------------
// UPDATE STATUS (APPROVE / REJECT)
// ---------------------------------------------------------------------
exports.updateSkillApplicationStatus = async (req, res) => {
  try {
    const { status, remarks, startDate } = req.body;

    const app = await SkillApplication.findById(req.params.id)
      .populate("applicant")
      .populate("skill");

    if (!app) {
      req.flash("error_msg", "Application not found.");
      return res.redirect("/admissions/skills/applications");
    }

    const recipientEmail = app.applicant?.email;

    if (!recipientEmail) {
      req.flash("error_msg", "Applicant does not have a valid email.");
      return res.redirect("/admissions/skills/applications");
    }

    // Update status
    app.status = status;
    app.remarks = remarks || "";
    app.reviewedAt = new Date();

    const applicant = app.applicant;
    const skill = app.skill;

    // ------------------------------------------------------------------
    // APPROVED
    // ------------------------------------------------------------------
    if (status === "Approved") {
      // 🔥 UPDATED: Use skill-specific PDF generator
      const pdfPath = await generateSkillAcceptancePDF(app, skill, startDate);

      // 2️⃣ Upload
      const destPath = `skill_acceptance/Acceptance_${
        app._id
      }_${Date.now()}.pdf`;
      await uploadFile(pdfPath, destPath);

      // 3️⃣ Save to DB
      app.acceptanceLetter = {
        name: "Skill Acceptance Letter",
        gcsUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${destPath}`,
        gcsPath: destPath,
        uploadedAt: new Date(),
      };

      await app.save();

      // 4️⃣ Signed URL
      const signedUrl = await generateSignedUrl(destPath);

      // 5️⃣ Email applicant
      await sendEmail({
        to: recipientEmail,
        subject: "Copperstone University - Skill Training Acceptance",
        html: `
          <p>Dear ${applicant.firstName},</p>
          <p>Your Skill Training Application for <strong>${
            skill.name
          }</strong> has been <strong>APPROVED</strong>.</p>
          <p>You may download your official acceptance letter here:<br>
          <a href="${signedUrl}" target="_blank">Download Acceptance Letter</a></p>
          <p>Start Date: <strong>${startDate || "To be announced"}</strong></p>
          <br>
          <p>Regards,<br/>Admissions Office</p>
        `,
        attachments: [{ filename: "Skill_Acceptance.pdf", path: pdfPath }],
      });

      // Remove local temp file
      try {
        fs.unlinkSync(pdfPath);
      } catch {}
    }

    // ------------------------------------------------------------------
    // REJECTED
    // ------------------------------------------------------------------
    if (status === "Rejected") {
      await sendEmail({
        to: recipientEmail,
        subject: "Copperstone University - Skill Application Update",
        html: `
          <p>Dear ${applicant.firstName},</p>
          <p>We regret to inform you that your application for <strong>${
            skill.name
          }</strong> was not successful.</p>
          <p>Remarks: ${remarks || "No remarks provided."}</p>
          <p>Regards,<br>Admissions Office</p>
        `,
      });

      await app.save();
    }

    req.flash("success_msg", "Application updated successfully.");
    res.redirect("/admissions/skills/applications");
  } catch (err) {
    console.error("Error updating skill status:", err);
    req.flash("error_msg", "Failed to update application.");
    res.redirect("/admissions/skills/applications");
  }
};

// ---------------------------------------------------------------------
// VIEW ACCEPTANCE LETTER (Student + Admin)
// ---------------------------------------------------------------------
exports.viewSkillAcceptanceLetter = async (req, res) => {
  try {
    const app = await SkillApplication.findById(req.params.id);

    if (!app) {
      req.flash("error_msg", "Application not found.");
      return res.redirect("/dashboard/student");
    }

    if (!app.acceptanceLetter || !app.acceptanceLetter.gcsPath) {
      req.flash("error_msg", "Acceptance letter not available.");
      return res.redirect("/dashboard/student");
    }

    let signedUrl;

    try {
      signedUrl = await generateSignedUrl(app.acceptanceLetter.gcsPath);
    } catch (e) {
      signedUrl = app.acceptanceLetter.gcsUrl;
    }

    return res.redirect(signedUrl);
  } catch (err) {
    console.error("Error loading skill acceptance letter:", err);
    req.flash("error_msg", "Failed to load acceptance letter.");
    res.redirect("/dashboard/student");
  }
};
