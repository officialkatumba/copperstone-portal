// // const express = require("express");
// // const router = express.Router();
// // const User = require("../models/User");
// // const { viewAllPaymentsVC } = require("../controllers/vcController.js");

// // // Middleware to ensure VC access
// // function ensureVC(req, res, next) {
// //   if (req.isAuthenticated() && req.user.role === "VC") return next();
// //   req.flash("error_msg", "Access denied. VC privileges required.");
// //   res.redirect("/login");
// // }

// // // VC Dashboard
// // router.get("/vc/dashboard", ensureVC, (req, res) => {
// //   res.redirect("/dashboard/vc");
// // });
// // //
// // // Manage Deans
// // router.get("/vc/manage-deans", ensureVC, async (req, res) => {
// //   try {
// //     const deans = await User.find({ role: "Dean" })
// //       .select("firstName surname email mobile department position createdAt")
// //       .sort({ surname: 1 });

// //     res.render("vc/manageDeans", {
// //       title: "Manage Deans",
// //       user: req.user,
// //       deans,
// //     });
// //   } catch (err) {
// //     console.error("Error fetching deans:", err);
// //     req.flash("error_msg", "Failed to load deans");
// //     res.redirect("/dashboard/vc");
// //   }
// // });

// // // Manage HODs
// // router.get("/vc/manage-hods", ensureVC, async (req, res) => {
// //   try {
// //     const hods = await User.find({ role: "HOD" })
// //       .select("firstName surname email mobile department faculty position")
// //       .populate("department", "name code")
// //       .sort({ surname: 1 });

// //     res.render("vc/manageHODs", {
// //       title: "Manage Heads of Department",
// //       user: req.user,
// //       hods,
// //     });
// //   } catch (err) {
// //     console.error("Error fetching HODs:", err);
// //     req.flash("error_msg", "Failed to load HODs");
// //     res.redirect("/dashboard/vc");
// //   }
// // });

// // // Manage DVCs
// // router.get("/vc/manage-dvcs", ensureVC, async (req, res) => {
// //   try {
// //     const dvcs = await User.find({ role: "DVC" })
// //       .select("firstName surname email mobile portfolio position")
// //       .sort({ surname: 1 });

// //     res.render("vc/manageDVCs", {
// //       title: "Manage Deputy Vice-Chancellors",
// //       user: req.user,
// //       dvcs,
// //     });
// //   } catch (err) {
// //     console.error("Error fetching DVCs:", err);
// //     req.flash("error_msg", "Failed to load DVCs");
// //     res.redirect("/dashboard/vc");
// //   }
// // });

// // // Academic Reports
// // router.get("/vc/reports/academic", ensureVC, (req, res) => {
// //   res.render("vc/academicReports", {
// //     title: "University Academic Reports",
// //     user: req.user,
// //   });
// // });

// // // Student Discipline Cases
// // router.get("/vc/discipline", ensureVC, async (req, res) => {
// //   try {
// //     // You would fetch from a DisciplineCase model
// //     const disciplineCases = []; // Fetch from your database

// //     res.render("vc/discipline", {
// //       title: "Student Discipline Cases",
// //       user: req.user,
// //       disciplineCases,
// //     });
// //   } catch (err) {
// //     console.error("Error fetching discipline cases:", err);
// //     req.flash("error_msg", "Failed to load discipline cases");
// //     res.redirect("/dashboard/vc");
// //   }
// // });

// // // Approve Senior Appointments
// // router.post("/vc/approve-appointment/:userId", ensureVC, async (req, res) => {
// //   try {
// //     const { userId } = req.params;
// //     const { position, effectiveDate, remarks } = req.body;

// //     const user = await User.findById(userId);
// //     if (!user) {
// //       req.flash("error_msg", "User not found");
// //       return res.redirect("back");
// //     }

// //     // Update user position
// //     user.position = position;
// //     user.appointmentDate = effectiveDate;
// //     user.approvedBy = req.user._id;
// //     user.approvalDate = new Date();

// //     await user.save();

// //     // Log the appointment
// //     // await createAuditLog(req.user._id, `Appointed ${user.fullName} as ${position}`, "appointment");

// //     req.flash(
// //       "success_msg",
// //       `Successfully appointed ${user.firstName} ${user.surname} as ${position}`
// //     );
// //     res.redirect("back");
// //   } catch (err) {
// //     console.error("Appointment error:", err);
// //     req.flash("error_msg", "Failed to process appointment");
// //     res.redirect("back");
// //   }
// // });

// // // View University Statistics
// // router.get("/vc/statistics", ensureVC, async (req, res) => {
// //   try {
// //     const User = require("../models/User");
// //     const Course = require("../models/Course");
// //     const Department = require("../models/Department");

// //     const [
// //       studentCount,
// //       staffCount,
// //       courseCount,
// //       departmentCount,
// //       recentAdmissions,
// //     ] = await Promise.all([
// //       User.countDocuments({ role: "Student" }),
// //       User.countDocuments({
// //         role: { $in: ["TeachingStaff", "Dean", "HOD", "DVC"] },
// //       }),
// //       Course.countDocuments(),
// //       Department.countDocuments(),
// //       User.find({ role: "Student" })
// //         .sort({ createdAt: -1 })
// //         .limit(10)
// //         .select("firstName surname email createdAt"),
// //     ]);

// //     res.render("vc/statistics", {
// //       title: "University Statistics",
// //       user: req.user,
// //       stats: {
// //         studentCount,
// //         staffCount,
// //         courseCount,
// //         departmentCount,
// //         recentAdmissions,
// //       },
// //     });
// //   } catch (err) {
// //     console.error("Statistics error:", err);
// //     req.flash("error_msg", "Failed to load statistics");
// //     res.redirect("/dashboard/vc");
// //   }
// // });

// // // VC Inbox
// // router.get("/vc/inbox", ensureVC, (req, res) => {
// //   res.render("vc/inbox", {
// //     title: "VC's Inbox",
// //     user: req.user,
// //   });
// // });

// // // Activity Log
// // router.get("/vc/activity-log", ensureVC, (req, res) => {
// //   res.render("vc/activityLog", {
// //     title: "Activity Log",
// //     user: req.user,
// //   });
// // });

// const express = require("express");
// const router = express.Router();
// const User = require("../models/User");
// const Payment = require("../models/Payment");

// // Middleware to ensure VC access
// function ensureVC(req, res, next) {
//   if (req.isAuthenticated() && req.user.role === "VC") return next();
//   req.flash("error_msg", "Access denied. VC privileges required.");
//   res.redirect("/login");
// }

// // ----------------- VC Dashboard -----------------
// router.get("/vc/dashboard", ensureVC, (req, res) => {
//   res.redirect("/dashboard/vc");
// });

// // ----------------- Manage Deans -----------------
// router.get("/vc/manage-deans", ensureVC, async (req, res) => {
//   try {
//     const deans = await User.find({ role: "Dean" })
//       .select("firstName surname email mobile department position createdAt")
//       .sort({ surname: 1 });

//     res.render("vc/manageDeans", {
//       title: "Manage Deans",
//       user: req.user,
//       deans,
//     });
//   } catch (err) {
//     console.error("Error fetching deans:", err);
//     req.flash("error_msg", "Failed to load deans");
//     res.redirect("/dashboard/vc");
//   }
// });

// // ----------------- Manage HODs -----------------
// router.get("/vc/manage-hods", ensureVC, async (req, res) => {
//   try {
//     const hods = await User.find({ role: "HOD" })
//       .select("firstName surname email mobile department faculty position")
//       .populate("department", "name code")
//       .sort({ surname: 1 });

//     res.render("vc/manageHODs", {
//       title: "Manage Heads of Department",
//       user: req.user,
//       hods,
//     });
//   } catch (err) {
//     console.error("Error fetching HODs:", err);
//     req.flash("error_msg", "Failed to load HODs");
//     res.redirect("/dashboard/vc");
//   }
// });

// // ----------------- Manage DVCs -----------------
// router.get("/vc/manage-dvcs", ensureVC, async (req, res) => {
//   try {
//     const dvcs = await User.find({ role: "DVC" })
//       .select("firstName surname email mobile portfolio position")
//       .sort({ surname: 1 });

//     res.render("vc/manageDVCs", {
//       title: "Manage Deputy Vice-Chancellors",
//       user: req.user,
//       dvcs,
//     });
//   } catch (err) {
//     console.error("Error fetching DVCs:", err);
//     req.flash("error_msg", "Failed to load DVCs");
//     res.redirect("/dashboard/vc");
//   }
// });

// // ----------------- Academic Reports -----------------
// router.get("/vc/reports/academic", ensureVC, (req, res) => {
//   res.render("vc/academicReports", {
//     title: "University Academic Reports",
//     user: req.user,
//   });
// });

// // ----------------- Student Discipline Cases -----------------
// router.get("/vc/discipline", ensureVC, async (req, res) => {
//   try {
//     const disciplineCases = []; // fetch from DB when model exists
//     res.render("vc/discipline", {
//       title: "Student Discipline Cases",
//       user: req.user,
//       disciplineCases,
//     });
//   } catch (err) {
//     console.error("Error fetching discipline cases:", err);
//     req.flash("error_msg", "Failed to load discipline cases");
//     res.redirect("/dashboard/vc");
//   }
// });

// // ----------------- Approve Senior Appointments -----------------
// router.post("/vc/approve-appointment/:userId", ensureVC, async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { position, effectiveDate, remarks } = req.body;

//     const user = await User.findById(userId);
//     if (!user) {
//       req.flash("error_msg", "User not found");
//       return res.redirect("back");
//     }

//     user.position = position;
//     user.appointmentDate = effectiveDate;
//     user.approvedBy = req.user._id;
//     user.approvalDate = new Date();

//     await user.save();
//     req.flash(
//       "success_msg",
//       `Successfully appointed ${user.firstName} ${user.surname} as ${position}`
//     );
//     res.redirect("back");
//   } catch (err) {
//     console.error("Appointment error:", err);
//     req.flash("error_msg", "Failed to process appointment");
//     res.redirect("back");
//   }
// });

// // ----------------- University Statistics -----------------
// router.get("/vc/statistics", ensureVC, async (req, res) => {
//   try {
//     const Course = require("../models/Course");
//     const Department = require("../models/Department");

//     const [
//       studentCount,
//       staffCount,
//       courseCount,
//       departmentCount,
//       recentAdmissions,
//     ] = await Promise.all([
//       User.countDocuments({ role: "Student" }),
//       User.countDocuments({
//         role: { $in: ["TeachingStaff", "Dean", "HOD", "DVC"] },
//       }),
//       Course.countDocuments(),
//       Department.countDocuments(),
//       User.find({ role: "Student" })
//         .sort({ createdAt: -1 })
//         .limit(10)
//         .select("firstName surname email createdAt"),
//     ]);

//     res.render("vc/statistics", {
//       title: "University Statistics",
//       user: req.user,
//       stats: {
//         studentCount,
//         staffCount,
//         courseCount,
//         departmentCount,
//         recentAdmissions,
//       },
//     });
//   } catch (err) {
//     console.error("Statistics error:", err);
//     req.flash("error_msg", "Failed to load statistics");
//     res.redirect("/dashboard/vc");
//   }
// });

// // ----------------- VC Inbox -----------------
// router.get("/vc/inbox", ensureVC, (req, res) => {
//   res.render("vc/inbox", { title: "VC's Inbox", user: req.user });
// });

// // ----------------- Activity Log -----------------
// router.get("/vc/activity-log", ensureVC, (req, res) => {
//   res.render("vc/activityLog", { title: "Activity Log", user: req.user });
// });

// // ----------------- VIEW ALL PAYMENTS -----------------
// router.get("/vc/payments", ensureVC, async (req, res) => {
//   try {
//     const payments = await Payment.find()
//       .populate("student", "firstName surname email")
//       .sort({ createdAt: -1 });

//     res.render("vc/payments", { payments, user: req.user });
//   } catch (err) {
//     console.error("VC Payments error:", err);
//     req.flash("error_msg", "Failed to load payments.");
//     res.redirect("/dashboard/vc");
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const vcController = require("../controllers/vcController");

// ----------------- Routes -----------------
router.get("/dashboard", vcController.ensureVC, vcController.vcDashboard);
router.get("/manage-deans", vcController.ensureVC, vcController.manageDeans);
router.get("/manage-hods", vcController.ensureVC, vcController.manageHODs);
router.get("/manage-dvcs", vcController.ensureVC, vcController.manageDVCs);
router.get(
  "/reports/academic",
  vcController.ensureVC,
  vcController.academicReports
);
router.get("/discipline", vcController.ensureVC, vcController.disciplineCases);
router.post(
  "/approve-appointment/:userId",
  vcController.ensureVC,
  vcController.approveAppointment
);
router.get(
  "/statistics",
  vcController.ensureVC,
  vcController.universityStatistics
);
router.get("/inbox", vcController.ensureVC, vcController.vcInbox);
router.get("/activity-log", vcController.ensureVC, vcController.activityLog);
router.get("/payments", vcController.ensureVC, vcController.viewAllPaymentsVC);

module.exports = router;
