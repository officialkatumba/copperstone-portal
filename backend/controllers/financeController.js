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

exports.verifyPayment = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    // ===============================
    // 1️⃣ LOAD APPLICATION
    // ===============================
    const application = await Application.findById(req.params.id)
      .populate("applicant")
      .exec();

    if (!application) {
      req.flash("error_msg", "Application not found.");
      return res.redirect("/finance/applications");
    }

    // ===============================
    // 2️⃣ ENSURE PAYMENT OBJECT EXISTS
    // ===============================
    if (!application.payment) {
      application.payment = {};
    }

    // ===============================
    // 3️⃣ UPDATE PAYMENT STATUS
    // ===============================
    application.payment.status = status;
    application.payment.remarks = remarks || "";
    application.payment.verifiedBy = req.user._id;
    application.payment.verifiedAt = new Date();

    // ===============================
    // 4️⃣ ISSUE RECEIPT (ONLY ON VERIFIED)
    // ===============================
    if (status === "Verified") {
      // Prevent double issuing
      if (!application.receipt || !application.receipt.gcsPath) {
        // 🔐 Build SAFE payment payload
        const receiptPayment = {
          _id: application.payment._id || application._id,
          reference: application.payment.reference,
          amount: application.payment.amount || 0,
          method: application.payment.method || "Manual",
          status: "Verified",
          verifiedAt: application.payment.verifiedAt,

          category: "Application Fee",
          description: "Application Payment",

          student: application.applicant,
        };

        // Generate receipt PDF
        const pdfPath = await generateReceiptPDF({
          payment: receiptPayment,
        });

        // Upload to GCS
        const gcsPath = `receipts/Application_${
          application._id
        }_${Date.now()}.pdf`;
        await uploadFile(pdfPath, gcsPath);

        // Attach receipt
        application.receipt = {
          name: "Official Payment Receipt",
          gcsPath,
          gcsUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${gcsPath}`,
          issuedAt: new Date(),
        };

        // ===============================
        // 📧 SEND RECEIPT EMAILS
        // ===============================
        const signedUrl = await generateSignedUrl(application.receipt.gcsPath);

        const studentEmail =
          application.applicant?.email || application.applicantEmail;

        if (studentEmail) {
          // Student email
          await sendEmail({
            to: studentEmail,
            subject: "💳 Payment Verified – Official Receipt",
            html: `
              <p>Dear ${application.applicant.firstName || "Student"},</p>
              <p>Your payment has been <strong>successfully verified</strong>.</p>
              <p>
                <a href="${signedUrl}">Download your official receipt</a>
              </p>
              <br/>
              <p>Regards,<br/>Finance Office</p>
            `,
          });

          // VC + Registrar
          await sendEmail({
            to: ["officialkwina@gmail.com", "annebupe@gmail.com"],
            subject: "📄 Payment Verified – Receipt Issued",
            html: `
              <p>A payment has been verified and a receipt has been issued.</p>
              <p><strong>Student:</strong> ${application.applicant.firstName} ${application.applicant.surname}</p>
              <p><strong>Amount:</strong> ${application.payment.amount}</p>
              <p><a href="${signedUrl}">View Receipt</a></p>
            `,
          });

          console.log("📧 Receipt emails sent (Student, VC, Registrar)");
        } else {
          console.warn("⚠️ No student email found. Receipt email skipped.");
        }
      }
    }

    // ===============================
    // 5️⃣ SAVE & EXIT
    // ===============================
    await application.save();

    req.flash(
      "success_msg",
      status === "Verified"
        ? "Payment verified, receipt issued, and emails sent."
        : "Payment status updated successfully."
    );

    return res.redirect("/finance/applications");
  } catch (error) {
    console.error("❌ VERIFY PAYMENT ERROR:", error);
    req.flash("error_msg", "Payment verification failed.");
    return res.redirect("/finance/applications");
  }
};

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

// ===============================
// CREATE PAYMENT + AUTO RECEIPT
// ===============================

// ===============================
// CREATE PAYMENT + AUTO RECEIPT - FIXED
// ===============================
exports.createPayment = async (req, res) => {
  try {
    const {
      student,
      category,
      description,
      amount,
      method,
      semester,
      academicYear,
      programme,
    } = req.body;

    if (!student || !category || !description || !amount || !method) {
      req.flash("error_msg", "All required fields must be filled.");
      return res.redirect("/finance/payments/new");
    }

    const payment = await Payment.create({
      student,
      category,
      description,
      amount,
      method,
      semester: semester || null,
      academicYear: academicYear || null,
      programme: programme || null,
      status: "Verified",
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
    });

    // Generate receipt
    const populatedPayment = await Payment.findById(payment._id)
      .populate("student")
      .populate("programme");

    const pdfPath = await generateReceiptPDF({
      payment: populatedPayment,
      application: null,
    });

    const gcsPath = `receipts/payment_${payment._id}_${Date.now()}.pdf`;
    await uploadFile(pdfPath, gcsPath);

    // ✅ FIX: Generate signed URL for payment receipts
    const signedUrl = await generateSignedUrl(gcsPath);

    payment.receipt = {
      name: "Official Payment Receipt",
      gcsPath,
      gcsUrl: signedUrl, // ✅ Store signed URL instead of direct URL
      issuedAt: new Date(),
    };

    await payment.save();

    // Clean up temp file
    const fs = require("fs");
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    req.flash("success_msg", "Payment created and receipt issued.");
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
exports.listPayments = async (req, res) => {
  const payments = await Payment.find()
    .populate("student", "firstName surname email")
    .sort({ createdAt: -1 });

  res.render("finance/payments", {
    title: "All Payments",
    payments,
    user: req.user,
  });
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
