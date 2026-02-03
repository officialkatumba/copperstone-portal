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
    // if (
    //   action === "Verified" &&
    //   (!payment.receipt || !payment.receipt.gcsPath)
    // ) {
    //   console.log("🔍 DEBUG - Generating receipt for verified payment");
    //   // Generate receipt PDF
    //   const pdfPath = await generateReceiptPDF({
    //     payment: {
    //       _id: payment._id,
    //       reference: payment.reference,
    //       amount: payment.amount,
    //       method: payment.method,
    //       status: "Verified",
    //       verifiedAt: payment.verifiedAt,
    //       category: payment.category,
    //       description: payment.description,
    //       student: payment.student,
    //     },
    //   });

    // ===============================
    // 3️⃣ ISSUE RECEIPT (ONLY IF VERIFIED)
    // ===============================
    if (
      action === "Verified" &&
      (!payment.receipt || !payment.receipt.gcsPath)
    ) {
      console.log("🔍 DEBUG - Generating receipt for verified payment");

      // ===============================
      // 3a️⃣ GET APPLICATION DATA FOR RECEIPT
      // ===============================
      let applicationData = null;
      if (payment.application) {
        try {
          const Application = require("../models/Application");
          applicationData = await Application.findById(payment.application)
            .populate("firstChoice", "name code")
            .populate("secondChoice", "name code")
            .lean();
        } catch (err) {
          console.log(
            "Could not load application data for receipt:",
            err.message,
          );
        }
      }

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
        application: applicationData,
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
        : "Payment status updated successfully.",
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

// CREATE PAYMENT (Finance Controller - Updated)
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
      paymentReceivedOn,
      modeOfStudy, // ADD THIS: Mode of Study field
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

    // Parse payment received date (actual bank deposit date)
    let parsedReceivedDate = new Date(); // Default to now
    if (paymentReceivedOn) {
      parsedReceivedDate = new Date(paymentReceivedOn);
      // Validate date is not in the future
      if (parsedReceivedDate > new Date()) {
        req.flash(
          "error_msg",
          "Payment received date cannot be in the future.",
        );
        return res.redirect("/finance/payments/new");
      }
    }

    // ===============================
    // 1️⃣ GET STUDENT ACADEMIC INFORMATION
    // ===============================
    const studentData = await User.findById(student)
      .select("firstName surname email studentId programme modeOfStudy")
      .populate("programme", "name code");

    if (!studentData) {
      req.flash("error_msg", "Student not found.");
      return res.redirect("/finance/payments/new");
    }

    // Get programme details
    const programmeData = studentData.programme || {
      name: "Not Assigned",
      code: "N/A",
    };
    const studentModeOfStudy =
      studentData.modeOfStudy || modeOfStudy || "Full Time";

    // Generate reference number (like application controller)
    const reference = `PAY-${Date.now().toString().slice(-8)}`;

    // ===============================
    // 2️⃣ CREATE PAYMENT
    // ===============================
    const payment = await Payment.create({
      student: studentData._id,
      category,
      description,
      amount: numericAmount,
      totalDue: numericTotalDue,
      balanceAfterPayment: finalBalance,
      method,
      semester: semester || null,
      academicYear: academicYear || null,
      programme: programmeData._id || programme || null,
      modeOfStudy: studentModeOfStudy, // ADD: Save mode of study
      reference: reference, // Use generated reference
      currency: "ZMW",
      status: "Verified",
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      paymentReceivedOn: parsedReceivedDate,
    });

    console.log("DEBUG - Payment created:", {
      id: payment._id,
      reference: payment.reference,
      studentName: `${studentData.firstName} ${studentData.surname}`,
      programme: programmeData.name,
      modeOfStudy: studentModeOfStudy,
    });

    // ===============================
    // 3️⃣ HANDLE PAYMENT PROOF UPLOAD
    // ===============================
    if (req.file) {
      try {
        const { uploadToGCS } = require("../config/gcsUpload");

        const uploaded = await uploadToGCS(
          req.file,
          {
            firstName: studentData.firstName,
            surname: studentData.surname,
          },
          "PAYMENT",
          academicYear || new Date().getFullYear().toString(),
        );

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
    // 4️⃣ GENERATE RECEIPT WITH ACADEMIC INFO
    // ===============================
    const populatedPayment = await Payment.findById(payment._id)
      .populate("student", "firstName surname email studentId")
      .populate("verifiedBy", "firstName surname");

    // Prepare academic information for receipt
    const academicInfo = {
      programme: programmeData.name,
      programmeCode: programmeData.code,
      modeOfStudy: studentModeOfStudy,
      semester: semester || "Not Specified",
      academicYear: academicYear || new Date().getFullYear().toString(),
    };

    console.log("DEBUG - Academic info for receipt:", academicInfo);

    // Generate receipt with academic info and reference as receipt number
    // const pdfPath = await generateReceiptPDF({
    //   payment: {
    //     _id: populatedPayment._id,
    //     reference: populatedPayment.reference, // This becomes the receipt number
    //     amount: populatedPayment.amount,
    //     method: populatedPayment.method,
    //     status: populatedPayment.status,
    //     verifiedAt: populatedPayment.verifiedAt,
    //     paymentReceivedOn: populatedPayment.paymentReceivedOn,
    //     category: populatedPayment.category,
    //     description: populatedPayment.description,
    //     totalDue: populatedPayment.totalDue,
    //     balanceAfterPayment: populatedPayment.balanceAfterPayment,
    //     student: populatedPayment.student,
    //     verifiedBy: populatedPayment.verifiedBy,
    //   },
    //   academicInfo: academicInfo, // Pass academic info separately
    // });

    // In the createPayment function, update the generateReceiptPDF call:

    // Generate receipt with academic info and reference as receipt number
    const pdfPath = await generateReceiptPDF({
      payment: {
        _id: populatedPayment._id,
        reference: populatedPayment.reference, // This becomes the receipt number
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
        verifiedBy: populatedPayment.verifiedBy,
        // Add academic fields directly to payment object
        programme: programmeData, // Pass the populated programme object
        modeOfStudy: studentModeOfStudy,
        semester: semester || null,
        academicYear: academicYear || null,
      },
      academicInfo: {
        // Also pass as separate object for clarity
        programme: programmeData.name,
        programmeCode: programmeData.code,
        modeOfStudy: studentModeOfStudy,
        semester: semester || "",
        academicYear: academicYear || new Date().getFullYear().toString(),
      },
    });

    const gcsPath = `receipts/payment_${payment.reference}_${Date.now()}.pdf`;
    await uploadFile(pdfPath, gcsPath);

    const signedUrl = await generateSignedUrl(gcsPath);

    // Update payment with receipt info (use reference as receipt number)
    payment.receipt = {
      receiptNumber: payment.reference, // Use reference as receipt number
      name: "Official Payment Receipt",
      gcsPath,
      gcsUrl: signedUrl,
      issuedAt: new Date(),
      academicInfo: academicInfo, // Store academic info with receipt
    };

    await payment.save();

    console.log("DEBUG - Receipt generated:", {
      receiptNumber: payment.receipt.receiptNumber,
      gcsPath: payment.receipt.gcsPath,
    });

    // ===============================
    // 5️⃣ SEND EMAILS WITH ACADEMIC INFO
    // ===============================
    const studentEmail = populatedPayment.student?.email;

    if (studentEmail) {
      // Format dates for email
      const receiptDate = new Date().toLocaleDateString();
      const depositDate = populatedPayment.paymentReceivedOn
        ? new Date(populatedPayment.paymentReceivedOn).toLocaleDateString()
        : receiptDate;

      await sendEmail({
        to: studentEmail,
        subject: "💳 Payment Received – Official Receipt",
        html: `
          <p>Dear ${populatedPayment.student.firstName || "Student"},</p>
          <p>Your payment has been <strong>successfully received and verified</strong>.</p>
          
          <!-- ACADEMIC INFORMATION -->
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4 style="margin-top: 0; color: #2c3e50;">Academic Information</h4>
            <p><strong>Programme:</strong> ${academicInfo.programme} (${academicInfo.programmeCode})</p>
            <p><strong>Mode of Study:</strong> ${academicInfo.modeOfStudy}</p>
            <p><strong>Semester:</strong> ${academicInfo.semester}</p>
            <p><strong>Academic Year:</strong> ${academicInfo.academicYear}</p>
          </div>
          
          <!-- PAYMENT INFORMATION -->
          <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h4 style="margin-top: 0; color: #2c3e50;">Payment Information</h4>
            <p><strong>Receipt Number:</strong> ${payment.reference}</p>
            <p><strong>Amount Paid:</strong> ZMW ${numericAmount.toFixed(2)}</p>
            <p><strong>Total Due:</strong> ZMW ${numericTotalDue.toFixed(2)}</p>
            <p><strong>Balance Remaining:</strong> ZMW ${finalBalance.toFixed(2)}</p>
            <p><strong>Payment Method:</strong> ${method}</p>
            <p><strong>Date Deposited:</strong> ${depositDate}</p>
            <p><strong>Date Verified:</strong> ${receiptDate}</p>
          </div>
          
          <p>Your <strong>official receipt</strong> is attached to this email.</p>
          <p><a href="${signedUrl}" style="background-color: #3498db; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">Download Receipt from Portal</a></p>
          
          ${
            finalBalance > 0
              ? `<div style="background-color: #fff3cd; padding: 10px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #ffc107;">
                  <p style="margin: 0;"><strong>Note:</strong> You have an outstanding balance of ZMW ${finalBalance.toFixed(2)}</p>
                </div>`
              : `<div style="background-color: #d1ecf1; padding: 10px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #0c5460;">
                  <p style="margin: 0;"><strong>Payment Status:</strong> Fully Paid ✅</p>
                </div>`
          }
          
          <p>Regards,<br/>Finance Office</p>
        `,
        attachments: [
          {
            filename: `Receipt_${payment.reference}.pdf`, // Use reference in filename
            path: pdfPath,
            contentType: "application/pdf",
          },
        ],
      });

      console.log("📧 Payment receipt email sent to student");
    }

    // ===============================
    // 6️⃣ CLEAN UP
    // ===============================
    const fs = require("fs");
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }

    req.flash(
      "success_msg",
      `Payment created successfully! Receipt #${payment.reference} issued. Balance: ZMW ${finalBalance.toFixed(2)}`,
    );
    res.redirect("/finance/payments");
  } catch (err) {
    console.error("Create payment error:", err);
    req.flash("error_msg", "Failed to initiate payment.");
    res.redirect("/finance/payments/new");
  }
};

// ===============================
// LIST ALL PAYMENTS (FINANCE)
// ===============================
exports.listPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20; // START AT 20
    const search = (req.query.search || "").trim();
    const category = (req.query.category || "").trim();

    const skip = (page - 1) * limit;

    // ============================
    // BUILD QUERY
    // ============================
    const query = {};

    // CATEGORY FILTER
    if (category) {
      query.category = category;
    }

    // STUDENT SEARCH (name OR email)
    if (search) {
      const students = await User.find({
        role: "Student",
        $or: [
          { firstName: new RegExp(search, "i") },
          { surname: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
        ],
      }).select("_id");

      query.student = { $in: students.map((s) => s._id) };
    }

    // ============================
    // PAYMENTS
    // ============================
    const payments = await Payment.find(query)
      .populate("student", "firstName surname email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Payment.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // ============================
    // SUMMARY TOTALS
    // ============================
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const sum = async (from) => {
      const r = await Payment.aggregate([
        { $match: { createdAt: { $gte: from } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);
      return r.length ? r[0].total : 0;
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

      // summary
      totalToday,
      totalMonth,
      totalYear,
      totalAll,

      today: new Date().toLocaleDateString(),
      monthRange: `${startOfMonth.toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
      yearRange: `${startOfYear.getFullYear()} - ${new Date().getFullYear()}`,

      // filters
      search,
      category,

      // pagination
      currentPage: page,
      totalPages,
      totalCount,
      limit,

      user: req.user,
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

//Cancel receipt

// Update the cancelReceipt function in financeController.js
exports.cancelReceipt = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { cancelReason } = req.body;

    // ===============================
    // 1️⃣ LOAD PAYMENT
    // ===============================
    const payment = await Payment.findById(paymentId)
      .populate("student", "firstName surname email")
      .exec();

    if (!payment) {
      req.flash("error_msg", "Payment not found.");
      return res.redirect("/finance/payments");
    }

    // ===============================
    // 2️⃣ VALIDATE CAN BE CANCELLED
    // ===============================
    if (!payment.receipt || !payment.receipt.gcsPath) {
      req.flash("error_msg", "No receipt found to cancel.");
      return res.redirect("/finance/payments");
    }

    if (payment.status === "Cancelled") {
      req.flash("error_msg", "Receipt is already cancelled.");
      return res.redirect("/finance/payments");
    }

    // ===============================
    // 3️⃣ STORE CANCELLATION INFO
    // ===============================
    payment.previousStatus = payment.status; // Store what status it was before
    payment.status = "Cancelled";
    payment.cancellationReason = cancelReason || "No reason provided";
    payment.cancelledBy = req.user._id;
    payment.cancelledAt = new Date();
    payment.updatedAt = new Date();

    // Clear receipt data
    payment.receipt = null;

    // ===============================
    // 4️⃣ SAVE PAYMENT
    // ===============================
    await payment.save();

    // ===============================
    // 5️⃣ OPTIONAL: SEND NOTIFICATION EMAIL
    // ===============================
    const studentEmail = payment.student?.email;
    if (studentEmail) {
      await sendEmail({
        to: studentEmail,
        subject: "❌ Payment Receipt Cancelled",
        html: `
          <p>Dear ${payment.student.firstName || "Student"},</p>
          <p>Your payment receipt has been <strong>cancelled</strong> by the finance office.</p>
          
          <p><strong>Reason:</strong> ${cancelReason || "Not specified"}</p>
          <p><strong>Original Amount:</strong> ZMW ${payment.amount.toFixed(
            2,
          )}</p>
          <p><strong>Payment Date:</strong> ${payment.createdAt.toLocaleDateString()}</p>
          
          <p>You will need to make a new payment to complete this transaction.</p>
          <p>Please contact the finance office if you have any questions.</p>
          
          <br/>
          <p>Regards,<br/>Finance Office</p>
        `,
      });
      console.log("📧 Cancellation email sent to student");
    }

    // ===============================
    // 6️⃣ SUCCESS REDIRECT
    // ===============================
    req.flash(
      "success_msg",
      "Receipt cancelled successfully. Payment status updated to 'Cancelled'.",
    );
    return res.redirect("/finance/payments");
  } catch (error) {
    console.error("❌ CANCEL RECEIPT ERROR:", error);
    req.flash("error_msg", "Failed to cancel receipt.");
    return res.redirect("/finance/payments");
  }
};

// ===============================
// FINANCE REPORTS FEATURE
// ===============================

// Show reports page
exports.showReportsPage = async (req, res) => {
  try {
    res.render("finance/reports", {
      title: "Finance Reports",
      user: req.user,
      today: new Date().toISOString().split("T")[0], // For date input max attribute
    });
  } catch (err) {
    console.error("Show reports error:", err);
    req.flash("error_msg", "Could not load reports page.");
    res.redirect("/dashboard/finance");
  }
};

// Generate payment report
exports.generatePaymentReport = async (req, res) => {
  try {
    const { startDate, endDate, outputFormat = "html" } = req.query;

    // Default to current month if no dates provided
    const defaultStartDate = new Date();
    defaultStartDate.setDate(1); // First day of current month

    const defaultEndDate = new Date();

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    // Build query for date range
    const query = {
      createdAt: {
        $gte: start,
        $lte: end,
      },
    };

    // Fetch payments with population
    const payments = await Payment.find(query)
      .populate("student", "firstName surname email studentId")
      .populate("verifiedBy", "firstName surname")
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary statistics
    const summary = payments.reduce(
      (acc, payment) => {
        const category = payment.category || "Uncategorized";

        if (!acc.categories[category]) {
          acc.categories[category] = {
            count: 0,
            totalAmount: 0,
            payments: [],
          };
        }

        acc.categories[category].count++;
        acc.categories[category].totalAmount += payment.amount;
        acc.categories[category].payments.push(payment);

        acc.totalAmount += payment.amount;
        acc.totalPayments++;

        // Count by status
        acc.statusCount[payment.status] =
          (acc.statusCount[payment.status] || 0) + 1;

        return acc;
      },
      {
        totalAmount: 0,
        totalPayments: 0,
        categories: {},
        statusCount: {},
      },
    );

    // Calculate category percentages
    for (const category in summary.categories) {
      summary.categories[category].percentage = (
        (summary.categories[category].totalAmount / summary.totalAmount) *
        100
      ).toFixed(1);
    }

    // Format dates for display
    const formattedStart = start.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const formattedEnd = end.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // Prepare data for response
    const reportData = {
      payments,
      summary,
      dateRange: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
        formattedStart,
        formattedEnd,
      },
      generatedAt: new Date().toLocaleString(),
    };

    // If PDF output requested
    if (outputFormat === "pdf") {
      // Generate PDF report
      const pdfPath = await generatePaymentReportPDF(reportData);

      // Generate signed URL for download
      const gcsPath = `reports/payment_report_${Date.now()}.pdf`;
      await uploadFile(pdfPath, gcsPath);
      const signedUrl = await generateSignedUrl(gcsPath);

      // Clean up temp file
      const fs = require("fs");
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }

      return res.json({
        success: true,
        message: "PDF report generated successfully",
        downloadUrl: signedUrl,
        reportData: {
          dateRange: `${formattedStart} to ${formattedEnd}`,
          totalPayments: summary.totalPayments,
          totalAmount: summary.totalAmount.toFixed(2),
        },
      });
    }

    // HTML output (render page)
    res.render("finance/reportResults", {
      title: "Payment Report",
      user: req.user,
      reportData,
      outputFormat: "html",
    });
  } catch (err) {
    console.error("Generate report error:", err);

    if (req.query.outputFormat === "pdf") {
      return res.status(500).json({
        success: false,
        error: "Failed to generate PDF report",
      });
    }

    req.flash("error_msg", "Failed to generate report.");
    res.redirect("/finance/reports");
  }
};

// Helper function to generate PDF report
async function generatePaymentReportPDF(reportData) {
  const PDFDocument = require("pdfkit");
  const fs = require("fs");
  const path = require("path");

  // Create temp file path
  const tempDir = path.join(__dirname, "../temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const pdfPath = path.join(tempDir, `payment_report_${Date.now()}.pdf`);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Add header
      doc.fontSize(20).text("Payment Report", { align: "center" });
      doc.moveDown(0.5);
      doc
        .fontSize(12)
        .text(
          `Date Range: ${reportData.dateRange.formattedStart} to ${reportData.dateRange.formattedEnd}`,
          { align: "center" },
        );
      doc
        .fontSize(10)
        .text(`Generated: ${reportData.generatedAt}`, { align: "center" });
      doc.moveDown();

      // Summary section
      doc.fontSize(14).text("SUMMARY", { underline: true });
      doc.moveDown(0.5);

      doc
        .fontSize(11)
        .text(`Total Payments: ${reportData.summary.totalPayments}`);
      doc.text(
        `Total Amount: ZMW ${reportData.summary.totalAmount.toFixed(2)}`,
      );
      doc.moveDown();

      // Category breakdown
      doc.fontSize(14).text("CATEGORY BREAKDOWN", { underline: true });
      doc.moveDown(0.5);

      let yPos = doc.y;
      for (const [category, data] of Object.entries(
        reportData.summary.categories,
      )) {
        doc.fontSize(10).text(`${category}:`, { continued: true });
        doc.text(
          ` ${data.count} payments, ZMW ${data.totalAmount.toFixed(2)} (${data.percentage}%)`,
        );
        yPos = doc.y;
      }

      doc.moveDown();

      // Status breakdown
      doc.fontSize(14).text("STATUS BREAKDOWN", { underline: true });
      doc.moveDown(0.5);

      for (const [status, count] of Object.entries(
        reportData.summary.statusCount,
      )) {
        doc.fontSize(10).text(`${status}: ${count}`);
      }

      doc.moveDown();

      // Detailed payments table
      doc.fontSize(14).text("DETAILED PAYMENTS", { underline: true });
      doc.moveDown(0.5);

      // Table headers
      const tableTop = doc.y;
      const colWidths = [80, 100, 80, 60, 80];
      const headers = ["Date", "Student", "Category", "Amount", "Status"];

      doc.fontSize(9).font("Helvetica-Bold");
      headers.forEach((header, i) => {
        doc.text(
          header,
          50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
          tableTop,
          {
            width: colWidths[i],
            align: "left",
          },
        );
      });

      doc.moveDown(0.5);

      // Table rows
      doc.font("Helvetica");
      let currentY = doc.y;

      reportData.payments.forEach((payment, index) => {
        if (currentY > 700) {
          // Page break check
          doc.addPage();
          currentY = 50;
        }

        const row = [
          new Date(payment.createdAt).toLocaleDateString(),
          payment.student
            ? `${payment.student.firstName} ${payment.student.surname}`
            : "N/A",
          payment.category,
          `ZMW ${payment.amount.toFixed(2)}`,
          payment.status,
        ];

        row.forEach((cell, i) => {
          doc
            .fontSize(9)
            .text(
              cell,
              50 + colWidths.slice(0, i).reduce((a, b) => a + b, 0),
              currentY,
              {
                width: colWidths[i],
                align: "left",
              },
            );
        });

        currentY += 20;
        doc.y = currentY;
      });

      // Footer
      doc.moveDown(2);
      doc
        .fontSize(8)
        .text(
          `Report generated by Finance System on ${reportData.generatedAt}`,
          { align: "center" },
        );

      doc.end();

      stream.on("finish", () => resolve(pdfPath));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

// ===============================
// SIMPLE REPORT (Alternative - Quick Stats)
// ===============================
exports.quickStatsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), 0, 1); // Start of year
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Aggregate statistics
    const stats = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          averageAmount: { $avg: "$amount" },
          maxAmount: { $max: "$amount" },
          minAmount: { $min: "$amount" },
        },
      },
    ]);

    // Category breakdown
    const categoryStats = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          total: { $sum: "$amount" },
          average: { $avg: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Status breakdown
    const statusStats = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Recent payments
    const recentPayments = await Payment.find({
      createdAt: { $gte: start, $lte: end },
    })
      .populate("student", "firstName surname")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const result = {
      dateRange: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
        formattedStart: start.toLocaleDateString(),
        formattedEnd: end.toLocaleDateString(),
      },
      summary: stats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        averageAmount: 0,
        maxAmount: 0,
        minAmount: 0,
      },
      categoryStats,
      statusStats,
      recentPayments,
      generatedAt: new Date().toLocaleString(),
    };

    res.json({
      success: true,
      report: result,
    });
  } catch (err) {
    console.error("Quick stats error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to generate quick stats",
    });
  }
};
