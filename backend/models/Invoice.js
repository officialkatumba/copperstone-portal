// const Application = require("../models/Application");
// const Invoice = require("../models/Invoice");
// const { generateSignedUrl } = require("../config/gcsUpload");

// // ✅ List all applications with attached payments
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

// // ✅ View single application + documents + payment
// exports.viewFinanceApplicationDetail = async (req, res) => {
//   try {
//     const app = await Application.findById(req.params.id)
//       .populate("applicant")
//       .populate("firstChoice")
//       .populate("secondChoice")
//       .lean();

//     if (!app) {
//       req.flash("error_msg", "Application not found.");
//       return res.redirect("/finance/applications");
//     }

//     // Attach signed URLs for documents
//     for (const doc of app.documents) {
//       if (doc.gcsPath) doc.signedUrl = await generateSignedUrl(doc.gcsPath);
//       else if (doc.gcsUrl) doc.signedUrl = doc.gcsUrl;
//     }

//     res.render("finance/applicationDetail", {
//       title: "Finance - Application Payment Verification",
//       application: app,
//       user: req.user,
//     });
//   } catch (err) {
//     console.error("Finance detail error:", err);
//     req.flash("error_msg", "Failed to load application detail.");
//     res.redirect("/finance/applications");
//   }
// };

// // ✅ Verify or reject payment + generate invoice if verified
// exports.verifyPayment = async (req, res) => {
//   try {
//     const { status, remarks } = req.body; // status = "Verified" or "Rejected"
//     const app = await Application.findById(req.params.id);

//     if (!app) {
//       req.flash("error_msg", "Application not found.");
//       return res.redirect("/finance/applications");
//     }

//     // update payment verification
//     app.payment.status = status;
//     app.payment.remarks = remarks || "";
//     app.payment.verifiedBy = req.user._id;
//     app.payment.verifiedAt = new Date();

//     // If verified, generate and mark invoice paid
//     if (status === "Verified") {
//       const invoice = new Invoice({
//         student: app.applicant,
//         application: app._id,
//         amount: app.payment.amount || 0,
//         status: "Paid",
//         paidAt: new Date(),
//       });
//       await invoice.save();
//       app.payment.invoice = invoice._id;
//     }

//     await app.save();

//     req.flash("success_msg", `Payment marked as ${status}.`);
//     res.redirect("/finance/applications");
//   } catch (err) {
//     console.error("Verify payment error:", err);
//     req.flash("error_msg", "Failed to verify payment.");
//     res.redirect("/finance/applications");
//   }
// };

const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    amount: { type: Number, required: true },
    dueDate: Date,
    status: {
      type: String,
      enum: ["Unpaid", "Paid", "Overdue"],
      default: "Unpaid",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
