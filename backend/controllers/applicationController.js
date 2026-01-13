// controllers/applicationController.js
const Programme = require("../models/Programme");
const Application = require("../models/Application");
const { uploadToGCS } = require("../config/gcsUpload");
const User = require("../models/User");
// Add this with your other imports at the top:
const Payment = require("../models/Payment");
const { sendEmail } = require("../utils/mailer");

const { generateSignedUrl } = require("../config/gcsUpload");

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

exports.submitApplication = async (req, res) => {
  try {
    const {
      firstChoice,
      secondChoice,
      paymentMethod,
      paymentAmount,
      paymentDescription,
      modeOfStudy, // ✅ ADD THIS LINE
    } = req.body;

    // Default paymentAmount → 0
    const amountToSave = paymentAmount ? parseFloat(paymentAmount) : 0;
    const applicationYear = new Date().getFullYear();

    const programme = await Programme.findById(firstChoice);
    if (!programme) {
      req.flash("error_msg", "Invalid programme selected");
      return res.redirect("back");
    }

    const programmeCode = programme.code;

    // ✅ Upload supporting documents
    const gcsDocs = [];
    for (const file of req.files) {
      const uploaded = await uploadToGCS(
        file,
        req.user,
        programmeCode,
        applicationYear
      );

      gcsDocs.push({
        name: file.originalname,
        gcsUrl: uploaded.publicUrl,
        gcsPath: uploaded.path,
      });
    }

    // ✅ 1. FIRST create the application WITHOUT payment
    const application = await Application.create({
      applicant: req.user._id,
      firstChoice,
      secondChoice: secondChoice || null,
      modeOfStudy: modeOfStudy || "Full Time", // ✅ ADD THIS LINE (with default)
      documents: gcsDocs,
      // NO payment field here - it will be added after creating Payment record
    });

    // ✅ 2. CREATE PAYMENT RECORD if amount > 0
    if (amountToSave > 0) {
      const payment = await Payment.create({
        student: req.user._id,
        application: application._id, // Link to application
        programme: firstChoice,
        category: "Application Fee",
        description: paymentDescription || "Application Fee",
        amount: amountToSave,
        totalDue: amountToSave, // For application fee, total = amount
        balanceAfterPayment: 0, // Application fee is paid in full
        method: paymentMethod,
        currency: "ZMW",
        reference: `APP-${Date.now().toString().slice(-8)}`,
        status: "Pending", // Student payments need verification
        remarks: "Submitted with application - pending verification",
        // Use first document as proof if exists
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

      // ✅ 3. LINK PAYMENT TO APPLICATION
      application.payment = payment._id;
      await application.save();
    }

    // ✅ Send confirmation email (updated with modeOfStudy)
    if (req.user.email) {
      await sendEmail({
        to: req.user.email,
        subject: "📄 Application Submitted Successfully",
        html: `
          <p>Dear ${req.user.firstName},</p>
          <p>Your application has been <strong>submitted successfully</strong>.</p>
          <p><strong>Application ID:</strong> ${application._id}</p>
          <p><strong>Programme:</strong> ${programme.name}</p>
          <p><strong>Mode of Study:</strong> ${
            modeOfStudy || "Full Time"
          }</p> <!-- ✅ ADD THIS LINE -->
          ${
            amountToSave > 0
              ? `<p><strong>Application Fee:</strong> ZMW ${amountToSave.toFixed(
                  2
                )} (Pending Verification)</p>`
              : ""
          }
          <p><strong>Status:</strong> Under Review</p>
          <p>Regards,<br/>Admissions Office</p>
        `,
      });
    }

    req.flash("success_msg", "Application submitted successfully!");
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
      application.payment.receipt.gcsPath
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
      (s) => s.semester == semester && s.academicYear === academicYear
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
