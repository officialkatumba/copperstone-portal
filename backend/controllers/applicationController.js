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

////////////////////////////////////////////////////////////////////

// controllers/applicationController.js (add this method)

// exports.getMyPayments = async (req, res) => {
//   try {
//     console.log("getMyPayments route was hit successfully");

//     // Redirect to the real payments page
//     res.redirect("/students/payments");
//   } catch (err) {
//     console.error("Error in getMyPayments:", err);
//     req.flash("error_msg", "An error occurred.");
//     res.redirect("/dashboard/student");
//   }
// };

// exports.getMyPayments = async (req, res) => {
//   try {
//     console.log("✅ getMyPayments route was hit successfully");

//     // DEMO DATA for testing the view
//     const demoPayments = [
//       {
//         _id: "123456789",
//         reference: "PAY-001",
//         createdAt: new Date(),
//         category: "Tuition",
//         description: "Semester 1 Fees",
//         amount: 5000,
//         balanceAfterPayment: 0,
//         status: "Verified",
//         method: "Bank Transfer",
//         programme: { name: "Computer Science", code: "CS101" },
//       },
//       {
//         _id: "987654321",
//         reference: "PAY-002",
//         createdAt: new Date(),
//         category: "Application Fee",
//         description: "Application processing",
//         amount: 350,
//         balanceAfterPayment: 0,
//         status: "Verified",
//         method: "Mobile Money",
//         programme: { name: "Computer Science", code: "CS101" },
//       },
//     ];

//     const demoSummary = {
//       totalPaid: 5350,
//       totalDue: 5350,
//       totalBalance: 0,
//       paymentCount: 2,
//       verifiedCount: 2,
//       pendingCount: 0,
//       totalPaidFormatted: "5350.00",
//       totalDueFormatted: "5350.00",
//       totalBalanceFormatted: "0.00",
//       completionPercentage: 100,
//     };

//     const demoCategories = ["Tuition", "Application Fee", "Library Fee"];
//     const demoStatuses = [
//       "Pending",
//       "Verified",
//       "Partially Paid",
//       "Fully Paid",
//       "Rejected",
//       "Cancelled",
//     ];

//     // RENDER the payments.ejs view with demo data
//     res.render("students/payments", {
//       title: "My Payments - TEST MODE",
//       user: req.user,
//       payments: demoPayments,
//       summary: demoSummary,
//       categories: demoCategories,
//       statuses: demoStatuses,
//       currentCategory: "",
//       currentStatus: "",
//       pagination: {
//         currentPage: 1,
//         totalPages: 1,
//         totalCount: 2,
//         limit: 20,
//         hasNextPage: false,
//         hasPrevPage: false,
//       },
//     });
//   } catch (err) {
//     console.error("Error in demo payments:", err);
//     req.flash("error_msg", "An error occurred.");
//     res.redirect("/dashboard/student");
//   }
// };

/**
 * Get all payments for the logged-in student
 */
exports.getMyPayments = async (req, res) => {
  try {
    console.log(
      "✅ getMyPayments route was hit successfully - Loading real data",
    );

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = (req.query.category || "").trim();
    const status = (req.query.status || "").trim();

    const skip = (page - 1) * limit;

    // ===============================
    // 1️⃣ BUILD QUERY FOR THIS STUDENT ONLY
    // ===============================
    const query = {
      student: req.user._id, // Only show payments for logged-in student
    };

    // Apply category filter if provided
    if (category) {
      query.category = category;
    }

    // Apply status filter if provided
    if (status) {
      query.status = status;
    }

    // ===============================
    // 2️⃣ FETCH PAYMENTS WITH POPULATION
    // ===============================
    const payments = await Payment.find(query)
      .populate({
        path: "programme",
        select: "name code",
      })
      .populate({
        path: "verifiedBy",
        select: "firstName surname",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Payment.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // ===============================
    // 3️⃣ CALCULATE STUDENT'S PAYMENT SUMMARY
    // ===============================
    const summary = await Payment.aggregate([
      { $match: { student: req.user._id } },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amount" },
          totalDue: { $sum: "$totalDue" },
          totalBalance: { $sum: "$balanceAfterPayment" },
          paymentCount: { $sum: 1 },
          verifiedCount: {
            $sum: {
              $cond: [{ $in: ["$status", ["Verified", "Fully Paid"]] }, 1, 0],
            },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
          },
        },
      },
    ]);

    const paymentSummary =
      summary.length > 0
        ? summary[0]
        : {
            totalPaid: 0,
            totalDue: 0,
            totalBalance: 0,
            paymentCount: 0,
            verifiedCount: 0,
            pendingCount: 0,
          };

    // Calculate total paid (amount already paid) vs total due
    paymentSummary.totalPaidFormatted = paymentSummary.totalPaid.toFixed(2);
    paymentSummary.totalDueFormatted = paymentSummary.totalDue.toFixed(2);
    paymentSummary.totalBalanceFormatted =
      paymentSummary.totalBalance.toFixed(2);
    paymentSummary.completionPercentage =
      paymentSummary.totalDue > 0
        ? Math.round((paymentSummary.totalPaid / paymentSummary.totalDue) * 100)
        : 0;

    // ===============================
    // 4️⃣ GENERATE SIGNED URLS FOR RECEIPTS
    // ===============================
    for (const payment of payments) {
      if (payment.receipt && payment.receipt.gcsPath) {
        try {
          payment.receipt.signedUrl = await generateSignedUrl(
            payment.receipt.gcsPath,
          );
        } catch (error) {
          console.error("Error generating receipt signed URL:", error);
          payment.receipt.signedUrl = payment.receipt.gcsUrl || null;
        }
      }

      if (payment.proofOfPayment && payment.proofOfPayment.gcsPath) {
        try {
          payment.proofOfPayment.signedUrl = await generateSignedUrl(
            payment.proofOfPayment.gcsPath,
          );
        } catch (error) {
          console.error("Error generating proof signed URL:", error);
          payment.proofOfPayment.signedUrl =
            payment.proofOfPayment.gcsUrl || null;
        }
      }

      // Format dates for display
      if (payment.createdAt) {
        payment.formattedDate = new Date(payment.createdAt).toLocaleDateString(
          "en-GB",
        );
        payment.formattedTime = new Date(payment.createdAt).toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
          },
        );
      }

      if (payment.verifiedAt) {
        payment.formattedVerifiedDate = new Date(
          payment.verifiedAt,
        ).toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      if (payment.paymentReceivedOn) {
        payment.formattedReceivedDate = new Date(
          payment.paymentReceivedOn,
        ).toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    }

    // ===============================
    // 5️⃣ GET UNIQUE CATEGORIES FOR FILTER DROPDOWN
    // ===============================
    const categories = await Payment.distinct("category", {
      student: req.user._id,
    });

    const statuses = [
      "Pending",
      "Verified",
      "Partially Paid",
      "Fully Paid",
      "Rejected",
      "Cancelled",
    ];

    // Log success for debugging
    console.log(
      `✅ Found ${payments.length} payments for student ${req.user._id}`,
    );

    // ===============================
    // 6️⃣ RENDER THE PAYMENTS VIEW WITH REAL DATA
    // ===============================
    res.render("students/payments", {
      title: "My Payments",
      user: req.user,
      payments,
      summary: paymentSummary,
      categories,
      statuses,
      currentCategory: category,
      currentStatus: status,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("❌ Error loading student payments:", err);
    req.flash("error_msg", "Failed to load your payment records.");
    res.redirect("/dashboard/student");
  }
};

/**
 * View/download a specific payment receipt (student version)
 */
exports.viewMyReceipt = async (req, res) => {
  try {
    const paymentId = req.params.id;

    // Find payment and verify it belongs to this student
    const payment = await Payment.findOne({
      _id: paymentId,
      student: req.user._id,
    });

    if (!payment || !payment.receipt || !payment.receipt.gcsPath) {
      req.flash(
        "error_msg",
        "Receipt not found or you don't have permission to access it.",
      );
      return res.redirect("/student/payments");
    }

    // Generate signed URL and redirect
    const signedUrl = await generateSignedUrl(payment.receipt.gcsPath);
    return res.redirect(signedUrl);
  } catch (err) {
    console.error("Error viewing receipt:", err);
    req.flash("error_msg", "Failed to load receipt.");
    res.redirect("/student/payments");
  }
};

/**
 * View proof of payment (student version)
 */
exports.viewMyProofOfPayment = async (req, res) => {
  try {
    const paymentId = req.params.id;

    const payment = await Payment.findOne({
      _id: paymentId,
      student: req.user._id,
    });

    if (
      !payment ||
      !payment.proofOfPayment ||
      !payment.proofOfPayment.gcsPath
    ) {
      req.flash("error_msg", "Proof of payment not found.");
      return res.redirect("/student/payments");
    }

    const signedUrl = await generateSignedUrl(payment.proofOfPayment.gcsPath);
    return res.redirect(signedUrl);
  } catch (err) {
    console.error("Error viewing proof:", err);
    req.flash("error_msg", "Failed to load proof of payment.");
    res.redirect("/student/payments");
  }
};
