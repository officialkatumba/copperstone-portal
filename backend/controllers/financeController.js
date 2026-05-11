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

exports.showInitiatePaymentForm = async (req, res) => {
  const users = await User.find({ role: "Student" })
    .select("firstName surname email studentProfile.studentId")
    .sort({ surname: 1 });

  // Get applications to include modeOfStudy
  const studentIds = users.map((user) => user._id);

  const applications = await Application.find({
    applicant: { $in: studentIds },
  })
    .select("applicant modeOfStudy")
    .lean();

  // Create a map of applicant ID to modeOfStudy
  const modeOfStudyMap = {};
  applications.forEach((app) => {
    modeOfStudyMap[app.applicant.toString()] = app.modeOfStudy;
  });

  // Combine user data with modeOfStudy
  const students = users.map((user) => {
    const userObj = user.toObject();
    return {
      _id: userObj._id,
      firstName: userObj.firstName,
      surname: userObj.surname,
      email: userObj.email,
      studentId: userObj.studentProfile?.studentId,
      modeOfStudy: modeOfStudyMap[userObj._id.toString()] || "Not specified",
    };
  });

  res.render("finance/initiatePayment", {
    title: "Initiate Payment",
    students,
    user: req.user,
  });
};

// Add a new endpoint for searching students
// exports.searchStudents = async (req, res) => {
//   try {
//     const searchTerm = req.query.search || "";

//     const students = await User.find({
//       role: "Student",
//       $or: [
//         { firstName: { $regex: searchTerm, $options: "i" } },
//         { surname: { $regex: searchTerm, $options: "i" } },
//         { email: { $regex: searchTerm, $options: "i" } },
//         { studentId: { $regex: searchTerm, $options: "i" } }, // if you have studentId field
//       ],
//     })
//       .select("firstName surname email studentId")
//       .limit(10)
//       .sort({ surname: 1 });

//     res.json(students);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to search students" });
//   }
// };

// Add a new endpoint for searching students
exports.searchStudents = async (req, res) => {
  try {
    const searchTerm = req.query.search || "";

    const users = await User.find({
      role: "Student",
      $or: [
        { firstName: { $regex: searchTerm, $options: "i" } },
        { surname: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { "studentProfile.studentId": { $regex: searchTerm, $options: "i" } },
      ],
    })
      .select("firstName surname email studentProfile.studentId")
      .limit(10)
      .sort({ surname: 1 });

    // Get applications for these users to fetch modeOfStudy
    const studentIds = users.map((user) => user._id);

    const applications = await Application.find({
      applicant: { $in: studentIds },
    })
      .select("applicant modeOfStudy")
      .lean();

    // Create a map of applicant ID to modeOfStudy
    const modeOfStudyMap = {};
    applications.forEach((app) => {
      modeOfStudyMap[app.applicant.toString()] = app.modeOfStudy;
    });

    // Combine user data with modeOfStudy
    const students = users.map((user) => {
      const studentObj = user.toObject();
      return {
        _id: studentObj._id,
        firstName: studentObj.firstName,
        surname: studentObj.surname,
        email: studentObj.email,
        studentId: studentObj.studentProfile?.studentId,
        modeOfStudy:
          modeOfStudyMap[studentObj._id.toString()] || "Not specified",
      };
    });

    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to search students" });
  }
};

// CREATE PAYMENT (Finance Controller - Updated with 80% validation and expected date)
exports.createPayment = async (req, res) => {
  try {
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
      modeOfStudy,
      expectedPaymentDate,
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

    // ===============================
    // VALIDATION: 80% MINIMUM PAYMENT
    // ===============================
    const minPaymentRequired = numericTotalDue * 0.8;

    if (numericAmount < minPaymentRequired) {
      req.flash(
        "error_msg",
        `Minimum payment required is 80% of total due (ZMW ${minPaymentRequired.toFixed(2)}).`,
      );
      return res.redirect("/finance/payments/new");
    }

    // ===============================
    // VALIDATION: EXPECTED DATE FOR BALANCE
    // ===============================
    let parsedExpectedDate = null;
    if (finalBalance > 0) {
      // Require expected payment date when there's a balance
      if (!expectedPaymentDate) {
        req.flash(
          "error_msg",
          "Expected date of payment is required when there is an outstanding balance.",
        );
        return res.redirect("/finance/payments/new");
      }

      // Parse and validate expected date
      parsedExpectedDate = new Date(expectedPaymentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      parsedExpectedDate.setHours(0, 0, 0, 0);

      if (parsedExpectedDate <= today) {
        req.flash("error_msg", "Expected payment date must be a future date.");
        return res.redirect("/finance/payments/new");
      }
    }

    // Validate amount doesn't exceed total due
    if (numericAmount > numericTotalDue) {
      req.flash("error_msg", "Payment amount cannot exceed total due.");
      return res.redirect("/finance/payments/new");
    }

    // Parse payment received date
    let parsedReceivedDate = new Date();
    if (paymentReceivedOn) {
      parsedReceivedDate = new Date(paymentReceivedOn);
      if (parsedReceivedDate > new Date()) {
        req.flash(
          "error_msg",
          "Payment received date cannot be in the future.",
        );
        return res.redirect("/finance/payments/new");
      }
    }

    // ===============================
    // 1️⃣ GET STUDENT INFORMATION
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

    // Generate reference number
    const reference = `PAY-${Date.now().toString().slice(-8)}`;

    // ===============================
    // 2️⃣ CREATE PAYMENT WITH EXPECTED DATE
    // ===============================
    const paymentData = {
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
      modeOfStudy: studentModeOfStudy,
      reference: reference,
      currency: "ZMW",
      status: "Verified",
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      paymentReceivedOn: parsedReceivedDate,
    };

    // Add expected payment date only if there's a balance
    if (parsedExpectedDate) {
      paymentData.expectedPaymentDate = parsedExpectedDate;
    }

    const payment = await Payment.create(paymentData);

    console.log("DEBUG - Payment created:", {
      id: payment._id,
      reference: payment.reference,
      studentName: `${studentData.firstName} ${studentData.surname}`,
      amount: numericAmount,
      totalDue: numericTotalDue,
      balance: finalBalance,
      minRequired: minPaymentRequired,
      expectedPaymentDate: parsedExpectedDate
        ? parsedExpectedDate.toISOString()
        : "N/A",
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
      }
    }

    // ===============================
    // 4️⃣ GENERATE RECEIPT WITH EXPECTED DATE INFO
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

    // Generate receipt
    const pdfPath = await generateReceiptPDF({
      payment: {
        _id: populatedPayment._id,
        reference: populatedPayment.reference,
        amount: populatedPayment.amount,
        method: populatedPayment.method,
        status: populatedPayment.status,
        verifiedAt: populatedPayment.verifiedAt,
        paymentReceivedOn: populatedPayment.paymentReceivedOn,
        category: populatedPayment.category,
        description: populatedPayment.description,
        totalDue: populatedPayment.totalDue,
        balanceAfterPayment: populatedPayment.balanceAfterPayment,
        expectedPaymentDate: populatedPayment.expectedPaymentDate,
        student: populatedPayment.student,
        verifiedBy: populatedPayment.verifiedBy,
        programme: programmeData,
        modeOfStudy: studentModeOfStudy,
        semester: semester || null,
        academicYear: academicYear || null,
      },
      academicInfo: {
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

    // Update payment with receipt info
    payment.receipt = {
      receiptNumber: payment.reference,
      name: "Official Payment Receipt",
      gcsPath,
      gcsUrl: signedUrl,
      issuedAt: new Date(),
      academicInfo: academicInfo,
    };

    await payment.save();

    console.log("DEBUG - Receipt generated:", {
      receiptNumber: payment.receipt.receiptNumber,
    });

    // ===============================
    // 5️⃣ SEND EMAILS WITH EXPECTED DATE INFO
    // ===============================
    const studentEmail = populatedPayment.student?.email;

    if (studentEmail) {
      // Format dates for email
      const receiptDate = new Date().toLocaleDateString();
      const depositDate = populatedPayment.paymentReceivedOn
        ? new Date(populatedPayment.paymentReceivedOn).toLocaleDateString()
        : receiptDate;
      const expectedDateStr = parsedExpectedDate
        ? parsedExpectedDate.toLocaleDateString()
        : "Not specified";

      await sendEmail({
        to: studentEmail,
        subject: `💳 Payment Received – Receipt #${payment.reference}`,
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
            ${finalBalance > 0 ? `<p><strong>Expected Payment Date:</strong> ${expectedDateStr}</p>` : ""}
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
                <p style="margin: 5px 0 0 0;"><strong>Expected Payment Date:</strong> ${expectedDateStr}</p>
              </div>`
              : `<div style="background-color: #d1ecf1; padding: 10px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #0c5460;">
                <p style="margin: 0;"><strong>Payment Status:</strong> Fully Paid ✅</p>
              </div>`
          }
          
          ${
            finalBalance > 0
              ? `<p><strong>Important:</strong> Please ensure the remaining balance is paid by <strong>${expectedDateStr}</strong> to avoid any penalties.</p>`
              : ""
          }
          
          <p>Regards,<br/>Finance Office</p>
        `,
        attachments: [
          {
            filename: `Receipt_${payment.reference}.pdf`,
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

    const successMessage = `Payment created successfully! Receipt #${payment.reference} issued. Balance: ZMW ${finalBalance.toFixed(2)}`;
    req.flash(
      "success_msg",
      finalBalance > 0
        ? `${successMessage} (Expected by: ${parsedExpectedDate.toLocaleDateString()})`
        : successMessage,
    );
    res.redirect("/finance/payments");
  } catch (err) {
    console.error("Create payment error:", err);
    req.flash("error_msg", "Failed to initiate payment.");
    res.redirect("/finance/payments/new");
  }
};

// // ===============================
// // LIST ALL PAYMENTS (FINANCE)
// // ===============================
// exports.listPayments = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20; // START AT 20
//     const search = (req.query.search || "").trim();
//     const category = (req.query.category || "").trim();

//     const skip = (page - 1) * limit;

//     // ============================
//     // BUILD QUERY
//     // ============================
//     const query = {};

//     // CATEGORY FILTER
//     if (category) {
//       query.category = category;
//     }

//     // STUDENT SEARCH (name OR email)
//     if (search) {
//       const students = await User.find({
//         role: "Student",
//         $or: [
//           { firstName: new RegExp(search, "i") },
//           { surname: new RegExp(search, "i") },
//           { email: new RegExp(search, "i") },
//         ],
//       }).select("_id");

//       query.student = { $in: students.map((s) => s._id) };
//     }

//     // ============================
//     // PAYMENTS
//     // ============================
//     const payments = await Payment.find(query)
//       .populate("student", "firstName surname email")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     const totalCount = await Payment.countDocuments(query);
//     const totalPages = Math.ceil(totalCount / limit);

//     // ============================
//     // SUMMARY TOTALS
//     // ============================
//     const now = new Date();
//     const startOfToday = new Date(now.setHours(0, 0, 0, 0));
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfYear = new Date(now.getFullYear(), 0, 1);

//     const sum = async (from) => {
//       const r = await Payment.aggregate([
//         { $match: { createdAt: { $gte: from } } },
//         { $group: { _id: null, total: { $sum: "$amount" } } },
//       ]);
//       return r.length ? r[0].total : 0;
//     };

//     const [totalToday, totalMonth, totalYear, totalAll] = await Promise.all([
//       sum(startOfToday),
//       sum(startOfMonth),
//       sum(startOfYear),
//       sum(new Date(0)),
//     ]);

//     res.render("finance/payments", {
//       title: "All Payments",
//       payments,

//       // summary
//       totalToday,
//       totalMonth,
//       totalYear,
//       totalAll,

//       today: new Date().toLocaleDateString(),
//       monthRange: `${startOfMonth.toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
//       yearRange: `${startOfYear.getFullYear()} - ${new Date().getFullYear()}`,

//       // filters
//       search,
//       category,

//       // pagination
//       currentPage: page,
//       totalPages,
//       totalCount,
//       limit,

//       user: req.user,
//     });
//   } catch (err) {
//     console.error("List payments error:", err);
//     req.flash("error_msg", "Failed to load payments.");
//     res.redirect("/dashboard");
//   }
// };

// ===============================
// LIST ALL PAYMENTS (FINANCE) - UPDATED
// ===============================
exports.listPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
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

    // STUDENT SEARCH (name OR email OR mobile)
    if (search) {
      const students = await User.find({
        role: "Student",
        $or: [
          { firstName: new RegExp(search, "i") },
          { surname: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
          { mobile: new RegExp(search, "i") }, // ADDED: Search by mobile too
        ],
      }).select("_id");

      query.student = { $in: students.map((s) => s._id) };
    }

    // ============================
    // PAYMENTS WITH PROPER POPULATION
    // ============================
    // const payments = await Payment.find(query)
    //   .populate({
    //     path: "student",
    //     select: "firstName surname email mobile studentId", // ADDED: mobile and studentId
    //   })
    //   .populate({
    //     path: "verifiedBy",
    //     select: "firstName surname email", // ADDED: To show who verified
    //   })
    //   .sort({ createdAt: -1 })
    //   .skip(skip)
    //   .limit(limit);

    // const totalCount = await Payment.countDocuments(query);
    // const totalPages = Math.ceil(totalCount / limit);

    // ============================
    // PAYMENTS WITH GUARANTEED STUDENT POPULATION (FIXES MOBILE ISSUE)
    // ============================
    const payments = await Payment.find(query)
      .populate({
        path: "student",
        model: "User", // 👈 force proper population
        select: "firstName surname email mobile studentProfile.studentId",
      })
      .populate({
        path: "verifiedBy",
        model: "User",
        select: "firstName surname email",
      })
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

      user: req.user, // This is the logged-in user, not the student
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

// ===============================
// HELPER FUNCTIONS
// ===============================

// Format numbers with thousand separators
function formatNumber(num) {
  if (num === undefined || num === null) return "0.00";
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Download image for PDF header
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
        response.on("error", reject);
      })
      .on("error", reject);
  });
}

// ===============================
// SHOW REPORTS PAGE
// ===============================
exports.showReportsPage = async (req, res) => {
  try {
    res.render("finance/reports", {
      title: "Finance Reports",
      user: req.user,
      today: new Date().toISOString().split("T")[0],
    });
  } catch (err) {
    console.error("Show reports error:", err);
    req.flash("error_msg", "Could not load reports page.");
    res.redirect("/dashboard/finance");
  }
};
// ================================
// PDF GENERATOR UTILITY - IMPROVED VERSION
// ================================

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// Helper function to download image
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
        response.on("error", reject);
      })
      .on("error", reject);
  });
}

// Format numbers with thousands separator - IMPROVED
function formatNumber(num) {
  if (num === undefined || num === null) return "0.00";
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Helper function to generate PDF report - IMPROVED with all requirements

// ================================
// MAIN REPORT FUNCTION - FIXED PAGINATION
// ================================

// ================================
// QUICK STATS REPORT
// ================================
exports.quickStatsReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    // Get ALL payments for summary
    const allPayments = await Payment.find({
      createdAt: { $gte: start, $lte: end },
    }).lean();

    // Calculate summary from ALL payments
    const summary = allPayments.reduce(
      (acc, payment) => {
        acc.totalPayments++;
        acc.totalAmount += payment.amount || 0;
        acc.totalDue += payment.totalDue || 0;
        acc.totalBalance += payment.balanceAfterPayment || 0;
        acc.maxAmount = Math.max(acc.maxAmount, payment.amount || 0);
        acc.minAmount =
          acc.minAmount === 0
            ? payment.amount || 0
            : Math.min(acc.minAmount, payment.amount || 0);
        return acc;
      },
      {
        totalPayments: 0,
        totalAmount: 0,
        totalDue: 0,
        totalBalance: 0,
        averageAmount: 0,
        maxAmount: 0,
        minAmount: 0,
      },
    );

    summary.averageAmount =
      summary.totalPayments > 0
        ? summary.totalAmount / summary.totalPayments
        : 0;
    summary.totalPaid = summary.totalDue - summary.totalBalance;
    summary.completionPercentage =
      summary.totalDue > 0
        ? Math.round((summary.totalPaid / summary.totalDue) * 100)
        : 0;

    // Category breakdown
    const categoryStats = await Payment.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          total: { $sum: "$amount" },
          totalDue: { $sum: "$totalDue" },
          totalBalance: { $sum: "$balanceAfterPayment" },
          average: { $avg: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Status breakdown
    const statusStats = await Payment.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
    ]);

    res.json({
      success: true,
      report: {
        dateRange: {
          start: start.toISOString().split("T")[0],
          end: end.toISOString().split("T")[0],
          formattedStart: start.toLocaleDateString(),
          formattedEnd: end.toLocaleDateString(),
        },
        summary,
        categoryStats,
        statusStats,
        generatedAt: new Date().toLocaleString(),
      },
    });
  } catch (err) {
    console.error("Quick stats error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to generate quick stats",
    });
  }
};

////////////////////////////////////////////////

async function generatePaymentReportPDF(reportData) {
  const PDFDocument = require("pdfkit");
  const tempDir = path.join(__dirname, "../temp");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const pdfPath = path.join(tempDir, `payment_report_${Date.now()}.pdf`);

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        layout: "landscape",
        bufferPages: true,
      });

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Constants - LANDSCAPE OPTIMIZED
      const tableStartX = 50;
      const tableWidth = 730; // Slightly increased to accommodate category column
      const footerSpace = 80;
      const bottomLimit = doc.page.height - footerSpace;
      const rowHeight = 18;
      const pageWidth = doc.page.width;

      // Colors
      const colors = {
        primary: "#003366",
        secondary: "#2c3e50",
        textDark: "#2d3748",
        textMedium: "#4a5568",
        textLight: "#718096",
        headerBg: "#f7fafc",
        border: "#cbd5e0",
        success: "#38a169",
        warning: "#ecc94b",
        danger: "#e53e3e",
        info: "#4299e1",
        neutral: "#718096",
        highlight: "#fff5f5",
        highlightBorder: "#fc8181",
      };

      // ============ COLUMN DEFINITIONS - WITH CATEGORY ADDED ============
      const paymentColumns = [
        { label: "Date", width: 65, align: "left" },
        { label: "Receipt", width: 75, align: "left" },
        { label: "Student Name", width: 140, align: "left" },
        { label: "Category", width: 100, align: "left" }, // NEW CATEGORY COLUMN
        { label: "Amount", width: 75, align: "right" },
        { label: "Due", width: 75, align: "right" },
        { label: "Balance", width: 75, align: "right" },
      ];

      const categoryColumns = [
        { label: "Category", width: 140, align: "left" },
        { label: "Count", width: 70, align: "right" },
        { label: "Collected", width: 100, align: "right" },
        { label: "Due", width: 100, align: "right" },
        { label: "Balance", width: 100, align: "right" },
        { label: "%", width: 70, align: "right" },
      ];

      // Download logo if available
      let logoBuffer = null;
      try {
        if (process.env.LOGO) {
          logoBuffer = await downloadImage(process.env.LOGO);
        }
      } catch (e) {
        console.warn("⚠️ Could not load logo:", e.message);
      }

      // ============ HEADER - LANDSCAPE OPTIMIZED ============
      function addCopperstoneHeader() {
        const startY = 30;
        doc.y = startY;

        if (logoBuffer) {
          try {
            doc.image(logoBuffer, 50, startY, { width: 60, height: 60 });
          } catch (e) {}
        }

        doc
          .fontSize(18)
          .font("Helvetica-Bold")
          .fillColor(colors.primary)
          .text("COPPERSTONE UNIVERSITY", 120, startY + 5, {
            align: "center",
            width: pageWidth - 170,
          });

        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor(colors.textMedium)
          .text(
            "Plot 38002, Baluba Campus, P.O. Box 22041,",
            120,
            startY + 30,
            { align: "center", width: pageWidth - 170 },
          )
          .text(
            "Along Ndola – Kitwe Dual carriageway, KITWE, ZAMBIA",
            120,
            startY + 45,
            { align: "center", width: pageWidth - 170 },
          )
          .text(
            "Cell: +260 965571607, +260 0967499292, +260 965 653 101",
            120,
            startY + 60,
            { align: "center", width: pageWidth - 170 },
          )
          .text(
            "www.copperstoneuniversity.edu.zm | customercareucopperstone@gmail.com",
            120,
            startY + 75,
            { align: "center", width: pageWidth - 170 },
          );

        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .fillColor(colors.secondary)
          .text("FINANCIAL PAYMENTS REPORT", 50, startY + 110, {
            align: "center",
            width: pageWidth - 100,
          });

        doc
          .fontSize(11)
          .font("Helvetica")
          .fillColor(colors.textMedium)
          .text(
            `Period: ${reportData.dateRange.formattedStart} - ${reportData.dateRange.formattedEnd}`,
            50,
            startY + 140,
            { align: "center", width: pageWidth - 100 },
          );

        doc.y = startY + 170;
      }

      // ============ FOOTER - DYNAMIC FOR ANY PAGE SIZE ============
      function addFooter(pageNum, totalPages) {
        const footerY = doc.page.height - 45;
        const pageWidth = doc.page.width;

        doc
          .moveTo(50, footerY - 15)
          .lineTo(pageWidth - 50, footerY - 15)
          .lineWidth(0.5)
          .strokeColor(colors.border)
          .stroke();

        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(colors.textLight)
          .text(`Page ${pageNum} of ${totalPages}`, 50, footerY, {
            align: "left",
            width: 200,
          });

        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor(colors.danger)
          .text("CONFIDENTIAL REPORT", 0, footerY, {
            align: "center",
          });

        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(colors.textMedium)
          .text("Finance Department", pageWidth - 200, footerY, {
            align: "right",
            width: 150,
          });
      }

      // ============ PAYMENT TABLE HEADERS - WITH CATEGORY ============
      function addPaymentHeaders(y) {
        let x = tableStartX;

        doc
          .rect(tableStartX, y - 4, tableWidth, 20)
          .fillColor(colors.headerBg)
          .fill();

        doc.fillColor(colors.textDark).fontSize(8).font("Helvetica-Bold");

        paymentColumns.forEach((col) => {
          doc.text(col.label, x, y, {
            width: col.width,
            align: col.align || "left",
          });
          x += col.width;
        });

        doc.fillColor("#000000").font("Helvetica");
        return y + 22;
      }

      // ============ CATEGORY TABLE HEADERS ============
      function addCategoryHeaders(y) {
        let x = tableStartX;

        doc
          .rect(tableStartX, y - 5, tableWidth, 22)
          .fillColor(colors.headerBg)
          .fill();

        doc.fillColor(colors.textDark).fontSize(9).font("Helvetica-Bold");

        categoryColumns.forEach((col) => {
          doc.text(col.label, x, y, {
            width: col.width,
            align: col.align || "left",
          });
          x += col.width;
        });

        doc.fillColor("#000000").font("Helvetica");
        return y + 25;
      }

      // ============ STATUS BREAKDOWN ============
      function addStatusBreakdown() {
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor(colors.secondary)
          .text("STATUS BREAKDOWN", 50, doc.y, {
            align: "center",
            width: pageWidth - 100,
          });
        doc.moveDown(1);

        const totalPayments = reportData.summary.totalPayments;
        const statusEntries = Object.entries(reportData.summary.statusCount);
        const startY = doc.y;

        statusEntries.forEach(([status, count], index) => {
          const percentage =
            totalPayments > 0 ? ((count / totalPayments) * 100).toFixed(1) : 0;
          const yPos = startY + index * 35;

          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .fillColor(colors.textDark)
            .text(`${status}:`, 70, yPos);

          doc
            .fontSize(10)
            .font("Helvetica")
            .fillColor(colors.textMedium)
            .text(`${count.toLocaleString()} (${percentage}%)`, 170, yPos);

          const barWidth = 350;
          const barX = 250;
          const barY = yPos + 4;

          doc.rect(barX, barY, barWidth, 8).fillColor("#edf2f7").fill();

          let barColor = colors.neutral;
          if (status === "Verified" || status === "Fully Paid")
            barColor = colors.success;
          else if (status === "Pending") barColor = colors.warning;
          else if (status === "Rejected") barColor = colors.danger;
          else if (status === "Partially Paid") barColor = colors.info;

          doc
            .rect(barX, barY, barWidth * (percentage / 100), 8)
            .fillColor(barColor)
            .fill();
        });

        doc.y = startY + statusEntries.length * 35 + 20;
      }

      // ============ PAGE INIT ============
      doc.on("pageAdded", () => {
        addCopperstoneHeader();
      });

      // ============ FIRST PAGE ============
      addCopperstoneHeader();
      doc.moveDown(1);

      // ============ FINANCIAL SUMMARY ============
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor(colors.secondary)
        .text("FINANCIAL SUMMARY", 50, doc.y, {
          align: "center",
          width: pageWidth - 100,
        });
      doc.moveDown(1);

      doc.fontSize(10).font("Helvetica").fillColor(colors.textMedium);

      const summaryItems = [
        `Total Payments: ${reportData.allPaymentsCount.toLocaleString()}`,
        `Total Amount Collected: ZMW ${formatNumber(reportData.summary.totalAmount)}`,
        `Total Amount Due: ZMW ${formatNumber(reportData.summary.totalDue)}`,
        `Total Amount Paid: ZMW ${formatNumber(reportData.summary.totalPaid)}`,
        {
          text: `Outstanding Balance: ZMW ${formatNumber(reportData.summary.totalBalance)}`,
          color:
            reportData.summary.totalBalance > 0
              ? colors.danger
              : colors.textMedium,
          highlight: reportData.summary.totalBalance > 0,
        },
        `Completion Rate: ${reportData.summary.completionPercentage}%`,
        `Generated: ${reportData.generatedAt}`,
      ];

      summaryItems.forEach((item) => {
        if (typeof item === "string") {
          doc.text(item, { align: "center" });
        } else {
          doc.fillColor(item.color || colors.textMedium);
          doc.text(item.text, { align: "center" });
          doc.fillColor(colors.textMedium);
        }
        doc.moveDown(0.4);
      });

      doc.moveDown(1);

      // ============ STATUS BREAKDOWN ============
      if (doc.y + 150 > bottomLimit) {
        doc.addPage();
      }
      addStatusBreakdown();
      doc.moveDown(1);

      // ============ CATEGORY BREAKDOWN ============
      if (doc.y + 100 > bottomLimit) {
        doc.addPage();
      }

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor(colors.secondary)
        .text("CATEGORY BREAKDOWN", 50, doc.y, {
          align: "center",
          width: pageWidth - 100,
        });
      doc.moveDown(1);

      let catY = addCategoryHeaders(doc.y);

      const categories = Object.entries(reportData.summary.categories).sort(
        (a, b) => b[1].totalAmount - a[1].totalAmount,
      );

      if (categories.length === 0) {
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor(colors.textLight)
          .text("No category data available for this period.", 50, catY, {
            align: "center",
            width: pageWidth - 100,
          });
        doc.y = catY + 30;
      } else {
        categories.forEach(([category, data]) => {
          if (catY + rowHeight > bottomLimit) {
            doc.addPage();
            doc
              .fontSize(14)
              .font("Helvetica-Bold")
              .fillColor(colors.secondary)
              .text("CATEGORY BREAKDOWN (Continued)", 50, doc.y, {
                align: "center",
                width: pageWidth - 100,
              });
            doc.moveDown(1);
            catY = addCategoryHeaders(doc.y);
          }

          let x = tableStartX;
          doc.fontSize(9).font("Helvetica");

          const hasBalance = data.totalBalance > 0;

          if (hasBalance) {
            doc
              .rect(tableStartX, catY - 2, tableWidth, rowHeight - 1)
              .fillColor(colors.highlight)
              .fill();

            doc
              .rect(tableStartX - 2, catY - 2, 3, rowHeight - 1)
              .fillColor(colors.danger)
              .fill();
          }

          doc.fillColor(hasBalance ? colors.danger : "#000000");

          const displayCategory =
            category.length > 20 ? category.substring(0, 17) + "..." : category;
          doc.text(displayCategory, x, catY, {
            width: categoryColumns[0].width,
            align: categoryColumns[0].align,
          });
          x += categoryColumns[0].width;

          doc.text(data.count.toLocaleString(), x, catY, {
            width: categoryColumns[1].width,
            align: categoryColumns[1].align,
          });
          x += categoryColumns[1].width;

          doc.text(formatNumber(data.totalAmount), x, catY, {
            width: categoryColumns[2].width,
            align: categoryColumns[2].align,
          });
          x += categoryColumns[2].width;

          doc.text(formatNumber(data.totalDue), x, catY, {
            width: categoryColumns[3].width,
            align: categoryColumns[3].align,
          });
          x += categoryColumns[3].width;

          if (data.totalBalance > 0) {
            doc.fillColor(colors.danger).font("Helvetica-Bold");
          } else {
            doc.fillColor("#000000").font("Helvetica");
          }

          doc.text(formatNumber(data.totalBalance), x, catY, {
            width: categoryColumns[4].width,
            align: categoryColumns[4].align,
          });
          x += categoryColumns[4].width;

          doc.fillColor("#000000").font("Helvetica");
          doc.text(`${data.percentage}%`, x, catY, {
            width: categoryColumns[5].width,
            align: categoryColumns[5].align,
          });

          catY += rowHeight;
          doc.y = catY;
          doc.fillColor("#000000");
        });
      }

      doc.moveDown(1);

      // ============ DETAILED PAYMENTS - WITH CATEGORY COLUMN ============
      const allPaymentsForPDF = reportData.allPayments || reportData.payments;

      if (allPaymentsForPDF.length > 0) {
        if (doc.y + 80 > bottomLimit && allPaymentsForPDF.length > 0) {
          doc.addPage();
        }

        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor(colors.secondary)
          .text("DETAILED PAYMENTS", 50, doc.y, {
            align: "center",
            width: pageWidth - 100,
          });
        doc.moveDown(0.5);

        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(colors.textLight)
          .text(
            `Showing ${allPaymentsForPDF.length.toLocaleString()} payment(s) for the selected period`,
            50,
            doc.y,
            { align: "center", width: pageWidth - 100 },
          );
        doc.moveDown(1);

        let payY = addPaymentHeaders(doc.y);

        allPaymentsForPDF.forEach((payment) => {
          if (payY + rowHeight > bottomLimit) {
            doc.addPage();
            payY = addPaymentHeaders(doc.y + 20);
          }

          let x = tableStartX;

          const hasBalance = payment.balanceAfterPayment > 0;

          // HIGHLIGHT ENTIRE ROW IN RED if balance > 0
          if (hasBalance) {
            doc
              .rect(tableStartX, payY - 2, tableWidth, rowHeight - 1)
              .fillColor(colors.highlight)
              .fill();

            doc
              .rect(tableStartX - 2, payY - 2, 3, rowHeight - 1)
              .fillColor(colors.danger)
              .fill();

            doc
              .fontSize(8)
              .fillColor(colors.danger)
              .text("⚠", tableStartX - 12, payY);
          }

          doc.fontSize(8).font("Helvetica");

          // Date
          doc.fillColor("#000000");
          doc.text(
            payment.createdAt
              ? new Date(payment.createdAt).toLocaleDateString("en-GB")
              : "N/A",
            x,
            payY,
            {
              width: paymentColumns[0].width,
              align: paymentColumns[0].align,
            },
          );
          x += paymentColumns[0].width;

          // Receipt
          doc.text(
            payment.reference ? payment.reference.substring(0, 10) : "N/A",
            x,
            payY,
            {
              width: paymentColumns[1].width,
              align: paymentColumns[1].align,
            },
          );
          x += paymentColumns[1].width;

          // Student Name
          const studentName = payment.student
            ? `${payment.student.firstName || ""} ${payment.student.surname || ""}`.trim()
            : "N/A";
          const displayName =
            studentName.length > 20
              ? studentName.substring(0, 17) + "..."
              : studentName;

          doc.text(displayName, x, payY, {
            width: paymentColumns[2].width,
            align: paymentColumns[2].align,
          });
          x += paymentColumns[2].width;

          // ============ CATEGORY COLUMN - NEW ============
          const category = payment.category || "Uncategorized";
          const displayCategory =
            category.length > 15 ? category.substring(0, 12) + "..." : category;

          doc.text(displayCategory, x, payY, {
            width: paymentColumns[3].width,
            align: paymentColumns[3].align,
          });
          x += paymentColumns[3].width;

          // Amount
          doc.text(formatNumber(payment.amount), x, payY, {
            width: paymentColumns[4].width,
            align: paymentColumns[4].align,
          });
          x += paymentColumns[4].width;

          // Due
          doc.text(formatNumber(payment.totalDue || 0), x, payY, {
            width: paymentColumns[5].width,
            align: paymentColumns[5].align,
          });
          x += paymentColumns[5].width;

          // BALANCE - RED and BOLD if > 0
          if (hasBalance) {
            doc.fillColor(colors.danger).font("Helvetica-Bold");
          } else {
            doc.fillColor("#000000").font("Helvetica");
          }

          doc.text(formatNumber(payment.balanceAfterPayment || 0), x, payY, {
            width: paymentColumns[6].width,
            align: paymentColumns[6].align,
          });

          payY += rowHeight;
          doc.y = payY;
          doc.fillColor("#000000").font("Helvetica");
        });

        // ============ SUMMARY OF OUTSTANDING BALANCES ============
        const outstandingPayments = allPaymentsForPDF.filter(
          (p) => p.balanceAfterPayment > 0,
        );

        if (outstandingPayments.length > 0 && doc.y + 80 <= bottomLimit) {
          doc.moveDown(1);

          doc
            .moveTo(50, doc.y)
            .lineTo(pageWidth - 50, doc.y)
            .lineWidth(1)
            .strokeColor(colors.danger)
            .stroke();

          doc.moveDown(0.5);

          const totalOutstanding = outstandingPayments.reduce(
            (sum, p) => sum + (p.balanceAfterPayment || 0),
            0,
          );

          doc
            .fontSize(11)
            .font("Helvetica-Bold")
            .fillColor(colors.danger)
            .text(
              `⚠ OUTSTANDING BALANCES: ${outstandingPayments.length} payment(s) totaling ZMW ${formatNumber(totalOutstanding)}`,
              50,
              doc.y,
              {
                align: "center",
                width: pageWidth - 100,
              },
            );

          doc.moveDown(1);

          doc.fontSize(9).font("Helvetica").fillColor(colors.textDark);

          outstandingPayments.slice(0, 5).forEach((payment, idx) => {
            const studentName = payment.student
              ? `${payment.student.firstName || ""} ${payment.student.surname || ""}`.trim()
              : "Unknown";
            const category = payment.category || "Uncategorized";

            doc.text(
              `${idx + 1}. ${studentName} - ${category} - ZMW ${formatNumber(payment.balanceAfterPayment)} (Receipt: ${payment.reference || "N/A"})`,
              70,
              doc.y,
              { width: pageWidth - 140 },
            );
            doc.moveDown(0.5);
          });

          if (outstandingPayments.length > 5) {
            doc
              .fontSize(9)
              .font("Helvetica-Oblique")
              .fillColor(colors.textLight)
              .text(
                `... and ${outstandingPayments.length - 5} more`,
                70,
                doc.y,
              );
          }
        }

        // ============ END OF REPORT ============
        if (doc.y + 40 <= bottomLimit) {
          doc.moveDown(1);

          doc
            .fontSize(10)
            .font("Helvetica-Oblique")
            .fillColor(colors.textLight)
            .text("✦ ✦ ✦ END OF REPORT ✦ ✦ ✦", 50, doc.y, {
              align: "center",
              width: pageWidth - 100,
            });

          doc
            .fontSize(8)
            .font("Helvetica")
            .fillColor(colors.textMedium)
            .text(
              "This is a computer-generated document. No signature is required.",
              50,
              doc.y + 20,
              { align: "center", width: pageWidth - 100 },
            );
        }
      }

      // ============ FINALIZE PAGES ============
      const totalPages = doc.bufferedPageRange().count;

      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        addFooter(i + 1, totalPages);
      }

      doc.end();

      stream.on("finish", () => resolve(pdfPath));
      stream.on("error", reject);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      reject(error);
    }
  });
}

// ================================
// MAIN REPORT FUNCTION - FIXED FOR PDF
// ================================

exports.generatePaymentReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      outputFormat = "html",
      page = 1,
      limit = 50,
      search = "",
    } = req.query;

    // Default dates: current month
    const defaultStartDate = new Date();
    defaultStartDate.setDate(1);
    defaultStartDate.setHours(0, 0, 0, 0);

    const defaultEndDate = new Date();
    defaultEndDate.setHours(23, 59, 59, 999);

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Build query
    let query = {
      createdAt: { $gte: start, $lte: end },
    };

    // Add search if provided
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");

      const students = await User.find({
        role: "Student",
        $or: [
          { firstName: searchRegex },
          { surname: searchRegex },
          { email: searchRegex },
          { studentId: searchRegex },
        ],
      }).select("_id");

      query = {
        ...query,
        $or: [
          { reference: searchRegex },
          { category: searchRegex },
          { method: searchRegex },
          { status: searchRegex },
          { student: { $in: students.map((s) => s._id) } },
        ],
      };
    }

    // Fetch ALL payments for summary and PDF
    const allPayments = await Payment.find(query)
      .populate("student", "firstName surname email studentId")
      .populate("verifiedBy", "firstName surname")
      .sort({ createdAt: -1 })
      .lean();

    // Paginated payments for HTML view only
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const payments = await Payment.find(query)
      .populate("student", "firstName surname email studentId")
      .populate("verifiedBy", "firstName surname")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Calculate summary from ALL payments
    const summary = allPayments.reduce(
      (acc, payment) => {
        const category = payment.category || "Uncategorized";

        if (!acc.categories[category]) {
          acc.categories[category] = {
            count: 0,
            totalAmount: 0,
            totalDue: 0,
            totalBalance: 0,
          };
        }

        acc.categories[category].count++;
        acc.categories[category].totalAmount += payment.amount || 0;
        acc.categories[category].totalDue += payment.totalDue || 0;
        acc.categories[category].totalBalance +=
          payment.balanceAfterPayment || 0;

        acc.totalAmount += payment.amount || 0;
        acc.totalPayments++;
        acc.totalDue += payment.totalDue || 0;
        acc.totalBalance += payment.balanceAfterPayment || 0;

        acc.statusCount[payment.status] =
          (acc.statusCount[payment.status] || 0) + 1;

        return acc;
      },
      {
        totalAmount: 0,
        totalPayments: 0,
        totalDue: 0,
        totalBalance: 0,
        totalPaid: 0,
        categories: {},
        statusCount: {},
      },
    );

    // Calculate derived values
    summary.totalPaid = summary.totalDue - summary.totalBalance;
    summary.completionPercentage =
      summary.totalDue > 0
        ? Math.round((summary.totalPaid / summary.totalDue) * 100)
        : 0;

    // Calculate category percentages
    for (const category in summary.categories) {
      summary.categories[category].percentage =
        summary.totalAmount > 0
          ? (
              (summary.categories[category].totalAmount / summary.totalAmount) *
              100
            ).toFixed(1)
          : "0.0";
    }

    // Format dates
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

    // Pagination info
    const totalPayments = allPayments.length;
    const totalPages = Math.ceil(totalPayments / parseInt(limit));
    const currentPage = parseInt(page);

    const reportData = {
      payments, // Paginated for HTML
      allPayments, // Full dataset for PDF
      allPaymentsCount: totalPayments,
      summary,
      dateRange: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
        formattedStart,
        formattedEnd,
      },
      generatedAt: new Date().toLocaleString(),
      pagination: {
        currentPage,
        totalPages,
        totalPayments,
        limit: parseInt(limit),
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
      searchQuery: outputFormat === "html" ? search : "",
    };

    // ============ PDF OUTPUT - DIRECT DOWNLOAD, NO CLOUD ============
    if (outputFormat === "pdf") {
      const pdfPath = await generatePaymentReportPDF(reportData);
      const fileName = `payment_report_${Date.now()}.pdf`;

      return res.download(pdfPath, fileName, (err) => {
        // Delete temporary file after download attempt
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }

        if (err) {
          console.error("PDF download error:", err);
        }
      });
    }

    // ============ HTML OUTPUT ============
    res.render("finance/reportResults", {
      title: "Payment Report",
      user: req.user,
      reportData,
      outputFormat: "html",
      formatNumber,
      startDate: reportData.dateRange.start,
      endDate: reportData.dateRange.end,
      currentLimit: parseInt(limit),
      searchQuery: search || "",
    });
  } catch (err) {
    console.error("Generate report error:", err);

    if (req.query.outputFormat === "pdf") {
      return res.status(500).send("Failed to generate PDF report");
    }

    req.flash("error_msg", "Failed to generate report.");
    res.redirect("/finance/reports");
  }
};

// Add this at the top with other requires
const { generatePaymentExcel } = require("../utils/excelGenerator");

// Add this new function for Excel export
exports.exportPaymentReportExcel = async (req, res) => {
  try {
    const { startDate, endDate, search = "" } = req.query;

    // Default dates: current month
    const defaultStartDate = new Date();
    defaultStartDate.setDate(1);
    defaultStartDate.setHours(0, 0, 0, 0);

    const defaultEndDate = new Date();
    defaultEndDate.setHours(23, 59, 59, 999);

    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Build query
    let query = {
      createdAt: { $gte: start, $lte: end },
    };

    // Add search if provided
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");

      const students = await User.find({
        role: "Student",
        $or: [
          { firstName: searchRegex },
          { surname: searchRegex },
          { email: searchRegex },
          { studentId: searchRegex },
        ],
      }).select("_id");

      query = {
        ...query,
        $or: [
          { reference: searchRegex },
          { category: searchRegex },
          { method: searchRegex },
          { status: searchRegex },
          { student: { $in: students.map((s) => s._id) } },
        ],
      };
    }

    // Fetch all payments for the period
    const allPayments = await Payment.find(query)
      .populate("student", "firstName surname email studentId")
      .populate("verifiedBy", "firstName surname")
      .sort({ createdAt: -1 })
      .lean();

    // Calculate summary
    const summary = allPayments.reduce(
      (acc, payment) => {
        const category = payment.category || "Uncategorized";

        if (!acc.categories[category]) {
          acc.categories[category] = {
            count: 0,
            totalAmount: 0,
            totalDue: 0,
            totalBalance: 0,
          };
        }

        acc.categories[category].count++;
        acc.categories[category].totalAmount += payment.amount || 0;
        acc.categories[category].totalDue += payment.totalDue || 0;
        acc.categories[category].totalBalance +=
          payment.balanceAfterPayment || 0;

        acc.totalAmount += payment.amount || 0;
        acc.totalPayments++;
        acc.totalDue += payment.totalDue || 0;
        acc.totalBalance += payment.balanceAfterPayment || 0;

        acc.maxAmount = Math.max(acc.maxAmount, payment.amount || 0);
        acc.minAmount =
          acc.minAmount === 0
            ? payment.amount || 0
            : Math.min(acc.minAmount, payment.amount || 0);

        acc.statusCount[payment.status] =
          (acc.statusCount[payment.status] || 0) + 1;

        return acc;
      },
      {
        totalAmount: 0,
        totalPayments: 0,
        totalDue: 0,
        totalBalance: 0,
        totalPaid: 0,
        maxAmount: 0,
        minAmount: 0,
        categories: {},
        statusCount: {},
      },
    );

    summary.totalPaid = summary.totalDue - summary.totalBalance;
    summary.completionPercentage =
      summary.totalDue > 0
        ? Math.round((summary.totalPaid / summary.totalDue) * 100)
        : 0;

    summary.averageAmount =
      summary.totalPayments > 0
        ? summary.totalAmount / summary.totalPayments
        : 0;

    // Calculate category percentages
    for (const category in summary.categories) {
      summary.categories[category].percentage =
        summary.totalAmount > 0
          ? (
              (summary.categories[category].totalAmount / summary.totalAmount) *
              100
            ).toFixed(1)
          : "0.0";
    }

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

    const reportData = {
      payments: allPayments,
      allPayments,
      allPaymentsCount: allPayments.length,
      summary,
      dateRange: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
        formattedStart,
        formattedEnd,
      },
      generatedAt: new Date().toLocaleString(),
    };

    // Generate Excel file locally
    const excelPath = await generatePaymentExcel(reportData);
    const fileName = `payment_report_${Date.now()}.xlsx`;

    // Direct download, no Google Cloud
    return res.download(excelPath, fileName, (err) => {
      // Delete temporary file after download attempt
      if (fs.existsSync(excelPath)) {
        fs.unlinkSync(excelPath);
      }

      if (err) {
        console.error("Excel download error:", err);
      }
    });
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).send("Failed to generate Excel report");
  }
};
