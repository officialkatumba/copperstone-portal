// controllers/applicationController.js
const Programme = require("../models/Programme");
const Application = require("../models/Application");
const { uploadToGCS } = require("../config/gcsUpload");
const User = require("../models/User");
// Add this with your other imports at the top:
const Payment = require("../models/Payment");
const { sendEmail } = require("../utils/mailer");

// Add this with your other imports
const { uploadFile } = require("../utils/gcs");

const { generateSignedUrl } = require("../config/gcsUpload");

const { generateReceiptPDF } = require("../utils/receiptPDFGenerator");

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
 */

// exports.submitApplication = async (req, res) => {
//   try {
//     const {
//       firstChoice,
//       secondChoice,
//       paymentMethod,
//       paymentAmount,
//       paymentDescription,
//     } = req.body;

//     // Default paymentAmount → 0
//     const amountToSave = paymentAmount ? parseFloat(paymentAmount) : 0;
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
//         gcsUrl: uploaded.publicUrl,
//         gcsPath: uploaded.path,
//       });
//     }

//     // ✅ 1. FIRST create the application WITHOUT payment
//     const application = await Application.create({
//       applicant: req.user._id,
//       firstChoice,
//       secondChoice: secondChoice || null,
//       documents: gcsDocs,
//       // NO payment field here - it will be added after creating Payment record
//     });

//     // ✅ 2. CREATE PAYMENT RECORD if amount > 0
//     if (amountToSave > 0) {
//       const payment = await Payment.create({
//         student: req.user._id,
//         application: application._id, // Link to application
//         programme: firstChoice,
//         category: "Application Fee",
//         description: paymentDescription || "Application Fee",
//         amount: amountToSave,
//         totalDue: amountToSave, // For application fee, total = amount
//         balanceAfterPayment: 0, // Application fee is paid in full
//         method: paymentMethod,
//         currency: "ZMW",
//         reference: `APP-${Date.now().toString().slice(-8)}`,
//         status: "Pending", // Student payments need verification
//         remarks: "Submitted with application - pending verification",
//         // Use first document as proof if exists
//         proofOfPayment:
//           gcsDocs.length > 0
//             ? {
//                 gcsUrl: gcsDocs[0].gcsUrl,
//                 gcsPath: gcsDocs[0].gcsPath,
//                 uploadedAt: new Date(),
//                 name: gcsDocs[0].name,
//               }
//             : undefined,
//       });

//       // ✅ 3. LINK PAYMENT TO APPLICATION
//       application.payment = payment._id;
//       await application.save();
//     }

//     // ✅ Send confirmation email
//     if (req.user.email) {
//       await sendEmail({
//         to: req.user.email,
//         subject: "📄 Application Submitted Successfully",
//         html: `
//           <p>Dear ${req.user.firstName},</p>
//           <p>Your application has been <strong>submitted successfully</strong>.</p>
//           <p><strong>Application ID:</strong> ${application._id}</p>
//           <p><strong>Programme:</strong> ${programme.name}</p>
//           ${
//             amountToSave > 0
//               ? `<p><strong>Application Fee:</strong> ZMW ${amountToSave.toFixed(
//                   2
//                 )} (Pending Verification)</p>`
//               : ""
//           }
//           <p><strong>Status:</strong> Under Review</p>
//           <p>Regards,<br/>Admissions Office</p>
//         `,
//       });
//     }

//     req.flash("success_msg", "Application submitted successfully!");
//     res.redirect("/dashboard/student");
//   } catch (err) {
//     console.error("Application Error:", err);
//     req.flash("error_msg", "Failed to submit application.");
//     res.redirect("/applications/apply");
//   }
// };

// exports.submitApplication = async (req, res) => {
//   try {
//     const {
//       firstChoice,
//       secondChoice,
//       paymentMethod,
//       paymentAmount,
//       paymentDescription,
//       modeOfStudy, // ✅ ADD THIS LINE
//     } = req.body;

//     // Default paymentAmount → 0
//     const amountToSave = paymentAmount ? parseFloat(paymentAmount) : 0;
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
//         gcsUrl: uploaded.publicUrl,
//         gcsPath: uploaded.path,
//       });
//     }

//     // ✅ 1. FIRST create the application WITHOUT payment
//     const application = await Application.create({
//       applicant: req.user._id,
//       firstChoice,
//       secondChoice: secondChoice || null,
//       modeOfStudy: modeOfStudy || "Full Time", // ✅ ADD THIS LINE (with default)
//       documents: gcsDocs,
//       // NO payment field here - it will be added after creating Payment record
//     });

//     // ✅ 2. CREATE PAYMENT RECORD if amount > 0
//     if (amountToSave > 0) {
//       const payment = await Payment.create({
//         student: req.user._id,
//         application: application._id, // Link to application
//         programme: firstChoice,
//         category: "Application Fee",
//         description: paymentDescription || "Application Fee",
//         amount: amountToSave,
//         totalDue: amountToSave, // For application fee, total = amount
//         balanceAfterPayment: 0, // Application fee is paid in full
//         method: paymentMethod,
//         currency: "ZMW",
//         reference: `APP-${Date.now().toString().slice(-8)}`,
//         status: "Pending", // Student payments need verification
//         remarks: "Submitted with application - pending verification",
//         // Use first document as proof if exists
//         proofOfPayment:
//           gcsDocs.length > 0
//             ? {
//                 gcsUrl: gcsDocs[0].gcsUrl,
//                 gcsPath: gcsDocs[0].gcsPath,
//                 uploadedAt: new Date(),
//                 name: gcsDocs[0].name,
//               }
//             : undefined,
//       });

//       // ✅ 3. LINK PAYMENT TO APPLICATION
//       application.payment = payment._id;
//       await application.save();
//     }

//     // ✅ Send confirmation email (updated with modeOfStudy)
//     if (req.user.email) {
//       await sendEmail({
//         to: req.user.email,
//         subject: "📄 Application Submitted Successfully",
//         html: `
//           <p>Dear ${req.user.firstName},</p>
//           <p>Your application has been <strong>submitted successfully</strong>.</p>
//           <p><strong>Application ID:</strong> ${application._id}</p>
//           <p><strong>Programme:</strong> ${programme.name}</p>
//           <p><strong>Mode of Study:</strong> ${
//             modeOfStudy || "Full Time"
//           }</p> <!-- ✅ ADD THIS LINE -->
//           ${
//             amountToSave > 0
//               ? `<p><strong>Application Fee:</strong> ZMW ${amountToSave.toFixed(
//                   2
//                 )} (Pending Verification)</p>`
//               : ""
//           }
//           <p><strong>Status:</strong> Under Review</p>
//           <p>Regards,<br/>Admissions Office</p>
//         `,
//       });
//     }

//     req.flash("success_msg", "Application submitted successfully!");
//     res.redirect("/dashboard/student");
//   } catch (err) {
//     console.error("Application Error:", err);
//     req.flash("error_msg", "Failed to submit application.");
//     res.redirect("/applications/apply");
//   }
// };

// exports.submitApplication = async (req, res) => {
//   try {
//     const {
//       firstChoice,
//       secondChoice,
//       paymentMethod,
//       paymentAmount,
//       paymentDescription,
//       modeOfStudy,
//     } = req.body;

//     // ===============================
//     // 1️⃣ CHECK IF STUDENT HAS ALREADY APPLIED
//     // ===============================
//     // Check user's admissionStatus
//     if (req.user.studentProfile?.admissionStatus !== "Not Applied") {
//       req.flash(
//         "error_msg",
//         "You have already submitted an application. You cannot submit another one.",
//       );
//       return res.redirect("back");
//     }

//     // Also check if there's an active application in the database
//     const existingApplication = await Application.findOne({
//       applicant: req.user._id,
//       status: { $nin: ["Rejected", "Withdrawn", "Cancelled"] },
//     });

//     if (existingApplication) {
//       req.flash(
//         "error_msg",
//         "You have an existing application. You cannot submit another one.",
//       );
//       return res.redirect("back");
//     }

//     // ===============================
//     // 2️⃣ VALIDATE PROGRAMME
//     // ===============================
//     const programme = await Programme.findById(firstChoice);
//     if (!programme) {
//       req.flash("error_msg", "Invalid programme selected");
//       return res.redirect("back");
//     }

//     const programmeCode = programme.code;
//     const amountToSave = paymentAmount ? parseFloat(paymentAmount) : 0;
//     const applicationYear = new Date().getFullYear();

//     // ===============================
//     // 3️⃣ UPLOAD SUPPORTING DOCUMENTS
//     // ===============================
//     const gcsDocs = [];
//     for (const file of req.files) {
//       const uploaded = await uploadToGCS(
//         file,
//         req.user,
//         programmeCode,
//         applicationYear,
//       );

//       gcsDocs.push({
//         name: file.originalname,
//         gcsUrl: uploaded.publicUrl,
//         gcsPath: uploaded.path,
//       });
//     }

//     // ===============================
//     // 4️⃣ CREATE APPLICATION
//     // ===============================
//     const application = await Application.create({
//       applicant: req.user._id,
//       firstChoice,
//       secondChoice: secondChoice || null,
//       modeOfStudy: modeOfStudy || "Full Time",
//       documents: gcsDocs,
//       status: "Submitted",
//     });

//     // ===============================
//     // 5️⃣ CREATE PAYMENT RECORD IF AMOUNT > 0
//     // ===============================
//     let payment = null;
//     if (amountToSave > 0) {
//       payment = await Payment.create({
//         student: req.user._id,
//         application: application._id,
//         programme: firstChoice,
//         category: "Application Fee",
//         description: paymentDescription || "Application Fee",
//         amount: amountToSave,
//         totalDue: amountToSave,
//         balanceAfterPayment: 0,
//         method: paymentMethod,
//         currency: "ZMW",
//         reference: `APP-${Date.now().toString().slice(-8)}`,
//         status: "Pending", // Needs verification by finance
//         remarks: "Submitted with application - pending verification",
//         proofOfPayment:
//           gcsDocs.length > 0
//             ? {
//                 gcsUrl: gcsDocs[0].gcsUrl,
//                 gcsPath: gcsDocs[0].gcsPath,
//                 uploadedAt: new Date(),
//                 name: gcsDocs[0].name,
//               }
//             : undefined,
//       });

//       // Link payment to application
//       application.payment = payment._id;
//       await application.save();
//     }

//     // ===============================
//     // 6️⃣ UPDATE USER ADMISSION STATUS
//     // ===============================
//     await User.findByIdAndUpdate(req.user._id, {
//       "studentProfile.admissionStatus": "Applied",
//       $push: {
//         appliedCourses: {
//           firstChoice: firstChoice,
//           secondChoice: secondChoice || null,
//           appliedAt: new Date(),
//         },
//       },
//     });

//     // ===============================
//     // 7️⃣ SEND CONFIRMATION EMAIL
//     // ===============================
//     if (req.user.email) {
//       await sendEmail({
//         to: req.user.email,
//         subject: "📄 Application Submitted Successfully",
//         html: `
//           <p>Dear ${req.user.firstName},</p>
//           <p>Your application has been <strong>submitted successfully</strong>.</p>
//           <p><strong>Application ID:</strong> ${application._id}</p>
//           <p><strong>Programme:</strong> ${programme.name}</p>
//           <p><strong>Mode of Study:</strong> ${modeOfStudy || "Full Time"}</p>
//           <p><strong>Admission Status:</strong> Applied</p>
//           ${
//             amountToSave > 0
//               ? `<p><strong>Application Fee:</strong> ZMW ${amountToSave.toFixed(
//                   2,
//                 )} (Pending Verification)</p>
//                  <p><strong>Payment Reference:</strong> ${payment?.reference || "N/A"}</p>`
//               : "<p><strong>No payment required at this time.</strong></p>"
//           }
//           <p><strong>Status:</strong> Under Review</p>
//           <p>You will be notified once your application is reviewed.</p>
//           <p>Regards,<br/>Admissions Office</p>
//         `,
//       });
//     }

//     // ===============================
//     // 8️⃣ SEND NOTIFICATION TO ADMISSIONS OFFICE
//     // ===============================
//     try {
//       await sendEmail({
//         to: process.env.ADMISSIONS_EMAIL || "admissions@university.edu",
//         subject: "📋 New Application Submitted",
//         html: `
//           <p>A new application has been submitted:</p>
//           <p><strong>Student:</strong> ${req.user.firstName} ${req.user.surname}</p>
//           <p><strong>Email:</strong> ${req.user.email}</p>
//           <p><strong>Programme:</strong> ${programme.name}</p>
//           <p><strong>Application ID:</strong> ${application._id}</p>
//           <p><strong>Admission Status:</strong> Applied</p>
//           ${
//             payment
//               ? `<p><strong>Payment Amount:</strong> ZMW ${amountToSave.toFixed(2)}</p>
//                  <p><strong>Payment Status:</strong> ${payment.status}</p>`
//               : "<p><strong>No payment attached</strong></p>"
//           }
//           <p>Please review the application in the admissions portal.</p>
//         `,
//       });
//     } catch (emailErr) {
//       console.log(
//         "Failed to send notification to admissions office:",
//         emailErr.message,
//       );
//     }

//     req.flash(
//       "success_msg",
//       `Application submitted successfully! ${
//         amountToSave > 0
//           ? `Your payment of ZMW ${amountToSave.toFixed(2)} is pending verification.`
//           : "No payment required."
//       }`,
//     );
//     res.redirect("/dashboard/student");
//   } catch (err) {
//     console.error("Application Error:", err);
//     req.flash("error_msg", "Failed to submit application.");
//     res.redirect("/applications/apply");
//   }
// };
// exports.submitApplication = async (req, res) => {
//   try {
//     const {
//       firstChoice,
//       secondChoice,
//       paymentMethod,
//       paymentAmount,
//       paymentDescription,
//       modeOfStudy,
//       paymentReceivedOn, // NEW: Add deposit date field
//     } = req.body;

//     // ===============================
//     // 1️⃣ CHECK IF STUDENT CAN APPLY
//     // ===============================
//     const student = await User.findById(req.user._id);

//     // Check if already registered
//     // if (student.studentProfile?.registrationStatus === "Registered") {
//     //   req.flash(
//     //     "error_msg",
//     //     "You are already a registered student. You cannot submit a new application.",
//     //   );
//     //   return res.redirect("/dashboard/student");
//     // }

//     // // Check admission status
//     // if (student.studentProfile?.admissionStatus !== "Not Applied") {
//     //   req.flash(
//     //     "error_msg",
//     //     `Your admission status is "${student.studentProfile.admissionStatus}". You cannot submit a new application.`,
//     //   );
//     //   return res.redirect("/dashboard/student");
//     // }

//     // // Check for existing application
//     // const existingApplication = await Application.findOne({
//     //   applicant: req.user._id,
//     //   status: { $nin: ["Rejected", "Withdrawn", "Cancelled"] },
//     // });

//     // if (existingApplication) {
//     //   req.flash(
//     //     "error_msg",
//     //     `You have an existing application (ID: ${existingApplication._id}) with status: "${existingApplication.status}".`,
//     //   );
//     //   return res.redirect("/dashboard/student");
//     // }

//     // ===============================
//     // 2️⃣ VALIDATE PROGRAMME
//     // ===============================
//     const programme = await Programme.findById(firstChoice);
//     if (!programme) {
//       req.flash("error_msg", "Invalid programme selected");
//       return res.redirect("back");
//     }

//     const programmeCode = programme.code;
//     const amountToSave = paymentAmount ? parseFloat(paymentAmount) : 0;
//     const applicationYear = new Date().getFullYear();

//     // ===============================
//     // 3️⃣ VALIDATE PAYMENT RECEIVED DATE
//     // ===============================
//     let parsedReceivedDate = new Date(); // Default to now
//     if (paymentReceivedOn) {
//       parsedReceivedDate = new Date(paymentReceivedOn);
//       if (parsedReceivedDate > new Date()) {
//         req.flash(
//           "error_msg",
//           "Payment received date cannot be in the future.",
//         );
//         return res.redirect("back");
//       }
//     }

//     // ===============================
//     // 4️⃣ UPLOAD SUPPORTING DOCUMENTS
//     // ===============================
//     const gcsDocs = [];
//     for (const file of req.files) {
//       const uploaded = await uploadToGCS(
//         file,
//         req.user,
//         programmeCode,
//         applicationYear,
//       );

//       gcsDocs.push({
//         name: file.originalname,
//         gcsUrl: uploaded.publicUrl,
//         gcsPath: uploaded.path,
//       });
//     }

//     // ===============================
//     // 5️⃣ CREATE APPLICATION
//     // ===============================
//     const application = await Application.create({
//       applicant: req.user._id,
//       firstChoice,
//       secondChoice: secondChoice || null,
//       modeOfStudy: modeOfStudy || "Full Time",
//       documents: gcsDocs,
//       status: "Submitted",
//     });

//     // ===============================
//     // 6️⃣ CREATE AND VERIFY PAYMENT AUTOMATICALLY (IF AMOUNT > 0)
//     // ===============================
//     let payment = null;
//     let receiptGenerated = false;

//     if (amountToSave > 0) {
//       // Create payment with VERIFIED status
//       payment = await Payment.create({
//         student: req.user._id,
//         application: application._id,
//         programme: firstChoice,
//         category: "Application Fee",
//         description: paymentDescription || "Application Fee",
//         amount: amountToSave,
//         totalDue: amountToSave,
//         balanceAfterPayment: 0,
//         method: paymentMethod,
//         currency: "ZMW",
//         reference: `APP-${Date.now().toString().slice(-8)}`,
//         status: "Verified", // AUTOMATICALLY VERIFIED
//         verifiedAt: new Date(),
//         paymentReceivedOn: parsedReceivedDate, // Include deposit date
//         remarks: "Application payment - automatically verified",
//         proofOfPayment:
//           gcsDocs.length > 0
//             ? {
//                 gcsUrl: gcsDocs[0].gcsUrl,
//                 gcsPath: gcsDocs[0].gcsPath,
//                 uploadedAt: new Date(),
//                 name: gcsDocs[0].name,
//               }
//             : undefined,
//       });

//       // Link payment to application
//       application.payment = payment._id;
//       await application.save();

//       // ===============================
//       // 7️⃣ GENERATE RECEIPT AUTOMATICALLY
//       // ===============================
//       try {
//         // Get the populated payment (like finance controller does)
//         const populatedPayment = await Payment.findById(payment._id)
//           .populate("student", "firstName surname email")
//           .populate("programme", "name code");

//         // Get application data for receipt
//         const applicationData = await Application.findById(application._id)
//           .populate("firstChoice", "name code")
//           .populate("secondChoice", "name code")
//           .lean();

//         // Generate receipt PDF - Use the SAME structure as finance controller
//         const pdfPath = await generateReceiptPDF({
//           payment: {
//             _id: populatedPayment._id,
//             reference: populatedPayment.reference,
//             amount: populatedPayment.amount,
//             method: populatedPayment.method,
//             status: populatedPayment.status,
//             verifiedAt: populatedPayment.verifiedAt,
//             paymentReceivedOn: populatedPayment.paymentReceivedOn,
//             category: populatedPayment.category,
//             description: populatedPayment.description,
//             totalDue: populatedPayment.totalDue,
//             balanceAfterPayment: populatedPayment.balanceAfterPayment,
//             student: populatedPayment.student,
//             // Add verifiedBy for receipt signature (use system/auto)
//             verifiedBy: {
//               firstName: "System",
//               surname: "Auto-Verified",
//             },
//           },
//           application: applicationData,
//         });

//         // Upload receipt to GCS
//         const gcsPath = `receipts/Application_${application._id}_${Date.now()}.pdf`;
//         await uploadFile(pdfPath, gcsPath);

//         const signedUrl = await generateSignedUrl(gcsPath);

//         // Update payment with receipt info
//         payment.receipt = {
//           name: "Official Application Fee Receipt",
//           gcsPath,
//           gcsUrl: signedUrl,
//           issuedAt: new Date(),
//         };

//         await payment.save();
//         receiptGenerated = true;

//         // Clean up temp file
//         const fs = require("fs");
//         if (fs.existsSync(pdfPath)) {
//           fs.unlinkSync(pdfPath);
//         }

//         // ===============================
//         // 8️⃣ SEND EMAIL WITH RECEIPT ATTACHMENT
//         // ===============================
//         if (req.user.email) {
//           const receiptDate = new Date().toLocaleDateString();
//           const depositDate = payment.paymentReceivedOn
//             ? new Date(payment.paymentReceivedOn).toLocaleDateString()
//             : receiptDate;

//           // Read the PDF file for attachment
//           const pdfBuffer = fs.readFileSync(pdfPath);

//           await sendEmail({
//             to: req.user.email,
//             subject: "✅ Application Submitted with Payment Verified",
//             html: `
//               <p>Dear ${req.user.firstName},</p>
//               <p>Your application has been <strong>submitted successfully</strong>.</p>
//               <p><strong>Application ID:</strong> ${application._id}</p>
//               <p><strong>Programme:</strong> ${programme.name}</p>
//               <p><strong>Mode of Study:</strong> ${modeOfStudy || "Full Time"}</p>
//               <p><strong>Admission Status:</strong> Applied</p>
//               <p><strong>Application Fee:</strong> ZMW ${amountToSave.toFixed(2)} (Verified)</p>
//               <p><strong>Payment Reference:</strong> ${payment.reference}</p>
//               <p><strong>Date Deposited:</strong> ${depositDate}</p>
//               <p><strong>Date Verified:</strong> ${receiptDate}</p>
//               <p><strong>Status:</strong> Under Review</p>
//               <p>Your <strong>official receipt</strong> is attached to this email.</p>
//               <p>You can also download it from the portal: <a href="${signedUrl}">Download Receipt</a></p>
//               <p>You will be notified once your application is reviewed by the admissions committee.</p>
//               <p>Regards,<br/>Admissions Office</p>
//             `,
//             attachments: [
//               {
//                 filename: `Application_Receipt_${payment.reference}.pdf`,
//                 content: pdfBuffer,
//                 contentType: "application/pdf",
//               },
//             ],
//           });
//         }
//       } catch (receiptError) {
//         console.error("Failed to generate receipt:", receiptError);
//         console.error("Receipt error details:", receiptError.message);
//         // Continue even if receipt generation fails
//       }
//     }

//     // ===============================
//     // 9️⃣ UPDATE USER ADMISSION STATUS
//     // ===============================
//     await User.findByIdAndUpdate(req.user._id, {
//       "studentProfile.admissionStatus": "Applied",
//       $push: {
//         appliedCourses: {
//           firstChoice: firstChoice,
//           secondChoice: secondChoice || null,
//           appliedAt: new Date(),
//         },
//       },
//     });

//     // ===============================
//     // 🔟 SEND NOTIFICATION TO ADMISSIONS OFFICE
//     // ===============================
//     try {
//       const depositDate = parsedReceivedDate.toLocaleDateString();

//       await sendEmail({
//         to: process.env.ADMISSIONS_EMAIL || "admissions@university.edu",
//         subject: "📋 New Application Submitted",
//         html: `
//           <p>A new application has been submitted:</p>
//           <p><strong>Student:</strong> ${req.user.firstName} ${req.user.surname}</p>
//           <p><strong>Email:</strong> ${req.user.email}</p>
//           <p><strong>Programme:</strong> ${programme.name}</p>
//           <p><strong>Application ID:</strong> ${application._id}</p>
//           <p><strong>Admission Status:</strong> Applied</p>
//           ${
//             payment
//               ? `<p><strong>Payment Amount:</strong> ZMW ${amountToSave.toFixed(2)}</p>
//                  <p><strong>Payment Status:</strong> ${payment.status}</p>
//                  <p><strong>Payment Date:</strong> ${depositDate}</p>
//                  <p><strong>Payment Reference:</strong> ${payment.reference}</p>`
//               : "<p><strong>No payment attached</strong></p>"
//           }
//           <p>Please review the application in the admissions portal.</p>
//         `,
//       });
//     } catch (emailErr) {
//       console.log(
//         "Failed to send notification to admissions office:",
//         emailErr.message,
//       );
//     }

//     req.flash(
//       "success_msg",
//       `Application submitted successfully! ${
//         amountToSave > 0
//           ? `Your payment of ZMW ${amountToSave.toFixed(2)} has been verified. ${
//               receiptGenerated
//                 ? "Receipt has been generated and sent to your email."
//                 : ""
//             }`
//           : "No payment required."
//       }`,
//     );
//     res.redirect("/dashboard/student");
//   } catch (err) {
//     console.error("Application Error:", err);
//     req.flash("error_msg", "Failed to submit application.");
//     res.redirect("/applications/apply");
//   }
// };

exports.submitApplication = async (req, res) => {
  try {
    const {
      firstChoice,
      secondChoice,
      paymentMethod,
      paymentAmount,
      paymentDescription,
      modeOfStudy,
      paymentReceivedOn, // NEW: Add deposit date field
    } = req.body;

    // ===============================
    // 1️⃣ CHECK IF STUDENT CAN APPLY
    // ===============================
    const student = await User.findById(req.user._id);

    // Check if already registered
    // if (student.studentProfile?.registrationStatus === "Registered") {
    //   req.flash(
    //     "error_msg",
    //     "You are already a registered student. You cannot submit a new application.",
    //   );
    //   return res.redirect("/dashboard/student");
    // }

    // // Check admission status
    // if (student.studentProfile?.admissionStatus !== "Not Applied") {
    //   req.flash(
    //     "error_msg",
    //     `Your admission status is "${student.studentProfile.admissionStatus}". You cannot submit a new application.`,
    //   );
    //   return res.redirect("/dashboard/student");
    // }

    // // Check for existing application
    // const existingApplication = await Application.findOne({
    //   applicant: req.user._id,
    //   status: { $nin: ["Rejected", "Withdrawn", "Cancelled"] },
    // });

    // if (existingApplication) {
    //   req.flash(
    //     "error_msg",
    //     `You have an existing application (ID: ${existingApplication._id}) with status: "${existingApplication.status}".`,
    //   );
    //   return res.redirect("/dashboard/student");
    // }

    // ===============================
    // 2️⃣ VALIDATE PROGRAMME
    // ===============================
    const programme = await Programme.findById(firstChoice);
    if (!programme) {
      req.flash("error_msg", "Invalid programme selected");
      return res.redirect("back");
    }

    const programmeCode = programme.code;
    const amountToSave = paymentAmount ? parseFloat(paymentAmount) : 0;
    const applicationYear = new Date().getFullYear();

    // ===============================
    // 3️⃣ VALIDATE PAYMENT RECEIVED DATE
    // ===============================
    let parsedReceivedDate = new Date(); // Default to now
    if (paymentReceivedOn) {
      parsedReceivedDate = new Date(paymentReceivedOn);
      if (parsedReceivedDate > new Date()) {
        req.flash(
          "error_msg",
          "Payment received date cannot be in the future.",
        );
        return res.redirect("back");
      }
    }

    // ===============================
    // 4️⃣ UPLOAD SUPPORTING DOCUMENTS
    // ===============================
    const gcsDocs = [];
    for (const file of req.files) {
      const uploaded = await uploadToGCS(
        file,
        req.user,
        programmeCode,
        applicationYear,
      );

      gcsDocs.push({
        name: file.originalname,
        gcsUrl: uploaded.publicUrl,
        gcsPath: uploaded.path,
      });
    }

    // ===============================
    // 5️⃣ CREATE APPLICATION
    // ===============================
    const application = await Application.create({
      applicant: req.user._id,
      firstChoice,
      secondChoice: secondChoice || null,
      modeOfStudy: modeOfStudy || "Full Time",
      documents: gcsDocs,
      status: "Submitted",
    });

    // ===============================
    // 6️⃣ CREATE AND VERIFY PAYMENT AUTOMATICALLY (IF AMOUNT > 0)
    // ===============================
    let payment = null;
    let receiptGenerated = false;

    if (amountToSave > 0) {
      // Create payment with VERIFIED status
      payment = await Payment.create({
        student: req.user._id,
        application: application._id,
        programme: firstChoice,
        category: "Application Fee",
        description: paymentDescription || "Application Fee",
        amount: amountToSave,
        totalDue: amountToSave,
        balanceAfterPayment: 0,
        method: paymentMethod,
        currency: "ZMW",
        reference: `APP-${Date.now().toString().slice(-8)}`,
        status: "Verified", // AUTOMATICALLY VERIFIED
        verifiedAt: new Date(),
        paymentReceivedOn: parsedReceivedDate, // Include deposit date
        modeOfStudy: modeOfStudy || "Full Time", // ADD: Save mode of study like finance
        remarks: "Application payment - automatically verified",
        proofOfPayment:
          gcsDocs.length > 0
            ? {
                gcsUrl: gcsDocs[0].gcsUrl,
                gcsPath: gcsDocs[0].gcsPath,
                uploadedAt: new Date(),
                name: gcsDocs[0].name,
              }
            : undefined,
      });

      console.log("DEBUG - Application payment created:", {
        id: payment._id,
        reference: payment.reference,
        studentName: `${req.user.firstName} ${req.user.surname}`,
        programme: programme.name,
        modeOfStudy: modeOfStudy || "Full Time",
      });

      // Link payment to application
      application.payment = payment._id;
      await application.save();

      // ===============================
      // 7️⃣ GENERATE RECEIPT AUTOMATICALLY (ALIGNED WITH FINANCE CONTROLLER)
      // ===============================
      try {
        // Get the populated payment (EXACTLY like finance controller does)
        const populatedPayment = await Payment.findById(payment._id)
          .populate("student", "firstName surname email")
          .populate("programme", "name code")
          .populate("verifiedBy", "firstName surname");

        // Get application data for receipt
        const applicationData = await Application.findById(application._id)
          .populate("firstChoice", "name code")
          .populate("secondChoice", "name code")
          .lean();

        console.log("DEBUG - Populated application payment:", {
          programme: populatedPayment.programme,
          hasProgrammeName: !!populatedPayment.programme?.name,
          hasProgrammeCode: !!populatedPayment.programme?.code,
        });

        // Generate receipt PDF - ALIGNED with finance controller structure
        const pdfPath = await generateReceiptPDF({
          payment: {
            _id: populatedPayment._id,
            reference: populatedPayment.reference, // Use reference as receipt number
            amount: populatedPayment.amount,
            method: populatedPayment.method,
            status: populatedPayment.status,
            verifiedAt: populatedPayment.verifiedAt,
            paymentReceivedOn: populatedPayment.paymentReceivedOn,
            category: populatedPayment.category,
            description: populatedPayment.description,
            totalDue: populatedPayment.totalDue,
            balanceAfterPayment: populatedPayment.balanceAfterPayment,
            student: populatedPayment.student,
            verifiedBy: populatedPayment.verifiedBy || {
              firstName: "System",
              surname: "Auto-Verified",
            },
            // Pass academic fields like finance controller
            programme: populatedPayment.programme,
            modeOfStudy: populatedPayment.modeOfStudy,
            semester: populatedPayment.semester,
            academicYear: populatedPayment.academicYear,
          },
          academicInfo: {
            programme: populatedPayment.programme?.name || programme.name,
            programmeCode: populatedPayment.programme?.code || programme.code,
            modeOfStudy:
              populatedPayment.modeOfStudy || modeOfStudy || "Full Time",
            semester: populatedPayment.semester || "",
            academicYear:
              populatedPayment.academicYear || applicationYear.toString(),
          },
          application: applicationData, // Keep application data for compatibility
        });

        console.log("DEBUG - Application receipt generated at:", pdfPath);

        // Upload receipt to GCS - use reference in filename like finance
        const gcsPath = `receipts/Application_${payment.reference}_${Date.now()}.pdf`;
        await uploadFile(pdfPath, gcsPath);

        const signedUrl = await generateSignedUrl(gcsPath);

        // Update payment with receipt info - aligned with finance structure
        payment.receipt = {
          receiptNumber: payment.reference, // Use reference as receipt number
          name: "Official Application Fee Receipt",
          gcsPath,
          gcsUrl: signedUrl,
          issuedAt: new Date(),
          academicInfo: {
            programme: programme.name,
            programmeCode: programme.code,
            modeOfStudy: modeOfStudy || "Full Time",
            academicYear: applicationYear.toString(),
          },
        };

        await payment.save();
        receiptGenerated = true;

        // Clean up temp file
        const fs = require("fs");
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }

        // ===============================
        // 8️⃣ SEND EMAIL WITH RECEIPT ATTACHMENT (UPDATED FORMAT)
        // ===============================
        if (req.user.email) {
          const receiptDate = new Date().toLocaleDateString();
          const depositDate = payment.paymentReceivedOn
            ? new Date(payment.paymentReceivedOn).toLocaleDateString()
            : receiptDate;

          // Read the PDF file for attachment
          const pdfBuffer = fs.existsSync(pdfPath)
            ? fs.readFileSync(pdfPath)
            : null;

          await sendEmail({
            to: req.user.email,
            subject: "✅ Application Submitted with Payment Verified",
            html: `
              <p>Dear ${req.user.firstName},</p>
              <p>Your application has been <strong>submitted successfully</strong>.</p>
              
              <!-- ACADEMIC INFORMATION (Like Finance Email) -->
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h4 style="margin-top: 0; color: #2c3e50;">Application Information</h4>
                <p><strong>Application ID:</strong> ${application._id}</p>
                <p><strong>Programme:</strong> ${programme.name} (${programme.code})</p>
                <p><strong>Mode of Study:</strong> ${modeOfStudy || "Full Time"}</p>
                <p><strong>Admission Status:</strong> Applied</p>
                <p><strong>Status:</strong> Under Review</p>
              </div>
              
              <!-- PAYMENT INFORMATION (Like Finance Email) -->
              <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h4 style="margin-top: 0; color: #2c3e50;">Payment Information</h4>
                <p><strong>Receipt Number:</strong> ${payment.reference}</p>
                <p><strong>Application Fee:</strong> ZMW ${amountToSave.toFixed(2)} (Verified)</p>
                <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                <p><strong>Date Deposited:</strong> ${depositDate}</p>
                <p><strong>Date Verified:</strong> ${receiptDate}</p>
              </div>
              
              <p>Your <strong>official receipt</strong> is attached to this email.</p>
              <p><a href="${signedUrl}" style="background-color: #3498db; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">Download Receipt from Portal</a></p>
              
              <p>You will be notified once your application is reviewed by the admissions committee.</p>
              <p>Regards,<br/>Admissions Office</p>
            `,
            attachments: pdfBuffer
              ? [
                  {
                    filename: `Application_Receipt_${payment.reference}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                  },
                ]
              : [],
          });
        }
      } catch (receiptError) {
        console.error("Failed to generate receipt:", receiptError);
        console.error("Receipt error details:", receiptError.message);
        // Continue even if receipt generation fails
      }
    }

    // ===============================
    // 9️⃣ UPDATE USER ADMISSION STATUS
    // ===============================
    await User.findByIdAndUpdate(req.user._id, {
      "studentProfile.admissionStatus": "Applied",
      $push: {
        appliedCourses: {
          firstChoice: firstChoice,
          secondChoice: secondChoice || null,
          appliedAt: new Date(),
        },
      },
    });

    // ===============================
    // 🔟 SEND NOTIFICATION TO ADMISSIONS OFFICE
    // ===============================
    try {
      const depositDate = parsedReceivedDate.toLocaleDateString();

      await sendEmail({
        to: process.env.ADMISSIONS_EMAIL || "admissions@university.edu",
        subject: "📋 New Application Submitted",
        html: `
          <p>A new application has been submitted:</p>
          <p><strong>Student:</strong> ${req.user.firstName} ${req.user.surname}</p>
          <p><strong>Email:</strong> ${req.user.email}</p>
          <p><strong>Programme:</strong> ${programme.name} (${programme.code})</p>
          <p><strong>Mode of Study:</strong> ${modeOfStudy || "Full Time"}</p>
          <p><strong>Application ID:</strong> ${application._id}</p>
          <p><strong>Admission Status:</strong> Applied</p>
          ${
            payment
              ? `<p><strong>Payment Amount:</strong> ZMW ${amountToSave.toFixed(2)}</p>
                 <p><strong>Payment Status:</strong> ${payment.status}</p>
                 <p><strong>Payment Date:</strong> ${depositDate}</p>
                 <p><strong>Payment Reference:</strong> ${payment.reference}</p>
                 <p><strong>Receipt Number:</strong> ${payment.reference}</p>`
              : "<p><strong>No payment attached</strong></p>"
          }
          <p>Please review the application in the admissions portal.</p>
        `,
      });
    } catch (emailErr) {
      console.log(
        "Failed to send notification to admissions office:",
        emailErr.message,
      );
    }

    req.flash(
      "success_msg",
      `Application submitted successfully! ${
        amountToSave > 0
          ? `Your payment of ZMW ${amountToSave.toFixed(2)} has been verified. Receipt #${payment?.reference} has been generated and sent to your email.`
          : "No payment required."
      }`,
    );
    res.redirect("/dashboard/student");
  } catch (err) {
    console.error("Application Error:", err);
    req.flash("error_msg", "Failed to submit application.");
    res.redirect("/applications/apply");
  }
};
// // view my applications

// exports.getMyApplications = async (req, res) => {
//   try {
//     let applications = await Application.find({ applicant: req.user._id })
//       .populate("firstChoice")
//       .populate("secondChoice")
//       .sort({ createdAt: -1 })
//       .lean();

//     for (const app of applications) {
//       for (const doc of app.documents) {
//         if (doc.gcsPath) {
//           // ✅ New secure way
//           doc.signedUrl = await generateSignedUrl(doc.gcsPath);
//         } else if (doc.gcsUrl) {
//           // fallback for old records
//           doc.signedUrl = doc.gcsUrl;
//         }
//       }
//     }

//     res.render("applications/myApplications", {
//       title: "My Applications",
//       applications,
//       user: req.user,
//     });
//   } catch (err) {
//     console.error("Error loading applications:", err);
//     req.flash("error_msg", "Failed to load your applications.");
//     res.redirect("/dashboard/student");
//   }
// };

// view my applications
exports.getMyApplications = async (req, res) => {
  try {
    let applications = await Application.find({
      applicant: req.user._id,
    })
      .populate("firstChoice")
      .populate("secondChoice")
      .populate("payment") // ✅ THIS IS THE FIX
      .sort({ createdAt: -1 })
      .lean();

    // Sign document URLs
    for (const app of applications) {
      for (const doc of app.documents) {
        if (doc.gcsPath) {
          doc.signedUrl = await generateSignedUrl(doc.gcsPath);
        } else if (doc.gcsUrl) {
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

exports.viewApplicationDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Keep this validation but fix the redirect
    if (id === "apply" || id === "my" || id === "new") {
      if (id === "apply") {
        return res.redirect("/programs/apply"); // Correct path
      } else if (id === "my") {
        return res.redirect("/dashboard/student"); // Correct path
      }
      return res.redirect("/dashboard/student");
    }

    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash("error_msg", "Invalid application ID");
      return res.redirect("/dashboard/student"); // Keep this consistent
    }

    // ✅ Populate payment (new model) but keep it optional
    const application = await Application.findById(id)
      .populate("firstChoice")
      .populate("secondChoice")
      .populate({
        path: "payment",
        select: "status receipt amount method", // Only select needed fields
      })
      .lean();

    if (!application) {
      req.flash("error_msg", "Application not found");
      return res.redirect("/dashboard/student"); // Consistent redirect
    }

    console.log("DEBUG - Application loaded:", {
      id: application._id,
      hasPayment: !!application.payment,
      paymentStatus: application.payment?.status,
    });

    // ✅ Generate signed URLs for documents (keep this from old version)
    for (const doc of application.documents) {
      if (doc.gcsPath) {
        try {
          doc.signedUrl = await generateSignedUrl(doc.gcsPath);
        } catch (error) {
          console.error("Error generating signed URL:", error);
          doc.signedUrl = doc.gcsUrl || "#";
        }
      } else {
        doc.signedUrl = doc.gcsUrl || "#";
      }
    }

    // ✅ Handle BOTH old and new receipt structures
    // Old: application.receipt directly
    // New: application.payment.receipt
    if (!application.receipt && application.payment?.receipt) {
      application.receipt = application.payment.receipt;
    }

    // ✅ Set payment status for template
    if (application.payment) {
      application.paymentStatus = application.payment.status;
      application.paymentAmount = application.payment.amount;
      application.paymentMethod = application.payment.method;
    }

    res.render("applications/applicationDetails", {
      title: "Application Details",
      application,
      user: req.user,
    });
  } catch (err) {
    console.error("Error loading application details:", err);
    req.flash("error_msg", "Failed to load application details");
    res.redirect("/dashboard/student"); // Consistent redirect
  }
};

// veiw/download my receipt

// exports.viewReceipt = async (req, res) => {
//   const app = await Application.findById(req.params.id);

//   if (!app?.receipt?.gcsPath) {
//     req.flash("error_msg", "Receipt not available.");
//     return res.redirect("back");
//   }

//   const signedUrl = await generateSignedUrl(app.receipt.gcsPath);
//   return res.redirect(signedUrl);
// };

// controllers/applicationController.js
exports.viewReceipt = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("payment")
      .lean();

    if (!application?.payment?.receipt?.gcsPath) {
      req.flash("error_msg", "Receipt not available.");
      return res.redirect("/applications/my");
    }

    const signedUrl = await generateSignedUrl(
      application.payment.receipt.gcsPath,
    );

    return res.redirect(signedUrl);
  } catch (err) {
    console.error("Receipt error:", err);
    req.flash("error_msg", "Failed to load receipt.");
    res.redirect("/applications/my");
  }
};

// View my courses and academic record

exports.viewMyCourses = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      req.flash("error_msg", "Please log in to view your courses.");
      return res.redirect("/login");
    }

    // Get student with ALL academic data populated
    const student = await User.findById(req.user._id)
      .populate({
        path: "assignedCourses.course",
        model: "Course",
        select: "code name credits description",
      })
      .populate("programme", "name code")
      .populate("approvedCourses.programme", "name code")
      .populate("semesterHistory.courses.course", "code name credits") // Add this for past semesters
      .lean();

    if (!student) {
      req.flash("error_msg", "Student not found.");
      return res.redirect("/dashboard/student");
    }

    // Check if student has an approved programme
    let currentProgramme = null;
    if (student.programme && typeof student.programme === "object") {
      currentProgramme = student.programme;
    } else if (student.approvedCourses && student.approvedCourses.length > 0) {
      // Use the latest approved programme if programme field is not set
      const latestApproval =
        student.approvedCourses[student.approvedCourses.length - 1];
      currentProgramme = latestApproval.programme;
    }

    // Separate current courses by semester
    const currentCoursesBySemester = {};
    const allCurrentSemesters = [];

    if (student.assignedCourses && student.assignedCourses.length > 0) {
      student.assignedCourses.forEach((assignment) => {
        const semester = assignment.semester;
        if (!currentCoursesBySemester[semester]) {
          currentCoursesBySemester[semester] = [];
          allCurrentSemesters.push(semester);
        }

        // Add course with assignment details
        currentCoursesBySemester[semester].push({
          course: assignment.course,
          assignmentId: assignment._id,
          semester: assignment.semester,
          startDate: assignment.startDate,
          endDate: assignment.endDate,
          status: assignment.status,
          grade: assignment.grade,
          creditsEarned: assignment.creditsEarned,
          assignedAt: assignment.assignedAt,
        });
      });
    }

    // Sort current semesters
    allCurrentSemesters.sort((a, b) => a - b);

    // Process past semesters from semesterHistory
    const pastSemesters = [];
    if (student.semesterHistory && student.semesterHistory.length > 0) {
      student.semesterHistory.forEach((history) => {
        pastSemesters.push({
          semester: history.semester,
          academicYear: history.academicYear,
          semesterGPA: history.semesterGPA,
          creditsAttempted: history.creditsAttempted,
          creditsEarned: history.creditsEarned,
          courses: history.courses,
          startDate: history.startDate,
          endDate: history.endDate,
        });
      });

      // Sort past semesters by semester number
      pastSemesters.sort((a, b) => a.semester - b.semester);
    }

    // Calculate GPA if available
    const gpa = student.academicProgress?.cumulativeGPA || 0;
    const creditsEarned = student.academicProgress?.totalCreditsEarned || 0;
    const creditsAttempted =
      student.academicProgress?.totalCreditsAttempted || 0;

    res.render("students/courses", {
      title: "My Academic Record",
      user: student,
      currentCoursesBySemester,
      allCurrentSemesters,
      pastSemesters,
      currentSemester: student.currentSemester || 1,
      academicStatus: student.academicProgress?.status || "Active",
      gpa,
      creditsEarned,
      creditsAttempted,
      programme: currentProgramme,
    });
  } catch (error) {
    console.error("Error loading student courses:", error);
    req.flash("error_msg", "Failed to load your academic record.");
    res.redirect("/dashboard/student");
  }
};

// In a new controller file or add to studentController.js
exports.generateResultsCard = async (req, res) => {
  try {
    const { semester, academicYear } = req.params;

    // Get student data for the specified semester
    const student = await User.findById(req.user._id)
      .populate("programme", "name code")
      .populate({
        path: "semesterHistory.courses.course",
        model: "Course",
        select: "code name credits",
      })
      .lean();

    // Find the specific semester
    const targetSemester = student.semesterHistory.find(
      (s) => s.semester == semester && s.academicYear === academicYear,
    );

    if (!targetSemester) {
      req.flash("error_msg", "No results found for the specified semester.");
      return res.redirect("/student/courses");
    }

    // Generate PDF results card
    const pdfBuffer = await generateResultsPDF(student, targetSemester);

    // Send PDF as download
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Results_Semester_${semester}_${academicYear}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating results card:", error);
    req.flash("error_msg", "Failed to generate results card.");
    res.redirect("/student/courses");
  }
};

// Helper function to generate PDF (you'll need to implement this)
async function generateResultsPDF(student, semesterData) {
  // Use a PDF library like pdfkit, puppeteer, or html-pdf
  // This is a placeholder - implement based on your PDF generation setup
  return Buffer.from("PDF generation would go here");
}
