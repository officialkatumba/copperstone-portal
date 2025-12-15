// backend/controllers/financeController.js
// const Application = require("../models/Application");
// const { generateSignedUrl } = require("../config/gcsUpload");
// const { generateReceiptPDF } = require("../utils/receiptPDFGenerator");
// const { uploadFile } = require("../utils/gcs");
// const Payment = require("../models/Payment");

// backend/controllers/financeController.js
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
//     const { status, remarks } = req.body; // status = Verified / Rejected
//     const app = await Application.findById(req.params.id);

//     if (!app) {
//       req.flash("error_msg", "Application not found.");
//       return res.redirect("/finance/applications");
//     }

//     app.payment.status = status;
//     app.payment.remarks = remarks || "";
//     app.payment.verifiedBy = req.user._id;
//     app.payment.verifiedAt = new Date();
//     await app.save();

//     req.flash("success_msg", `Payment marked as ${status}.`);
//     res.redirect("/finance/applications");
//   } catch (err) {
//     console.error("Verify payment error:", err);
//     req.flash("error_msg", "Failed to verify payment.");
//     res.redirect("/finance/applications");
//   }
// };

// // exports.verifyPayment = async (req, res) => {
// //   try {
// //     const { status, remarks } = req.body;

// //     const app = await Application.findById(req.params.id).populate("applicant");

// //     if (!app) {
// //       req.flash("error_msg", "Application not found.");
// //       return res.redirect("/finance/applications");
// //     }

// //     app.payment.status = status;
// //     app.payment.remarks = remarks || "";
// //     app.payment.verifiedBy = req.user._id;
// //     app.payment.verifiedAt = new Date();

// exports.verifyPayment = async (req, res) => {
//   try {
//     const { status, remarks } = req.body;

//     const app = await Application.findById(req.params.id).populate("applicant");

//     if (!app) {
//       req.flash("error_msg", "Application not found.");
//       return res.redirect("/finance/applications");
//     }

//     // ✅ INITIALIZE PAYMENT IF MISSING
//     if (!app.payment) {
//       app.payment = {};
//     }

//     app.payment.status = status;
//     app.payment.remarks = remarks || "";
//     app.payment.verifiedBy = req.user._id;
//     app.payment.verifiedAt = new Date();

//     // ✅ ISSUE RECEIPT ONLY WHEN VERIFIED
//     if (status === "Verified") {
//       const pdfPath = await generateReceiptPDF({
//         application: app,
//         payment: app.payment,
//       });

//       const gcsPath = `receipts/Receipt_${app._id}_${Date.now()}.pdf`;
//       await uploadFile(pdfPath, gcsPath);

//       app.receipt = {
//         name: "Official Payment Receipt",
//         gcsPath,
//         gcsUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${gcsPath}`,
//         issuedAt: new Date(),
//       };
//     }

//     await app.save();
//     req.flash("success_msg", "Payment verified and receipt issued.");
//     res.redirect("/finance/applications");
//   } catch (err) {
//     console.error(err);
//     req.flash("error_msg", "Payment verification failed.");
//     res.redirect("/finance/applications");
//   }
// };

// const Application = require("../models/Application");
// const { generateReceiptPDF } = require("../utils/receiptPDFGenerator");
// const { uploadFile } = require("../utils/gcsUploader");

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
      // Prevent double-issuing receipts
      if (!application.receipt || !application.receipt.gcsPath) {
        // 🔐 Build SAFE payment payload for receipt generator
        const receiptPayment = {
          _id: application.payment._id || application._id,
          reference: application.payment.reference,
          amount: application.payment.amount || 0,
          method: application.payment.method || "Manual",
          status: "Verified",
          verifiedAt: application.payment.verifiedAt,

          // Defaults for application payments
          category: "Application Fee",
          description: "Application Payment",

          // Student info (VERY IMPORTANT)
          student: application.applicant,
        };

        // Generate PDF
        const pdfPath = await generateReceiptPDF({
          payment: receiptPayment,
        });

        // Upload to GCS
        const gcsPath = `receipts/Application_${
          application._id
        }_${Date.now()}.pdf`;
        await uploadFile(pdfPath, gcsPath);

        // Attach receipt to application
        application.receipt = {
          name: "Official Payment Receipt",
          gcsPath,
          gcsUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${gcsPath}`,
          issuedAt: new Date(),
        };
      }
    }

    // ===============================
    // 5️⃣ SAVE & EXIT
    // ===============================
    await application.save();

    req.flash(
      "success_msg",
      status === "Verified"
        ? "Payment verified and receipt issued successfully."
        : "Payment status updated successfully."
    );

    return res.redirect("/finance/applications");
  } catch (error) {
    console.error("❌ VERIFY PAYMENT ERROR:", error);

    req.flash("error_msg", "Payment verification failed.");
    return res.redirect("/finance/applications");
  }
};

// View / download receipt
exports.viewReceipt = async (req, res) => {
  const app = await Application.findById(req.params.id);

  if (!app?.receipt?.gcsPath) {
    req.flash("error_msg", "Receipt not available.");
    return res.redirect("back");
  }

  const signedUrl = await generateSignedUrl(app.receipt.gcsPath);
  return res.redirect(signedUrl);
};

// ===============================
// SHOW INITIATE PAYMENT FORM
// ===============================
// exports.showInitiatePaymentForm = async (req, res) => {
//   const students = await User.find({ role: "Student" })
//     .select("firstName surname email")
//     .sort({ surname: 1 });

//   res.render("finance/initiatePayment", {
//     title: "Initiate Payment",
//     students,
//     user: req.user,
//   });
// };

// financeController.js
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

//     payment.receipt = {
//       name: "Official Payment Receipt",
//       gcsPath,
//       gcsUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET_NAME}/${gcsPath}`,
//       issuedAt: new Date(),
//     };

//     await payment.save();

//     req.flash("success_msg", "Payment created and receipt issued.");
//     res.redirect("/finance/payments");
//   } catch (err) {
//     console.error("Create payment error:", err);
//     req.flash("error_msg", "Failed to initiate payment.");
//     res.redirect("/finance/payments/new");
//   }
// };

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
// VIEW PAYMENT RECEIPT
// ===============================
// exports.viewPaymentReceipt = async (req, res) => {
//   const payment = await Payment.findById(req.params.id);

//   if (!payment?.receipt?.gcsPath) {
//     req.flash("error_msg", "Receipt not available.");
//     return res.redirect("back");
//   }

//   const signedUrl = await generateSignedUrl(payment.receipt.gcsPath);
//   res.redirect(signedUrl);
// };

// ===============================
// VIEW PAYMENT RECEIPT - FIXED
// ===============================
exports.viewPaymentReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment?.receipt?.gcsPath) {
      req.flash("error_msg", "Receipt not available.");
      return res.redirect("back");
    }

    // ✅ Always generate fresh signed URL when accessed
    const signedUrl = await generateSignedUrl(payment.receipt.gcsPath);

    // Option A: Redirect to signed URL (browser downloads)
    return res.redirect(signedUrl);

    // OR Option B: Stream the file directly (better)
    // const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
    // const file = bucket.file(payment.receipt.gcsPath);
    // const [exists] = await file.exists();
    // if (!exists) {
    //   req.flash("error_msg", "Receipt file not found.");
    //   return res.redirect("back");
    // }
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', `attachment; filename="payment_receipt_${payment._id}.pdf"`);
    // file.createReadStream().pipe(res);
  } catch (error) {
    console.error("View payment receipt error:", error);
    req.flash("error_msg", "Failed to access receipt.");
    return res.redirect("back");
  }
};
