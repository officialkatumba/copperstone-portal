// backend/controllers/financeController.js
// const Application = require("../models/Application");
// const { generateSignedUrl } = require("../config/gcsUpload");
// const { generateReceiptPDF } = require("../utils/receiptPDFGenerator");
// const { uploadFile } = require("../utils/gcs");
// const Payment = require("../models/Payment");

// backend/controllers/financeController.js
const { sendEmail } = require("../utils/mailer");
const Application = require("../models/Application");
const Payment = require("../models/Payment");
const User = require("../models/User"); // ✅ FIXED

const { generateSignedUrl } = require("../config/gcsUpload");
const { generateReceiptPDF } = require("../utils/receiptPDFGenerator");
const { uploadFile } = require("../utils/gcs");

// List all applications with payments
// exports.listFinanceApplications = async (req, res) => {
//   try {
//     const applications = await Application.find()
//       .populate("applicant", "firstName surname email mobile")
//       .populate("firstChoice", "name code level")
//       .populate("secondChoice", "name code level")
//       .sort({ createdAt: -1 })
//       .lean();

//     res.render("finance/applications", {
//       title: "Finance - Applications & Payments",
//       applications,
//       user: req.user,
//     });
//   } catch (err) {
//     console.error("Finance list error:", err);
//     req.flash("error_msg", "Could not load finance applications.");
//     res.redirect("/dashboard/finance");
//   }
// };

// List all applications with payments
exports.listFinanceApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("applicant", "firstName surname email mobile")
      .populate("firstChoice", "name code level")
      .populate("secondChoice", "name code level")
      .populate("payment", "amount method status reference") // Add this line!
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

// exports.verifyPayment = async (req, res) => {
//   try {
//     const { status, remarks } = req.body;

//     // ===============================
//     // 1️⃣ LOAD APPLICATION
//     // ===============================
//     const application = await Application.findById(req.params.id)
//       .populate("applicant")
//       .exec();

//     if (!application) {
//       req.flash("error_msg", "Application not found.");
//       return res.redirect("/finance/applications");
//     }

//     // ===============================
//     // 2️⃣ ENSURE PAYMENT OBJECT EXISTS
//     // ===============================
//     if (!application.payment) {
//       application.payment = {};
//     }

//     // ===============================
//     // 3️⃣ UPDATE PAYMENT STATUS
//     // ===============================
//     application.payment.status = status;
//     application.payment.remarks = remarks || "";
//     application.payment.verifiedBy = req.user._id;
//     application.payment.verifiedAt = new Date();

//     // ===============================
//     // 4️⃣ ISSUE RECEIPT (ONLY ON VERIFIED)
//     // ===============================
//     if (status === "Verified") {
//       // Prevent double-issuing receipts
//       if (!application.receipt || !application.receipt.gcsPath) {
//         // 🔐 Build SAFE payment payload for receipt generator
//         const receiptPayment = {
//           _id: application.payment._id || application._id,
//           reference: application.payment.reference,
//           amount: application.payment.amount || 0,
//           method: application.payment.method || "Manual",
//           status: "Verified",
//           verifiedAt: application.payment.verifiedAt,

//           // Defaults for application payments
//           category: "Application Fee",
//           description: "Application Payment",

//           // Student info (VERY IMPORTANT)
//           student: application.applicant,
//         };

//         // Generate PDF
//         const pdfPath = await generateReceiptPDF({
//           payment: receiptPayment,
//         });

//         // Upload to GCS
//         const gcsPath = `receipts/Application_${
//           application._id
//         }_${Date.now()}.pdf`;
//         await uploadFile(pdfPath, gcsPath);

//         // Attach receipt to application
//         application.receipt = {
//           name: "Official Payment Receipt",
//           gcsPath,
//           gcsUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${gcsPath}`,
//           issuedAt: new Date(),
//         };
//       }
//     }

//     // ===============================
//     // 5️⃣ SAVE & EXIT
//     // ===============================
//     await application.save();

//     req.flash(
//       "success_msg",
//       status === "Verified"
//         ? "Payment verified and receipt issued successfully."
//         : "Payment status updated successfully."
//     );

//     return res.redirect("/finance/applications");
//   } catch (error) {
//     console.error("❌ VERIFY PAYMENT ERROR:", error);

//     req.flash("error_msg", "Payment verification failed.");
//     return res.redirect("/finance/applications");
//   }
// };

// exports.verifyPayment = async (req, res) => {
//   try {
//     const { status, remarks } = req.body;

//     // ===============================
//     // 1️⃣ LOAD APPLICATION
//     // ===============================
//     const application = await Application.findById(req.params.id)
//       .populate("applicant")
//       .exec();

//     if (!application) {
//       req.flash("error_msg", "Application not found.");
//       return res.redirect("/finance/applications");
//     }

//     // ===============================
//     // 2️⃣ ENSURE PAYMENT OBJECT EXISTS
//     // ===============================
//     if (!application.payment) {
//       application.payment = {};
//     }

//     // ===============================
//     // 3️⃣ UPDATE PAYMENT STATUS
//     // ===============================
//     application.payment.status = status;
//     application.payment.remarks = remarks || "";
//     application.payment.verifiedBy = req.user._id;
//     application.payment.verifiedAt = new Date();

//     // ===============================
//     // 4️⃣ ISSUE RECEIPT (ONLY ON VERIFIED)
//     // ===============================
//     if (status === "Verified") {
//       // Prevent double issuing
//       if (!application.receipt || !application.receipt.gcsPath) {
//         // 🔐 Build SAFE payment payload
//         const receiptPayment = {
//           _id: application.payment._id || application._id,
//           reference: application.payment.reference,
//           amount: application.payment.amount || 0,
//           method: application.payment.method || "Manual",
//           status: "Verified",
//           verifiedAt: application.payment.verifiedAt,

//           category: "Application Fee",
//           description: "Application Payment",

//           student: application.applicant,
//         };

//         // Generate receipt PDF
//         const pdfPath = await generateReceiptPDF({
//           payment: receiptPayment,
//         });

//         // Upload to GCS
//         const gcsPath = `receipts/Application_${
//           application._id
//         }_${Date.now()}.pdf`;
//         await uploadFile(pdfPath, gcsPath);

//         // Attach receipt
//         application.receipt = {
//           name: "Official Payment Receipt",
//           gcsPath,
//           gcsUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${gcsPath}`,
//           issuedAt: new Date(),
//         };

//         // ===============================
//         // 📧 SEND RECEIPT EMAILS
//         // ===============================
//         const signedUrl = await generateSignedUrl(application.receipt.gcsPath);

//         const studentEmail =
//           application.applicant?.email || application.applicantEmail;

//         if (studentEmail) {
//           // Student email
//           // await sendEmail({
//           //   to: studentEmail,
//           //   subject: "💳 Payment Verified – Official Receipt",
//           //   html: `
//           //     <p>Dear ${application.applicant.firstName || "Student"},</p>
//           //     <p>Your payment has been <strong>successfully verified</strong>.</p>
//           //     <p>
//           //       <a href="${signedUrl}">Download your official receipt</a>
//           //     </p>
//           //     <br/>
//           //     <p>Regards,<br/>Finance Office</p>
//           //   `,
//           // });

//           // VC + Registrar
//           // await sendEmail({
//           //   to: ["officialkwina@gmail.com", "annebupe@gmail.com"],
//           //   subject: "📄 Payment Verified – Receipt Issued",
//           //   html: `
//           //     <p>A payment has been verified and a receipt has been issued.</p>
//           //     <p><strong>Student:</strong> ${application.applicant.firstName} ${application.applicant.surname}</p>
//           //     <p><strong>Amount:</strong> ${application.payment.amount}</p>
//           //     <p><a href="${signedUrl}">View Receipt</a></p>
//           //   `,
//           // });

//           await sendEmail({
//             to: studentEmail,
//             subject: "💳 Payment Verified – Official Receipt",
//             html: `
//     <p>Dear ${application.applicant.firstName || "Student"},</p>

//     <p>Your payment has been <strong>successfully verified</strong>.</p>

//     <p>
//       Your <strong>official receipt</strong> is attached to this email as a PDF.
//     </p>

//     <p>
//       You may also download it later from the portal using the link below:
//     </p>

//     <p>
//       <a href="${signedUrl}">
//         Download Receipt from Portal
//       </a>
//     </p>

//     <br/>
//     <p>Regards,<br/>Finance Office</p>
//   `,
//             attachments: [
//               {
//                 filename: "Official_Payment_Receipt.pdf",
//                 path: pdfPath, // 🔑 attach the generated PDF
//                 contentType: "application/pdf",
//               },
//             ],
//           });

//           await sendEmail({
//             to: ["officialkwina@gmail.com", "annebupe@gmail.com"],
//             subject: "📄 Payment Verified – Receipt Issued",
//             html: `
//     <p>A student payment has been <strong>verified</strong> and an official receipt has been issued.</p>

//     <p>
//       <strong>Student:</strong>
//       ${application.applicant.firstName} ${application.applicant.surname}
//     </p>

//     <p>
//       <strong>Amount:</strong>
//       ZMW ${application.payment.amount}
//     </p>

//     <p>
//       The official receipt is attached to this email.
//     </p>

//     <p>
//       You may also access the receipt via the portal:
//       <br/>
//       <a href="${signedUrl}">View Receipt in Portal</a>
//     </p>
//   `,
//             attachments: [
//               {
//                 filename: `Receipt_${application._id}.pdf`,
//                 path: pdfPath, // 🔑 same generated PDF
//                 contentType: "application/pdf",
//               },
//             ],
//           });

//           console.log("📧 Receipt emails sent (Student, VC, Registrar)");
//         } else {
//           console.warn("⚠️ No student email found. Receipt email skipped.");
//         }
//       }
//     }

//     // ===============================
//     // 5️⃣ SAVE & EXIT
//     // ===============================
//     await application.save();

//     req.flash(
//       "success_msg",
//       status === "Verified"
//         ? "Payment verified, receipt issued, and emails sent."
//         : "Payment status updated successfully."
//     );

//     return res.redirect("/finance/applications");
//   } catch (error) {
//     console.error("❌ VERIFY PAYMENT ERROR:", error);
//     req.flash("error_msg", "Payment verification failed.");
//     return res.redirect("/finance/applications");
//   }
// };

// exports.verifyPaymentDirect = async (req, res) => {
//   try {
//     const { status, remarks } = req.body;
//     const paymentId = req.params.id;

//     // ===============================
//     // 1️⃣ LOAD PAYMENT
//     // ===============================
//     const payment = await Payment.findById(paymentId)
//       .populate("student", "firstName surname email")
//       .populate("verifiedBy", "firstName surname")
//       .exec();

//     if (!payment) {
//       req.flash("error_msg", "Payment not found.");
//       return res.redirect("/finance/payments");
//     }

//     // ===============================
//     // 2️⃣ UPDATE PAYMENT STATUS
//     // ===============================
//     payment.status = status;
//     payment.remarks = remarks || "";
//     payment.verifiedBy = req.user._id;
//     payment.verifiedAt = new Date();

//     // ===============================
//     // 3️⃣ ISSUE RECEIPT (ONLY IF VERIFIED)
//     // ===============================
//     if (
//       status === "Verified" &&
//       (!payment.receipt || !payment.receipt.gcsPath)
//     ) {
//       // Generate receipt PDF
//       const pdfPath = await generateReceiptPDF({
//         payment: {
//           _id: payment._id,
//           reference: payment.reference,
//           amount: payment.amount,
//           method: payment.method,
//           status: "Verified",
//           verifiedAt: payment.verifiedAt,
//           category: payment.category,
//           description: payment.description,
//           student: payment.student,
//         },
//       });

//       // Upload receipt to GCS
//       const gcsPath = `receipts/Payment_${payment._id}_${Date.now()}.pdf`;
//       await uploadFile(pdfPath, gcsPath);

//       // Save receipt info
//       payment.receipt = {
//         name: "Official Payment Receipt",
//         gcsPath,
//         gcsUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${gcsPath}`,
//         issuedAt: new Date(),
//       };

//       // Generate signed URL
//       const signedUrl = await generateSignedUrl(gcsPath);

//       // ===============================
//       // 📧 SEND EMAILS
//       // ===============================
//       const studentEmail = payment.student?.email;

//       if (studentEmail) {
//         // Student email (PDF attachment)
//         await sendEmail({
//           to: studentEmail,
//           subject: "💳 Payment Verified – Official Receipt",
//           html: `
//             <p>Dear ${payment.student.firstName || "Student"},</p>
//             <p>Your payment has been <strong>successfully verified</strong>.</p>
//             <p>
//               Your <strong>official receipt</strong> is attached to this email as a PDF.
//             </p>
//             <p>
//               You may also download it later from the portal:
//               <br/>
//               <a href="${signedUrl}">Download Receipt from Portal</a>
//             </p>
//             <br/>
//             <p>Regards,<br/>Finance Office</p>
//           `,
//           attachments: [
//             {
//               filename: "Official_Payment_Receipt.pdf",
//               path: pdfPath,
//               contentType: "application/pdf",
//             },
//           ],
//         });

//         // VC + Registrar email
//         await sendEmail({
//           to: ["officialkwina@gmail.com", "annebupe@gmail.com"],
//           subject: "📄 Payment Verified – Receipt Issued",
//           html: `
//             <p>A student payment has been <strong>verified</strong> and an official receipt has been issued.</p>
//             <p><strong>Student:</strong> ${payment.student.firstName} ${payment.student.surname}</p>
//             <p><strong>Amount:</strong> ZMW ${payment.amount}</p>
//             <p><strong>Category:</strong> ${payment.category}</p>
//             <p>The official receipt is attached to this email.</p>
//             <p>Portal access: <br/><a href="${signedUrl}">View Receipt in Portal</a></p>
//           `,
//           attachments: [
//             {
//               filename: `Receipt_${payment._id}.pdf`,
//               path: pdfPath,
//               contentType: "application/pdf",
//             },
//           ],
//         });

//         console.log("📧 Receipt emails sent (Student, VC, Registrar)");
//       } else {
//         console.warn("⚠️ No student email found. Receipt email skipped.");
//       }
//     }

//     // ===============================
//     // 4️⃣ SAVE & EXIT
//     // ===============================
//     await payment.save();

//     req.flash(
//       "success_msg",
//       status === "Verified"
//         ? "Payment verified, receipt issued, and emails sent."
//         : "Payment status updated successfully."
//     );

//     return res.redirect("/finance/payments");
//   } catch (error) {
//     console.error("❌ VERIFY PAYMENT ERROR:", error);
//     req.flash("error_msg", "Payment verification failed.");
//     return res.redirect("/finance/payments");
//   }
// };
// Verify / reject payment
exports.verifyPaymentDirect = async (req, res) => {
  try {
    console.log("🔍 DEBUG - Request body:", req.body); // ADD THIS FOR DEBUGGING
    const { action, remarks } = req.body; // action will be "Verified", "Rejected", or "Partially Paid"
    const paymentId = req.params.id;

    console.log("🔍 DEBUG - Payment ID:", paymentId, "Action:", action);

    // ===============================
    // 1️⃣ LOAD PAYMENT
    // ===============================
    const payment = await Payment.findById(paymentId)
      .populate("student", "firstName surname email")
      .populate("verifiedBy", "firstName surname")
      .exec();

    if (!payment) {
      req.flash("error_msg", "Payment not found.");
      return res.redirect("/finance/payments");
    }

    console.log("🔍 DEBUG - Payment before update:", {
      id: payment._id,
      currentStatus: payment.status,
      action: action,
    });

    // ===============================
    // 2️⃣ UPDATE PAYMENT STATUS
    // ===============================
    // Validate the action is in our enum
    const validStatuses = [
      "Pending",
      "Verified",
      "Partially Paid",
      "Fully Paid",
      "Cancelled",
      "Rejected",
    ];
    if (!validStatuses.includes(action)) {
      console.error("❌ Invalid status:", action);
      req.flash("error_msg", `Invalid status: ${action}`);
      return res.redirect("/finance/payments");
    }

    payment.status = action; // Direct assignment since form now sends correct values
    payment.remarks = remarks || "";
    payment.verifiedBy = req.user._id;
    payment.verifiedAt = new Date();

    console.log("🔍 DEBUG - Payment after update (before save):", {
      status: payment.status,
      remarks: payment.remarks,
      verifiedBy: payment.verifiedBy,
      verifiedAt: payment.verifiedAt,
    });

    // ===============================
    // 3️⃣ ISSUE RECEIPT (ONLY IF VERIFIED)
    // ===============================
    if (
      action === "Verified" &&
      (!payment.receipt || !payment.receipt.gcsPath)
    ) {
      console.log("🔍 DEBUG - Generating receipt for verified payment");
      // Generate receipt PDF
      const pdfPath = await generateReceiptPDF({
        payment: {
          _id: payment._id,
          reference: payment.reference,
          amount: payment.amount,
          method: payment.method,
          status: "Verified",
          verifiedAt: payment.verifiedAt,
          category: payment.category,
          description: payment.description,
          student: payment.student,
        },
      });

      // Upload receipt to GCS
      const gcsPath = `receipts/Payment_${payment._id}_${Date.now()}.pdf`;
      await uploadFile(pdfPath, gcsPath);

      // Save receipt info
      payment.receipt = {
        name: "Official Payment Receipt",
        gcsPath,
        gcsUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${gcsPath}`,
        issuedAt: new Date(),
      };

      // Generate signed URL
      const signedUrl = await generateSignedUrl(gcsPath);

      // ===============================
      // 📧 SEND EMAILS
      // ===============================
      const studentEmail = payment.student?.email;

      if (studentEmail) {
        // Student email (PDF attachment)
        await sendEmail({
          to: studentEmail,
          subject: "💳 Payment Verified – Official Receipt",
          html: `
            <p>Dear ${payment.student.firstName || "Student"},</p>
            <p>Your payment has been <strong>successfully verified</strong>.</p>
            <p>
              Your <strong>official receipt</strong> is attached to this email as a PDF.
            </p>
            <p>
              You may also download it later from the portal:
              <br/>
              <a href="${signedUrl}">Download Receipt from Portal</a>
            </p>
            <br/>
            <p>Regards,<br/>Finance Office</p>
          `,
          attachments: [
            {
              filename: "Official_Payment_Receipt.pdf",
              path: pdfPath,
              contentType: "application/pdf",
            },
          ],
        });

        // VC + Registrar email
        // await sendEmail({
        //   to: ["officialkwina@gmail.com", "annebupe@gmail.com"],
        //   subject: "📄 Payment Verified – Receipt Issued",
        //   html: `
        //     <p>A student payment has been <strong>verified</strong> and an official receipt has been issued.</p>
        //     <p><strong>Student:</strong> ${payment.student.firstName} ${payment.student.surname}</p>
        //     <p><strong>Amount:</strong> ZMW ${payment.amount}</p>
        //     <p><strong>Category:</strong> ${payment.category}</p>
        //     <p>The official receipt is attached to this email.</p>
        //     <p>Portal access: <br/><a href="${signedUrl}">View Receipt in Portal</a></p>
        //   `,
        //   attachments: [
        //     {
        //       filename: `Receipt_${payment._id}.pdf`,
        //       path: pdfPath,
        //       contentType: "application/pdf",
        //     },
        //   ],
        // });

        console.log("📧 Receipt emails sent to Student");

        // console.log("📧 Receipt emails sent (Student, VC, Registrar)");
      } else {
        console.warn("⚠️ No student email found. Receipt email skipped.");
      }
    }

    // ===============================
    // 4️⃣ SAVE & EXIT
    // ===============================
    const savedPayment = await payment.save();
    console.log("🔍 DEBUG - Payment after save:", {
      id: savedPayment._id,
      status: savedPayment.status,
      updatedAt: savedPayment.updatedAt,
    });

    // Verify the save actually worked
    const verifySave = await Payment.findById(paymentId);
    console.log("🔍 DEBUG - Database verification:", {
      statusInDB: verifySave.status,
    });

    req.flash(
      "success_msg",
      action === "Verified"
        ? "Payment verified, receipt issued, and emails sent."
        : "Payment status updated successfully."
    );

    return res.redirect("/finance/payments");
  } catch (error) {
    // console.error("❌ VERIFY PAYMENT ERROR:", error);
    // console.error("❌ Error details:", error.message);
    // console.error("❌ Error stack:", error.stack);
    req.flash("error_msg", "Payment verification failed.");
    return res.redirect("/finance/payments");
  }
};

// exports.verifyPayment = async (req, res) => {
//   try {
//     const { status, remarks } = req.body;

//     // ===============================
//     // 1️⃣ LOAD APPLICATION
//     // ===============================
//     const application = await Application.findById(req.params.id)
//       .populate("applicant")
//       .exec();

//     if (!application) {
//       req.flash("error_msg", "Application not found.");
//       return res.redirect("/finance/applications");
//     }

//     // ===============================
//     // 2️⃣ ENSURE PAYMENT OBJECT EXISTS
//     // ===============================
//     if (!application.payment) {
//       application.payment = {};
//     }

//     // ===============================
//     // 3️⃣ UPDATE PAYMENT STATUS
//     // ===============================
//     application.payment.status = status;
//     application.payment.remarks = remarks || "";
//     application.payment.verifiedBy = req.user._id;
//     application.payment.verifiedAt = new Date();

//     // ===============================
//     // 4️⃣ ISSUE RECEIPT (ONLY IF VERIFIED)
//     // ===============================
//     if (
//       status === "Verified" &&
//       (!application.receipt || !application.receipt.gcsPath)
//     ) {
//       // Build safe receipt payment payload
//       const receiptPayment = {
//         _id: application.payment._id || application._id,
//         reference: application.payment.reference,
//         amount: application.payment.amount || 0,
//         method: application.payment.method || "Manual",
//         status: "Verified",
//         verifiedAt: application.payment.verifiedAt,
//         category: "Application Fee",
//         description: "Application Payment",
//         student: application.applicant,
//       };

//       // Generate receipt PDF
//       const pdfPath = await generateReceiptPDF({
//         payment: receiptPayment,
//       });

//       // Upload receipt to GCS
//       const gcsPath = `receipts/Application_${
//         application._id
//       }_${Date.now()}.pdf`;
//       await uploadFile(pdfPath, gcsPath);

//       // Save receipt info
//       application.receipt = {
//         name: "Official Payment Receipt",
//         gcsPath,
//         gcsUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${gcsPath}`,
//         issuedAt: new Date(),
//       };

//       // Generate signed URL
//       const signedUrl = await generateSignedUrl(gcsPath);

//       // ===============================
//       // 📧 SEND EMAILS
//       // ===============================
//       const studentEmail =
//         application.applicant?.email || application.applicantEmail;

//       if (studentEmail) {
//         // Student email (PDF attachment)
//         await sendEmail({
//           to: studentEmail,
//           subject: "💳 Payment Verified – Official Receipt",
//           html: `
//             <p>Dear ${application.applicant.firstName || "Student"},</p>

//             <p>Your payment has been <strong>successfully verified</strong>.</p>

//             <p>
//               Your <strong>official receipt</strong> is attached to this email as a PDF.
//             </p>

//             <p>
//               You may also download it later from the portal:
//               <br/>
//               <a href="${signedUrl}">Download Receipt from Portal</a>
//             </p>

//             <br/>
//             <p>Regards,<br/>Finance Office</p>
//           `,
//           attachments: [
//             {
//               filename: "Official_Payment_Receipt.pdf",
//               path: pdfPath,
//               contentType: "application/pdf",
//             },
//           ],
//         });

//         // VC + Registrar email
//         await sendEmail({
//           to: ["officialkwina@gmail.com", "annebupe@gmail.com"],
//           subject: "📄 Payment Verified – Receipt Issued",
//           html: `
//             <p>A student payment has been <strong>verified</strong> and an official receipt has been issued.</p>

//             <p>
//               <strong>Student:</strong>
//               ${application.applicant.firstName} ${application.applicant.surname}
//             </p>

//             <p>
//               <strong>Amount:</strong>
//               ZMW ${application.payment.amount}
//             </p>

//             <p>
//               The official receipt is attached to this email.
//             </p>

//             <p>
//               Portal access:
//               <br/>
//               <a href="${signedUrl}">View Receipt in Portal</a>
//             </p>
//           `,
//           attachments: [
//             {
//               filename: `Receipt_${application._id}.pdf`,
//               path: pdfPath,
//               contentType: "application/pdf",
//             },
//           ],
//         });

//         console.log("📧 Receipt emails sent (Student, VC, Registrar)");
//       } else {
//         console.warn("⚠️ No student email found. Receipt email skipped.");
//       }
//     }

//     // ===============================
//     // 5️⃣ SAVE & EXIT
//     // ===============================
//     await application.save();

//     req.flash(
//       "success_msg",
//       status === "Verified"
//         ? "Payment verified, receipt issued, and emails sent."
//         : "Payment status updated successfully."
//     );

//     return res.redirect("/finance/applications");
//   } catch (error) {
//     console.error("❌ VERIFY PAYMENT ERROR:", error);
//     req.flash("error_msg", "Payment verification failed.");
//     return res.redirect("/finance/applications");
//   }
// };

// View / download receipt (Application)
exports.viewReceipt = async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);

    if (!app || !app.receipt || !app.receipt.gcsPath) {
      req.flash("error_msg", "Receipt not available.");
      return res.redirect("back");
    }

    // Generate a fresh signed URL every time
    const signedUrl = await generateSignedUrl(app.receipt.gcsPath);

    return res.redirect(signedUrl);
  } catch (err) {
    console.error("❌ VIEW RECEIPT ERROR:", err);
    req.flash("error_msg", "Unable to access receipt.");
    return res.redirect("back");
  }
};

// ===============================
// SHOW INITIATE PAYMENT FORM
// ===============================

exports.showInitiatePaymentForm = async (req, res) => {
  const students = await User.find({ role: "Student" })
    .select("firstName surname email")
    .sort({ surname: 1 });

  res.render("finance/initiatePayment", {
    title: "Initiate Payment",
    students,
    user: req.user,
  });
};

// Add a new endpoint for searching students
exports.searchStudents = async (req, res) => {
  try {
    const searchTerm = req.query.search || "";

    const students = await User.find({
      role: "Student",
      $or: [
        { firstName: { $regex: searchTerm, $options: "i" } },
        { surname: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { studentId: { $regex: searchTerm, $options: "i" } }, // if you have studentId field
      ],
    })
      .select("firstName surname email studentId")
      .limit(10)
      .sort({ surname: 1 });

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to search students" });
  }
};

// // ===============================
// // CREATE PAYMENT + AUTO RECEIPT - FIXED
// // ===============================
// exports.createPayment = async (req, res) => {
//   try {
//     const {
//       student,
//       category,
//       description,
//       amount,
//       method,
//       semester,
//       academicYear,
//       programme,
//     } = req.body;

//     if (!student || !category || !description || !amount || !method) {
//       req.flash("error_msg", "All required fields must be filled.");
//       return res.redirect("/finance/payments/new");
//     }

//     const payment = await Payment.create({
//       student,
//       category,
//       description,
//       amount,
//       method,
//       semester: semester || null,
//       academicYear: academicYear || null,
//       programme: programme || null,
//       status: "Verified",
//       verifiedBy: req.user._id,
//       verifiedAt: new Date(),
//     });

//     // Generate receipt
//     const populatedPayment = await Payment.findById(payment._id)
//       .populate("student")
//       .populate("programme");

//     const pdfPath = await generateReceiptPDF({
//       payment: populatedPayment,
//       application: null,
//     });

//     const gcsPath = `receipts/payment_${payment._id}_${Date.now()}.pdf`;
//     await uploadFile(pdfPath, gcsPath);

//     // ✅ FIX: Generate signed URL for payment receipts
//     const signedUrl = await generateSignedUrl(gcsPath);

//     payment.receipt = {
//       name: "Official Payment Receipt",
//       gcsPath,
//       gcsUrl: signedUrl, // ✅ Store signed URL instead of direct URL
//       issuedAt: new Date(),
//     };

//     await payment.save();

//     // Clean up temp file
//     const fs = require("fs");
//     if (fs.existsSync(pdfPath)) {
//       fs.unlinkSync(pdfPath);
//     }

//     req.flash("success_msg", "Payment created and receipt issued.");
//     res.redirect("/finance/payments");
//   } catch (err) {
//     console.error("Create payment error:", err);
//     req.flash("error_msg", "Failed to initiate payment.");
//     res.redirect("/finance/payments/new");
//   }
// };

// ===============================
// CREATE PAYMENT + AUTO RECEIPT
// // ===============================
// exports.createPayment = async (req, res) => {
//   try {
//     const {
//       student,
//       category,
//       description,
//       amount,
//       method,
//       semester,
//       academicYear,
//       programme,
//     } = req.body;

//     if (!student || !category || !description || !amount || !method) {
//       req.flash("error_msg", "All required fields must be filled.");
//       return res.redirect("/finance/payments/new");
//     }

//     // ===============================
//     // 1️⃣ CREATE PAYMENT (VERIFIED)
//     // ===============================
//     const payment = await Payment.create({
//       student,
//       category,
//       description,
//       amount,
//       method,
//       semester: semester || null,
//       academicYear: academicYear || null,
//       programme: programme || null,
//       status: "Verified",
//       verifiedBy: req.user._id,
//       verifiedAt: new Date(),
//     });

//     // ===============================
//     // 2️⃣ GENERATE RECEIPT
//     // ===============================
//     const populatedPayment = await Payment.findById(payment._id)
//       .populate("student")
//       .populate("programme");

//     const pdfPath = await generateReceiptPDF({
//       payment: populatedPayment,
//       application: null,
//     });

//     const gcsPath = `receipts/payment_${payment._id}_${Date.now()}.pdf`;
//     await uploadFile(pdfPath, gcsPath);

//     const signedUrl = await generateSignedUrl(gcsPath);

//     payment.receipt = {
//       name: "Official Payment Receipt",
//       gcsPath,
//       gcsUrl: signedUrl,
//       issuedAt: new Date(),
//     };

//     await payment.save();

//     // ===============================
//     // 3️⃣ SEND RECEIPT EMAILS
//     // ===============================
//     const studentEmail = populatedPayment.student?.email;

//     if (studentEmail) {
//       // Student email
//       await sendEmail({
//         to: studentEmail,
//         subject: "💳 Payment Received – Official Receipt",
//         html: `
//           <p>Dear ${populatedPayment.student.firstName || "Student"},</p>

//           <p>Your payment has been <strong>successfully received and verified</strong>.</p>

//           <p>
//             Your <strong>official receipt</strong> is attached to this email as a PDF.
//           </p>

//           <p>
//             You may also download it later from the portal:
//             <br/>
//             <a href="${signedUrl}">Download Receipt from Portal</a>
//           </p>

//           <br/>
//           <p>Regards,<br/>Finance Office</p>
//         `,
//         attachments: [
//           {
//             filename: "Official_Payment_Receipt.pdf",
//             path: pdfPath,
//             contentType: "application/pdf",
//           },
//         ],
//       });

//       // VC + Registrar email
//       await sendEmail({
//         to: ["officialkwina@gmail.com", "annebupe@gmail.com"],
//         subject: "📄 Payment Received – Receipt Issued",
//         html: `
//           <p>A student payment has been <strong>received and verified</strong>.</p>

//           <p>
//             <strong>Student:</strong>
//             ${populatedPayment.student.firstName}
//             ${populatedPayment.student.surname}
//           </p>

//           <p>
//             <strong>Amount:</strong>
//             ZMW ${populatedPayment.amount}
//           </p>

//           <p>
//             <strong>Category:</strong>
//             ${populatedPayment.category}
//           </p>

//           <p>
//             The official receipt is attached to this email.
//           </p>

//           <p>
//             Portal access:
//             <br/>
//             <a href="${signedUrl}">View Receipt in Portal</a>
//           </p>
//         `,
//         attachments: [
//           {
//             filename: `Receipt_${payment._id}.pdf`,
//             path: pdfPath,
//             contentType: "application/pdf",
//           },
//         ],
//       });

//       console.log("📧 Payment receipt emails sent (Student, VC, Registrar)");
//     }

//     // ===============================
//     // 4️⃣ CLEAN UP TEMP FILE
//     // ===============================
//     const fs = require("fs");
//     if (fs.existsSync(pdfPath)) {
//       fs.unlinkSync(pdfPath);
//     }

//     req.flash("success_msg", "Payment created and receipt issued.");
//     res.redirect("/finance/payments");
//   } catch (err) {
//     console.error("Create payment error:", err);
//     req.flash("error_msg", "Failed to initiate payment.");
//     res.redirect("/finance/payments/new");
//   }
// };

// ===============================
// CREATE PAYMENT + AUTO RECEIPT
// ===============================
//

exports.createPayment = async (req, res) => {
  try {
    // DEBUG logging
    console.log("DEBUG - Form data received");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file ? "File present" : "No file");

    const {
      student,
      category,
      description,
      amount,
      method,
      semester,
      academicYear,
      programme,
      totalDue,
      balanceAfterPayment,
    } = req.body;

    // Validate required fields
    if (
      !student ||
      !category ||
      !description ||
      !amount ||
      !method ||
      !totalDue
    ) {
      req.flash("error_msg", "All required fields must be filled.");
      return res.redirect("/finance/payments/new");
    }

    // Convert to numbers
    const numericTotalDue = parseFloat(totalDue);
    const numericAmount = parseFloat(amount);
    const numericBalance = parseFloat(balanceAfterPayment || 0);

    // Calculate balance if not provided
    const calculatedBalance = numericTotalDue - numericAmount;
    const finalBalance = isNaN(numericBalance)
      ? calculatedBalance
      : numericBalance;

    // Validate
    if (numericAmount > numericTotalDue) {
      req.flash("error_msg", "Payment amount cannot exceed total due.");
      return res.redirect("/finance/payments/new");
    }

    // ===============================
    // 1️⃣ CREATE PAYMENT
    // ===============================
    const payment = await Payment.create({
      student,
      category,
      description,
      amount: numericAmount,
      totalDue: numericTotalDue,
      balanceAfterPayment: finalBalance,
      method,
      semester: semester || null,
      academicYear: academicYear || null,
      programme: programme || null,
      status: "Verified",
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
    });

    // ===============================
    // 2️⃣ HANDLE PAYMENT PROOF UPLOAD
    // ===============================
    if (req.file) {
      try {
        const { uploadToGCS } = require("../config/gcsUpload");

        // Get student info for naming
        const Student = require("../models/User");
        const studentData = await Student.findById(student).select(
          "firstName surname"
        );

        const uploaded = await uploadToGCS(
          req.file,
          {
            firstName: studentData?.firstName || "Student",
            surname: studentData?.surname || "Unknown",
          },
          "PAYMENT",
          academicYear || new Date().getFullYear().toString()
        );

        // Use existing proofOfPayment field
        payment.proofOfPayment = {
          gcsUrl: uploaded.publicUrl,
          gcsPath: uploaded.path,
          uploadedAt: new Date(),
        };

        await payment.save();
        console.log("Payment proof uploaded successfully");
      } catch (uploadError) {
        console.error("Payment proof upload failed:", uploadError);
        // Continue without proof
      }
    }

    // ===============================
    // 3️⃣ GENERATE RECEIPT
    // ===============================
    const populatedPayment = await Payment.findById(payment._id)
      .populate("student")
      .populate("programme");

    const pdfPath = await generateReceiptPDF({
      payment: populatedPayment,
      application: null,
    });

    const gcsPath = `receipts/payment_${payment._id}_${Date.now()}.pdf`;
    await uploadFile(pdfPath, gcsPath);

    const signedUrl = await generateSignedUrl(gcsPath);

    payment.receipt = {
      name: "Official Payment Receipt",
      gcsPath,
      gcsUrl: signedUrl,
      issuedAt: new Date(),
    };

    await payment.save();

    // ===============================
    // 4️⃣ SEND EMAILS
    // ===============================
    const studentEmail = populatedPayment.student?.email;

    if (studentEmail) {
      // Student email
      await sendEmail({
        to: studentEmail,
        subject: "💳 Payment Received – Official Receipt",
        html: `
          <p>Dear ${populatedPayment.student.firstName || "Student"},</p>
          <p>Your payment has been <strong>successfully received and verified</strong>.</p>
          
          <p><strong>Amount Paid:</strong> ZMW ${numericAmount.toFixed(2)}</p>
          <p><strong>Total Due:</strong> ZMW ${numericTotalDue.toFixed(2)}</p>
          <p><strong>Balance Remaining:</strong> ZMW ${finalBalance.toFixed(
            2
          )}</p>
          
          <p>Your <strong>official receipt</strong> is attached to this email.</p>
          <p><a href="${signedUrl}">Download Receipt from Portal</a></p>
          
          ${
            finalBalance > 0
              ? `<p><strong>Note:</strong> You have an outstanding balance of ZMW ${finalBalance.toFixed(
                  2
                )}</p>`
              : ""
          }
          
          <p>Regards,<br/>Finance Office</p>
        `,
        attachments: [
          {
            filename: "Official_Payment_Receipt.pdf",
            path: pdfPath,
            contentType: "application/pdf",
          },
        ],
      });

      // // VC + Registrar email
      // await sendEmail({
      //   to: ["officialkwina@gmail.com", "annebupe@gmail.com"],
      //   subject: "📄 Payment Received – Receipt Issued",
      //   html: `
      //     <p>A student payment has been <strong>received and verified</strong>.</p>
      //     <p><strong>Student:</strong> ${populatedPayment.student.firstName} ${
      //     populatedPayment.student.surname
      //   }</p>
      //     <p><strong>Amount:</strong> ZMW ${populatedPayment.amount}</p>
      //     <p><strong>Category:</strong> ${populatedPayment.category}</p>
      //     <p><strong>Balance Due:</strong> ZMW ${finalBalance.toFixed(2)}</p>
      //     <p>The official receipt is attached.</p>
      //     <p><a href="${signedUrl}">View Receipt in Portal</a></p>
      //   `,
      //   attachments: [
      //     {
      //       filename: `Receipt_${payment._id}.pdf`,
      //       path: pdfPath,
      //       contentType: "application/pdf",
      //     },
      //   ],
      // });

      // console.log("📧 Payment receipt emails sent (Student, VC, Registrar)");

      console.log("📧 Payment receipt emails sent (Student)");
    }

    // ===============================
    // 5️⃣ CLEAN UP
    // ===============================
    const fs = require("fs");
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    req.flash(
      "success_msg",
      `Payment created successfully! Balance: ZMW ${finalBalance.toFixed(2)}`
    );
    res.redirect("/finance/payments");
  } catch (err) {
    console.error("Create payment error:", err);
    req.flash("error_msg", "Failed to initiate payment.");
    res.redirect("/finance/payments/new");
  }
};
// ===============================
// LIST ALL PAYMENTS
// ===============================
// exports.listPayments = async (req, res) => {
//   const payments = await Payment.find()
//     .populate("student", "firstName surname email")
//     .sort({ createdAt: -1 });

//   res.render("finance/payments", {
//     title: "All Payments",
//     payments,
//     user: req.user,
//   });
// };

// ===============================
// LIST ALL PAYMENTS (FINANCE)
// ===============================
exports.listPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    // 🔍 Search filter
    const query = {};
    if (search) {
      query.$or = [
        { category: new RegExp(search, "i") },
        { method: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
      ];
    }

    // 📄 Payments (paginated)
    const payments = await Payment.find(query)
      .populate("student", "firstName surname email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Payment.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // 📊 Summary calculations
    const now = new Date();

    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const sum = async (from) => {
      const res = await Payment.aggregate([
        { $match: { createdAt: { $gte: from } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      return res[0]?.total || 0;
    };

    const [totalToday, totalMonth, totalYear, totalAll] = await Promise.all([
      sum(startOfToday),
      sum(startOfMonth),
      sum(startOfYear),
      sum(new Date(0)),
    ]);

    res.render("finance/payments", {
      title: "All Payments",
      payments,
      user: req.user,

      // summary
      totalToday,
      totalMonth,
      totalYear,
      totalAll,

      today: new Date().toLocaleDateString(),
      monthRange: `${startOfMonth.toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
      yearRange: `${startOfYear.getFullYear()} - ${new Date().getFullYear()}`,

      // pagination + search
      currentPage: page,
      totalPages,
      limit,
      search,
    });
  } catch (err) {
    console.error("List payments error:", err);
    req.flash("error_msg", "Failed to load payments.");
    res.redirect("/dashboard");
  }
};

// ===============================
// VIEW PAYMENT RECEIPT (OPTION A)
// ===============================
exports.viewPaymentReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment || !payment.receipt || !payment.receipt.gcsPath) {
      req.flash("error_msg", "Receipt not available.");
      return res.redirect("back");
    }

    // ✅ Generate a fresh signed URL every time
    const signedUrl = await generateSignedUrl(payment.receipt.gcsPath);

    // ✅ Redirect browser to GCS (download / view)
    return res.redirect(signedUrl);
  } catch (error) {
    console.error("View payment receipt error:", error);
    req.flash("error_msg", "Failed to access receipt.");
    return res.redirect("back");
  }
};
