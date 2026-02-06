// const Payment = require("../models/Payment");

// /**
//  * VC – View All Payments
//  * Features:
//  *  - View all payments
//  *  - Filter by month (YYYY-MM)
//  *  - Filter by custom date range (from → to)
//  */
// exports.viewAllPaymentsVC = async (req, res) => {
//   try {
//     const { month, from, to } = req.query;

//     let filter = {};

//     // ===============================
//     // FILTER BY MONTH (YYYY-MM)
//     // ===============================
//     if (month) {
//       const startDate = new Date(`${month}-01`);
//       const endDate = new Date(startDate);
//       endDate.setMonth(endDate.getMonth() + 1);

//       filter.createdAt = { $gte: startDate, $lt: endDate };
//     }

//     // ===============================
//     // FILTER BY CUSTOM DATE RANGE
//     // ===============================
//     if (from && to) {
//       filter.createdAt = {
//         $gte: new Date(from),
//         $lte: new Date(to),
//       };
//     }

//     // ===============================
//     // FETCH PAYMENTS
//     // ===============================
//     const payments = await Payment.find(filter)
//       .populate("student", "firstName surname email")
//       .sort({ createdAt: -1 })
//       .lean(); // lean() for faster queries and plain objects

//     // ===============================
//     // CALCULATE SUMMARY
//     // ===============================
//     const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
//     const verifiedCount = payments.filter(
//       (p) => p.status === "Verified"
//     ).length;
//     const pendingCount = payments.filter((p) => p.status === "Pending").length;

//     // ===============================
//     // RENDER VC PAYMENTS VIEW
//     // ===============================
//     res.render("vc/payments", {
//       title: "VC Dashboard - All Payments",
//       payments,
//       filters: { month: month || "", from: from || "", to: to || "" },
//       summary: { totalAmount, verifiedCount, pendingCount },
//       user: req.user,
//     });
//   } catch (error) {
//     console.error("❌ VC PAYMENTS ERROR:", error);
//     req.flash("error_msg", "Unable to load payments.");
//     res.redirect("/dashboard/vc");
//   }
// };

const User = require("../models/User");
const Payment = require("../models/Payment");
const Course = require("../models/Course");
// const Department = require("../models/Department");

// Middleware for VC access
exports.ensureVC = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === "VC") return next();
  req.flash("error_msg", "Access denied. VC privileges required.");
  res.redirect("/login");
};

// ----------------- Controllers -----------------

exports.vcDashboard = (req, res) => res.redirect("/dashboard/vc");

exports.manageDeans = async (req, res) => {
  try {
    const deans = await User.find({ role: "Dean" })
      .select("firstName surname email mobile department position createdAt")
      .sort({ surname: 1 });

    res.render("vc/manageDeans", {
      title: "Manage Deans",
      user: req.user,
      deans,
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to load deans");
    res.redirect("/dashboard/vc");
  }
};

exports.manageHODs = async (req, res) => {
  try {
    const hods = await User.find({ role: "HOD" })
      .select("firstName surname email mobile department faculty position")
      .populate("department", "name code")
      .sort({ surname: 1 });

    res.render("vc/manageHODs", {
      title: "Manage Heads of Department",
      user: req.user,
      hods,
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to load HODs");
    res.redirect("/dashboard/vc");
  }
};

exports.manageDVCs = async (req, res) => {
  try {
    const dvcs = await User.find({ role: "DVC" })
      .select("firstName surname email mobile portfolio position")
      .sort({ surname: 1 });

    res.render("vc/manageDVCs", {
      title: "Manage Deputy Vice-Chancellors",
      user: req.user,
      dvcs,
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to load DVCs");
    res.redirect("/dashboard/vc");
  }
};

exports.academicReports = (req, res) =>
  res.render("vc/academicReports", {
    title: "University Academic Reports",
    user: req.user,
  });

exports.disciplineCases = async (req, res) => {
  try {
    const disciplineCases = []; // fetch from DB when model exists
    res.render("vc/discipline", {
      title: "Student Discipline Cases",
      user: req.user,
      disciplineCases,
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to load discipline cases");
    res.redirect("/dashboard/vc");
  }
};

exports.approveAppointment = async (req, res) => {
  try {
    const { userId } = req.params;
    const { position, effectiveDate } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("back");
    }

    user.position = position;
    user.appointmentDate = effectiveDate;
    user.approvedBy = req.user._id;
    user.approvalDate = new Date();

    await user.save();
    req.flash(
      "success_msg",
      `Successfully appointed ${user.firstName} ${user.surname} as ${position}`,
    );
    res.redirect("back");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to process appointment");
    res.redirect("back");
  }
};

exports.universityStatistics = async (req, res) => {
  try {
    const [
      studentCount,
      staffCount,
      courseCount,
      departmentCount,
      recentAdmissions,
    ] = await Promise.all([
      User.countDocuments({ role: "Student" }),
      User.countDocuments({
        role: { $in: ["TeachingStaff", "Dean", "HOD", "DVC"] },
      }),
      Course.countDocuments(),
      Department.countDocuments(),
      User.find({ role: "Student" })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("firstName surname email createdAt"),
    ]);

    res.render("vc/statistics", {
      title: "University Statistics",
      user: req.user,
      stats: {
        studentCount,
        staffCount,
        courseCount,
        departmentCount,
        recentAdmissions,
      },
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to load statistics");
    res.redirect("/dashboard/vc");
  }
};

exports.vcInbox = (req, res) =>
  res.render("vc/inbox", { title: "VC's Inbox", user: req.user });
exports.activityLog = (req, res) =>
  res.render("vc/activityLog", { title: "Activity Log", user: req.user });

// exports.viewAllPaymentsVC = async (req, res) => {
//   try {
//     const payments = await Payment.find()
//       .populate("student", "firstName surname email")
//       .sort({ createdAt: -1 });
//     res.render("vc/payments", {
//       title: "VC - All Payments",
//       payments,
//       user: req.user,
//     });
//   } catch (err) {
//     console.error(err);
//     req.flash("error_msg", "Failed to load payments.");
//     res.redirect("/dashboard/vc");
//   }
// };

// exports.viewAllPaymentsVC = async (req, res) => {
//   try {
//     const payments = await Payment.find()
//       .populate("student", "firstName surname email")
//       .sort({ createdAt: -1 })
//       .lean();

//     // Get current date info
//     const now = new Date();
//     const startOfToday = new Date(
//       now.getFullYear(),
//       now.getMonth(),
//       now.getDate()
//     );
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfYear = new Date(now.getFullYear(), 0, 1);

//     // Compute totals
//     let totalToday = 0,
//       totalThisMonth = 0,
//       totalThisYear = 0;

//     payments.forEach((p) => {
//       const created = new Date(p.createdAt);
//       if (created >= startOfToday) totalToday += p.amount;
//       if (created >= startOfMonth) totalThisMonth += p.amount;
//       if (created >= startOfYear) totalThisYear += p.amount;
//     });

//     res.render("vc/payments", {
//       title: "VC - All Payments",
//       payments,
//       user: req.user,
//       totals: {
//         today: totalToday,
//         month: totalThisMonth,
//         year: totalThisYear,
//       },
//     });
//   } catch (err) {
//     console.error("VC Payments error:", err);
//     req.flash("error_msg", "Failed to load payments.");
//     res.redirect("/dashboard/vc");
//   }
// };

// exports.viewAllPaymentsVC = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1; // Current page
//     const limit = parseInt(req.query.limit) || 10; // Items per page (5,10,20,50,100)
//     const skip = (page - 1) * limit;

//     // Fetch total payments count
//     const totalPayments = await Payment.countDocuments();

//     // Fetch payments with pagination
//     const payments = await Payment.find()
//       .populate("student", "firstName surname email")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean();

//     // Compute totals
//     const now = new Date();
//     const startOfToday = new Date(
//       now.getFullYear(),
//       now.getMonth(),
//       now.getDate()
//     );
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfYear = new Date(now.getFullYear(), 0, 1);

//     let totalToday = 0,
//       totalThisMonth = 0,
//       totalThisYear = 0;
//     payments.forEach((p) => {
//       const created = new Date(p.createdAt);
//       if (created >= startOfToday) totalToday += p.amount;
//       if (created >= startOfMonth) totalThisMonth += p.amount;
//       if (created >= startOfYear) totalThisYear += p.amount;
//     });

//     const totalPages = Math.ceil(totalPayments / limit);

//     res.render("vc/payments", {
//       title: "VC - All Payments",
//       payments,
//       user: req.user,
//       totals: { today: totalToday, month: totalThisMonth, year: totalThisYear },
//       pagination: { page, limit, totalPages },
//       limitOptions: [5, 10, 20, 50, 100],
//     });
//   } catch (err) {
//     console.error("VC Payments error:", err);
//     req.flash("error_msg", "Failed to load payments.");
//     res.redirect("/dashboard/vc");
//   }
// };

// const Payment = require("../models/Payment");
const mongoose = require("mongoose");

// Helper: start of day/month/year
const getStartOfDay = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};
const getStartOfMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};
const getStartOfYear = () => {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1);
};

// exports.viewAllPaymentsVC = async (req, res) => {
//   try {
//     // Query params
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const search = req.query.search || "";

//     // Build search filter
//     const searchFilter = {};
//     if (search) {
//       const regex = new RegExp(search, "i");
//       searchFilter.$or = [
//         { _id: mongoose.Types.ObjectId.isValid(search) ? search : null },
//         { "student.firstName": regex },
//         { "student.surname": regex },
//         { "student.email": regex },
//       ];
//     }

//     // ---------------- Totals ----------------
//     const todayStart = getStartOfDay();
//     const monthStart = getStartOfMonth();
//     const yearStart = getStartOfYear();

//     const [totalToday, totalMonth, totalYear] = await Promise.all([
//       Payment.aggregate([
//         { $match: { createdAt: { $gte: todayStart } } },
//         { $group: { _id: null, total: { $sum: "$amount" } } },
//       ]),
//       Payment.aggregate([
//         { $match: { createdAt: { $gte: monthStart } } },
//         { $group: { _id: null, total: { $sum: "$amount" } } },
//       ]),
//       Payment.aggregate([
//         { $match: { createdAt: { $gte: yearStart } } },
//         { $group: { _id: null, total: { $sum: "$amount" } } },
//       ]),
//     ]);

//     const totals = {
//       today: totalToday[0]?.total || 0,
//       month: totalMonth[0]?.total || 0,
//       year: totalYear[0]?.total || 0,
//       todayDate: todayStart.toLocaleDateString(),
//       monthStart: monthStart.toLocaleDateString(),
//       yearStart: yearStart.toLocaleDateString(),
//     };

//     // ---------------- Paginated Payments ----------------
//     const skip = (page - 1) * limit;

//     const paymentsQuery = Payment.find(searchFilter)
//       .populate("student", "firstName surname email")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit);

//     const [payments, totalPayments] = await Promise.all([
//       paymentsQuery,
//       Payment.countDocuments(searchFilter),
//     ]);

//     const totalPages = Math.ceil(totalPayments / limit);

//     const limitOptions = [5, 10, 20, 50, 100];

//     res.render("vc/payments", {
//       title: "VC Dashboard - All Payments",
//       payments,
//       totals,
//       pagination: { page, limit, totalPages },
//       search,
//       limitOptions,
//       user: req.user,
//     });
//   } catch (err) {
//     console.error("VC Payments error:", err);
//     req.flash("error_msg", "Unable to load payments.");
//     res.redirect("/dashboard/vc");
//   }
// };

// const Payment = require("../models/Payment");
// const mongoose = require("mongoose");

// // ----------------- VC – View All Payments -----------------
// exports.viewAllPaymentsVC = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search } = req.query;
//     const parsedLimit = parseInt(limit) || 10;
//     const parsedPage = parseInt(page) || 1;

//     // ----------------- Build Filter -----------------
//     let filter = {};
//     if (search) {
//       const regex = new RegExp(search, "i");
//       const orConditions = [
//         { category: regex },
//         { method: regex },
//         { status: regex },
//         { description: regex },
//       ];
//       if (mongoose.Types.ObjectId.isValid(search)) {
//         orConditions.push({ _id: search });
//       }
//       filter.$or = orConditions;
//     }

//     // ----------------- Fetch Payments -----------------
//     const payments = await Payment.find(filter)
//       .populate("student", "firstName surname email")
//       .sort({ createdAt: -1 })
//       .skip((parsedPage - 1) * parsedLimit)
//       .limit(parsedLimit)
//       .lean();

//     const totalPaymentsCount = await Payment.countDocuments(filter);

//     // ----------------- Summary Calculations -----------------
//     const now = new Date();
//     const startOfToday = new Date(
//       now.getFullYear(),
//       now.getMonth(),
//       now.getDate(),
//     );
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfYear = new Date(now.getFullYear(), 0, 1);

//     const [totalToday, totalMonth, totalYear, totalAll] = await Promise.all([
//       Payment.aggregate([
//         { $match: { createdAt: { $gte: startOfToday } } },
//         { $group: { _id: null, sum: { $sum: "$amount" } } },
//       ]),
//       Payment.aggregate([
//         { $match: { createdAt: { $gte: startOfMonth } } },
//         { $group: { _id: null, sum: { $sum: "$amount" } } },
//       ]),
//       Payment.aggregate([
//         { $match: { createdAt: { $gte: startOfYear } } },
//         { $group: { _id: null, sum: { $sum: "$amount" } } },
//       ]),
//       Payment.aggregate([{ $group: { _id: null, sum: { $sum: "$amount" } } }]),
//     ]);

//     res.render("vc/payments", {
//       title: "VC Dashboard - All Payments",
//       payments,
//       totalToday: totalToday[0]?.sum || 0,
//       totalMonth: totalMonth[0]?.sum || 0,
//       totalYear: totalYear[0]?.sum || 0,
//       totalAll: totalAll[0]?.sum || 0,
//       today: startOfToday.toLocaleDateString(),
//       monthRange: `${startOfMonth.toLocaleDateString()} - ${now.toLocaleDateString()}`,
//       yearRange: `${startOfYear.toLocaleDateString()} - ${now.toLocaleDateString()}`,
//       currentPage: parsedPage,
//       totalPages: Math.ceil(totalPaymentsCount / parsedLimit),
//       limit: parsedLimit,
//       search: search || "",
//       user: req.user,
//     });
//   } catch (err) {
//     console.error("VC Payments Error:", err);
//     req.flash("error_msg", "Unable to load payments.");
//     res.redirect("/dashboard/vc");
//   }
// };

// // vcController.js - Updated viewAllPaymentsVC function
// exports.viewAllPaymentsVC = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20;
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

//     // STUDENT SEARCH (name OR email OR NURTE)
//     if (search) {
//       const students = await User.find({
//         role: "Student",
//         $or: [
//           { firstName: new RegExp(search, "i") },
//           { surname: new RegExp(search, "i") },
//           { email: new RegExp(search, "i") },
//           { "studentProfile.nurteNumber": new RegExp(search, "i") },
//         ],
//       }).select("_id");

//       query.student = { $in: students.map((s) => s._id) };
//     }

//     // ============================
//     // PAYMENTS
//     // ============================
//     const payments = await Payment.find(query)
//       .populate("student", "firstName surname email studentProfile.nurteNumber")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean();

//     const totalCount = await Payment.countDocuments(query);
//     const totalPages = Math.ceil(totalCount / limit);

//     // ============================
//     // SUMMARY TOTALS FOR ALL PAYMENTS
//     // ============================
//     const now = new Date();
//     const startOfToday = new Date(now.setHours(0, 0, 0, 0));
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfYear = new Date(now.getFullYear(), 0, 1);

//     const sum = async (from, additionalQuery = {}) => {
//       const matchQuery = { createdAt: { $gte: from } };
//       if (additionalQuery.category) {
//         matchQuery.category = additionalQuery.category;
//       }

//       const r = await Payment.aggregate([
//         { $match: matchQuery },
//         { $group: { _id: null, total: { $sum: "$amount" } } },
//       ]);
//       return r.length ? r[0].total : 0;
//     };

//     // Overall totals
//     const [totalToday, totalMonth, totalYear, totalAll] = await Promise.all([
//       sum(startOfToday),
//       sum(startOfMonth),
//       sum(startOfYear),
//       sum(new Date(0)),
//     ]);

//     // ============================
//     // CATEGORY-SPECIFIC TOTALS FOR SUMMARY CARDS
//     // ============================
//     const categoryTotals = await Payment.aggregate([
//       {
//         $group: {
//           _id: "$category",
//           totalAmount: { $sum: "$amount" },
//           count: { $sum: 1 },
//         },
//       },
//     ]);

//     // Extract specific category totals
//     const tuitionTotal =
//       categoryTotals.find((c) => c._id === "Tuition Fee (Per Semester)")
//         ?.totalAmount || 0;
//     const boardingTotal =
//       categoryTotals.find((c) => c._id === "Boarding Fee")?.totalAmount || 0;
//     const applicationTotal =
//       categoryTotals.find((c) => c._id === "Application Fee")?.totalAmount || 0;
//     const registrationTotal =
//       categoryTotals.find((c) => c._id === "Registration Fee")?.totalAmount ||
//       0;
//     const examTotal =
//       categoryTotals.find((c) => c._id === "Exam Fee")?.totalAmount || 0;
//     const graduationTotal =
//       categoryTotals.find((c) => c._id === "Graduation Fee")?.totalAmount || 0;
//     const otherTotal =
//       categoryTotals.find((c) => c._id === "Other")?.totalAmount || 0;

//     // Calculate total outstanding balances
//     const balanceAggregation = await Payment.aggregate([
//       {
//         $group: {
//           _id: null,
//           totalBalance: { $sum: "$balanceAfterPayment" },
//         },
//       },
//     ]);

//     const totalBalanceOutstanding = balanceAggregation[0]?.totalBalance || 0;

//     res.render("vc/payments", {
//       title: "VC Dashboard - All Payments",
//       payments,

//       // Summary cards data
//       tuitionTotal,
//       boardingTotal,
//       applicationTotal,
//       registrationTotal,
//       examTotal,
//       graduationTotal,
//       otherTotal,
//       totalBalanceOutstanding,
//       totalAll,

//       // Time-based totals
//       totalToday,
//       totalMonth,
//       totalYear,

//       today: new Date().toLocaleDateString(),
//       monthRange: `${startOfMonth.toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
//       yearRange: `${startOfYear.getFullYear()} - ${new Date().getFullYear()}`,

//       // Filters
//       search,
//       category,

//       // Pagination
//       currentPage: page,
//       totalPages,
//       totalCount,
//       limit,

//       user: req.user,
//     });
//   } catch (err) {
//     console.error("VC Payments Error:", err);
//     req.flash("error_msg", "Unable to load payments.");
//     res.redirect("/dashboard/vc");
//   }
// };

// // vcController.js - Updated viewAllPaymentsVC function
// exports.viewAllPaymentsVC = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 20;
//     const search = (req.query.search || "").trim();
//     const category = (req.query.category || "").trim();
//     const skip = (page - 1) * limit;

//     // ============================
//     // BUILD QUERY
//     // ============================
//     const query = {};
//     if (category) query.category = category;

//     if (search) {
//       const students = await User.find({
//         role: "Student",
//         $or: [
//           { firstName: new RegExp(search, "i") },
//           { surname: new RegExp(search, "i") },
//           { email: new RegExp(search, "i") },
//           { "studentProfile.nurteNumber": new RegExp(search, "i") },
//         ],
//       }).select("_id");
//       query.student = { $in: students.map((s) => s._id) };
//     }

//     // ============================
//     // PAYMENTS
//     // ============================
//     const payments = await Payment.find(query)
//       .populate("student", "firstName surname email studentProfile.nurteNumber")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean();

//     const totalCount = await Payment.countDocuments(query);
//     const totalPages = Math.ceil(totalCount / limit);

//     // ============================
//     // DATE SETUP
//     // ============================
//     const now = new Date();
//     const startOfToday = new Date(
//       now.getFullYear(),
//       now.getMonth(),
//       now.getDate(),
//     );
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfYear = new Date(now.getFullYear(), 0, 1);

//     // ============================
//     // ALL TIME CATEGORY TOTALS
//     // ============================
//     const categoryTotals = await Payment.aggregate([
//       {
//         $group: {
//           _id: "$category",
//           totalAmount: { $sum: "$amount" },
//           count: { $sum: 1 },
//         },
//       },
//     ]);

//     // Extract specific category totals (All Time)
//     const tuitionTotal =
//       categoryTotals.find((c) => c._id === "Tuition Fee (Per Semester)")
//         ?.totalAmount || 0;
//     const boardingTotal =
//       categoryTotals.find((c) => c._id === "Boarding Fee")?.totalAmount || 0;
//     const applicationTotal =
//       categoryTotals.find((c) => c._id === "Application Fee")?.totalAmount || 0;
//     const registrationTotal =
//       categoryTotals.find((c) => c._id === "Registration Fee")?.totalAmount ||
//       0;
//     const examTotal =
//       categoryTotals.find((c) => c._id === "Exam Fee")?.totalAmount || 0;
//     const graduationTotal =
//       categoryTotals.find((c) => c._id === "Graduation Fee")?.totalAmount || 0;
//     const otherTotal =
//       categoryTotals.find((c) => c._id === "Other")?.totalAmount || 0;

//     // ============================
//     // TODAY'S CATEGORY TOTALS
//     // ============================
//     const todayCategoryTotals = await Payment.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: startOfToday },
//         },
//       },
//       {
//         $group: {
//           _id: "$category",
//           totalAmount: { $sum: "$amount" },
//           count: { $sum: 1 },
//         },
//       },
//     ]);

//     // Extract specific category totals (Today)
//     const todayTuition =
//       todayCategoryTotals.find((c) => c._id === "Tuition Fee (Per Semester)")
//         ?.totalAmount || 0;
//     const todayBoarding =
//       todayCategoryTotals.find((c) => c._id === "Boarding Fee")?.totalAmount ||
//       0;
//     const todayApplication =
//       todayCategoryTotals.find((c) => c._id === "Application Fee")
//         ?.totalAmount || 0;
//     const todayRegistration =
//       todayCategoryTotals.find((c) => c._id === "Registration Fee")
//         ?.totalAmount || 0;
//     const todayExam =
//       todayCategoryTotals.find((c) => c._id === "Exam Fee")?.totalAmount || 0;
//     const todayGraduation =
//       todayCategoryTotals.find((c) => c._id === "Graduation Fee")
//         ?.totalAmount || 0;
//     const todayOther =
//       todayCategoryTotals.find((c) => c._id === "Other")?.totalAmount || 0;

//     // ============================
//     // OTHER TOTALS
//     // ============================
//     // Overall totals
//     const totalToday = todayCategoryTotals.reduce(
//       (sum, cat) => sum + cat.totalAmount,
//       0,
//     );

//     const [totalMonth, totalYear, totalAll] = await Promise.all([
//       Payment.aggregate([
//         { $match: { createdAt: { $gte: startOfMonth } } },
//         { $group: { _id: null, total: { $sum: "$amount" } } },
//       ]).then((r) => r[0]?.total || 0),

//       Payment.aggregate([
//         { $match: { createdAt: { $gte: startOfYear } } },
//         { $group: { _id: null, total: { $sum: "$amount" } } },
//       ]).then((r) => r[0]?.total || 0),

//       Payment.aggregate([
//         { $group: { _id: null, total: { $sum: "$amount" } } },
//       ]).then((r) => r[0]?.total || 0),
//     ]);

//     // Calculate total outstanding balances
//     const balanceAggregation = await Payment.aggregate([
//       {
//         $group: {
//           _id: null,
//           totalBalance: { $sum: "$balanceAfterPayment" },
//         },
//       },
//     ]);

//     const totalBalanceOutstanding = balanceAggregation[0]?.totalBalance || 0;

//     res.render("vc/payments", {
//       title: "VC Dashboard - All Payments",
//       payments,

//       // ALL TIME totals (Row 1)
//       tuitionTotal,
//       boardingTotal,
//       applicationTotal,
//       registrationTotal,
//       examTotal,
//       graduationTotal,
//       otherTotal,
//       totalBalanceOutstanding,
//       totalAll,

//       // TODAY'S totals (Row 2)
//       todayTuition,
//       todayBoarding,
//       todayApplication,
//       todayRegistration,
//       todayExam,
//       todayGraduation,
//       todayOther,
//       totalToday,

//       // Other time-based totals
//       totalMonth,
//       totalYear,

//       today: new Date().toLocaleDateString(),
//       monthRange: `${startOfMonth.toLocaleDateString()} - ${now.toLocaleDateString()}`,
//       yearRange: `${startOfYear.getFullYear()} - ${now.getFullYear()}`,

//       // Filters
//       search,
//       category,

//       // Pagination
//       currentPage: page,
//       totalPages,
//       totalCount,
//       limit,

//       user: req.user,
//     });
//   } catch (err) {
//     console.error("VC Payments Error:", err);
//     req.flash("error_msg", "Unable to load payments.");
//     res.redirect("/dashboard/vc");
//   }
// };

// vcController.js - Updated viewAllPaymentsVC function
exports.viewAllPaymentsVC = async (req, res) => {
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
    if (category) query.category = category;

    if (search) {
      const students = await User.find({
        role: "Student",
        $or: [
          { firstName: new RegExp(search, "i") },
          { surname: new RegExp(search, "i") },
          { email: new RegExp(search, "i") },
          { "studentProfile.nurteNumber": new RegExp(search, "i") },
        ],
      }).select("_id");
      query.student = { $in: students.map((s) => s._id) };
    }

    // ============================
    // PAYMENTS
    // ============================
    const payments = await Payment.find(query)
      .populate("student", "firstName surname email studentProfile.nurteNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Payment.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // ============================
    // DATE SETUP
    // ============================
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // ============================
    // ALL TIME CATEGORY TOTALS
    // ============================
    const categoryTotals = await Payment.aggregate([
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Extract specific category totals (All Time)
    // FIXED: Match the exact category names from your select dropdown
    const tuitionTotal =
      categoryTotals.find((c) => c._id === "Tuition Fee (Semester)")
        ?.totalAmount || 0;

    const boardingTotal =
      categoryTotals.find((c) => c._id === "Boarding")?.totalAmount || 0;

    const applicationTotal =
      categoryTotals.find((c) => c._id === "Application Fee")?.totalAmount || 0;

    const registrationTotal =
      categoryTotals.find((c) => c._id === "Registration Fee")?.totalAmount ||
      0;

    // FIXED: Include all exam-related categories
    const examTotal = categoryTotals.reduce((sum, cat) => {
      if (cat._id.includes("Exam") || cat._id === "Exam Fee") {
        return sum + cat.totalAmount;
      }
      return sum;
    }, 0);

    const graduationTotal =
      categoryTotals.find((c) => c._id === "Graduation Fee")?.totalAmount || 0;

    const otherTotal =
      categoryTotals.find((c) => c._id === "Other")?.totalAmount || 0;

    // ============================
    // TODAY'S CATEGORY TOTALS
    // ============================
    const todayCategoryTotals = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday },
        },
      },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Extract specific category totals (Today)
    // FIXED: Match the exact category names from your select dropdown
    const todayTuition =
      todayCategoryTotals.find((c) => c._id === "Tuition Fee (Semester)")
        ?.totalAmount || 0;

    const todayBoarding =
      todayCategoryTotals.find((c) => c._id === "Boarding")?.totalAmount || 0;

    const todayApplication =
      todayCategoryTotals.find((c) => c._id === "Application Fee")
        ?.totalAmount || 0;

    const todayRegistration =
      todayCategoryTotals.find((c) => c._id === "Registration Fee")
        ?.totalAmount || 0;

    // FIXED: Include all exam-related categories for today
    const todayExam = todayCategoryTotals.reduce((sum, cat) => {
      if (cat._id.includes("Exam") || cat._id === "Exam Fee") {
        return sum + cat.totalAmount;
      }
      return sum;
    }, 0);

    const todayGraduation =
      todayCategoryTotals.find((c) => c._id === "Graduation Fee")
        ?.totalAmount || 0;

    const todayOther =
      todayCategoryTotals.find((c) => c._id === "Other")?.totalAmount || 0;

    // ============================
    // OTHER TOTALS
    // ============================
    // Overall totals
    const totalToday = todayCategoryTotals.reduce(
      (sum, cat) => sum + cat.totalAmount,
      0,
    );

    const [totalMonth, totalYear, totalAll] = await Promise.all([
      Payment.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).then((r) => r[0]?.total || 0),

      Payment.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).then((r) => r[0]?.total || 0),

      Payment.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).then((r) => r[0]?.total || 0),
    ]);

    // Calculate total outstanding balances
    const balanceAggregation = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalBalance: { $sum: "$balanceAfterPayment" },
        },
      },
    ]);

    const totalBalanceOutstanding = balanceAggregation[0]?.totalBalance || 0;

    res.render("vc/payments", {
      title: "VC Dashboard - All Payments",
      payments,

      // ALL TIME totals (Row 1)
      tuitionTotal,
      boardingTotal,
      applicationTotal,
      registrationTotal,
      examTotal,
      graduationTotal,
      otherTotal,
      totalBalanceOutstanding,
      totalAll,

      // TODAY'S totals (Row 2)
      todayTuition,
      todayBoarding,
      todayApplication,
      todayRegistration,
      todayExam,
      todayGraduation,
      todayOther,
      totalToday,

      // Other time-based totals
      totalMonth,
      totalYear,

      today: new Date().toLocaleDateString(),
      monthRange: `${startOfMonth.toLocaleDateString()} - ${now.toLocaleDateString()}`,
      yearRange: `${startOfYear.getFullYear()} - ${now.getFullYear()}`,

      // Filters
      search,
      category,

      // Pagination
      currentPage: page,
      totalPages,
      totalCount,
      limit,

      user: req.user,
    });
  } catch (err) {
    console.error("VC Payments Error:", err);
    req.flash("error_msg", "Unable to load payments.");
    res.redirect("/dashboard/vc");
  }
};

// vcController.js

// vcController.js
// const User = require("../models/User"); // Make sure to import User model

// exports.vcDashboard = async (req, res) => {
//   try {
//     // Minimal data fetching
//     const totalStudents = await User.countDocuments({ role: "Student" });

//     // Get total staff - check your actual role values in the database
//     const totalStaff = await User.countDocuments({
//       role: {
//         $in: [
//           "staff",
//           "Staff",
//           "lecturer",
//           "Lecturer",
//           "dean",
//           "Dean",
//           "hod",
//           "HOD",
//           "dvc",
//           "DVC",
//           "director",
//           "Director",
//           "admin",
//           "Admin",
//           "academic", // Common role name
//         ],
//       },
//     });

//     // Placeholder stats
//     const pendingApprovals = 0;
//     const activeIssues = 0;

//     res.render("dashboard/vc", {
//       title: "Vice-Chancellor Dashboard",
//       user: req.user,
//       stats: {
//         totalStudents: totalStudents || 0,
//         totalStaff: totalStaff || 0,
//         pendingApprovals: pendingApprovals || 0,
//         activeIssues: activeIssues || 0,
//       },
//     });
//   } catch (err) {
//     console.error("VC Dashboard error:", err);
//     req.flash("error_msg", "Failed to load dashboard");
//     res.redirect("/"); // Redirect to home instead of error page
//   }
// };

// // Add these minimal functions for the other pages
// exports.viewAllPaymentsVC = async (req, res) => {
//   // Your existing payments function - should work as-is
// };

exports.viewAllExpensesVC = async (req, res) => {
  try {
    res.render("vc/expenses", {
      title: "VC Dashboard - All Expenses",
      user: req.user,
      expenses: [], // Add your expense data here
    });
  } catch (err) {
    console.error("VC Expenses Error:", err);
    req.flash("error_msg", "Unable to load expenses.");
    res.redirect("/dashboard/vc");
  }
};

exports.viewAllStaffVC = async (req, res) => {
  try {
    const staff = await User.find({
      role: {
        $in: ["Staff", "Lecturer", "Dean", "HOD", "DVC", "Director", "Admin"],
      },
    })
      .select("firstName surname email role department createdAt")
      .limit(50)
      .lean();

    res.render("vc/staff", {
      title: "VC Dashboard - All Staff",
      user: req.user,
      staff,
    });
  } catch (err) {
    console.error("VC Staff Error:", err);
    req.flash("error_msg", "Unable to load staff.");
    res.redirect("/dashboard/vc");
  }
};

exports.viewReportsVC = async (req, res) => {
  try {
    res.render("vc/reports", {
      title: "VC Dashboard - Reports",
      user: req.user,
    });
  } catch (err) {
    console.error("VC Reports Error:", err);
    req.flash("error_msg", "Unable to load reports.");
    res.redirect("/dashboard/vc");
  }
};
