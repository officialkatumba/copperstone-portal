// controllers/studentController.js

const Payment = require("../models/Payment");
const User = require("../models/User");
const Application = require("../models/Application");
const { generateSignedUrl } = require("../config/gcsUpload");

/**
 * Get all payments for the logged-in student
 */
exports.getMyPayments = async (req, res) => {
  try {
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
          rejectedCount: {
            $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
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
            rejectedCount: 0,
            cancelledCount: 0,
          };

    // Calculate derived values
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
    console.error("Error loading student payments:", err);
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

/**
 * Get student dashboard data
 */
exports.getStudentDashboard = async (req, res) => {
  try {
    // Get student's applications
    const applications = await Application.find({ applicant: req.user._id })
      .populate("firstChoice", "name code")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get recent payments
    const recentPayments = await Payment.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get payment summary
    const paymentSummary = await Payment.aggregate([
      { $match: { student: req.user._id } },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amount" },
          totalDue: { $sum: "$totalDue" },
          totalBalance: { $sum: "$balanceAfterPayment" },
        },
      },
    ]);

    const summary =
      paymentSummary.length > 0
        ? paymentSummary[0]
        : {
            totalPaid: 0,
            totalDue: 0,
            totalBalance: 0,
          };

    res.render("students/dashboard", {
      title: "Student Dashboard",
      user: req.user,
      applications,
      recentPayments,
      summary,
    });
  } catch (err) {
    console.error("Error loading student dashboard:", err);
    req.flash("error_msg", "Failed to load dashboard.");
    res.redirect("/");
  }
};

/**
 * Get student profile
 */
exports.getStudentProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .populate("programme", "name code")
      .lean();

    res.render("students/profile", {
      title: "My Profile",
      user: student,
    });
  } catch (err) {
    console.error("Error loading student profile:", err);
    req.flash("error_msg", "Failed to load profile.");
    res.redirect("/dashboard/student");
  }
};

/**
 * Update student profile
 */
exports.updateStudentProfile = async (req, res) => {
  try {
    const {
      firstName,
      surname,
      email,
      mobile,
      dateOfBirth,
      gender,
      nationality,
      address,
      city,
      province,
      postalCode,
    } = req.body;

    // Update user basic info
    await User.findByIdAndUpdate(req.user._id, {
      firstName,
      surname,
      email,
      mobile,
      dateOfBirth,
      gender,
      nationality,
      address,
      city,
      province,
      postalCode,
    });

    req.flash("success_msg", "Profile updated successfully!");
    res.redirect("/student/profile");
  } catch (err) {
    console.error("Error updating profile:", err);
    req.flash("error_msg", "Failed to update profile.");
    res.redirect("/student/profile");
  }
};
