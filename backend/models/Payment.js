const mongoose = require("mongoose");
const paymentSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    method: { type: String, enum: ["Online", "Manual"], required: true },
    proofUrl: String, // For manual uploads
    transactionId: String, // For online payments
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Rejected"],
      default: "Pending",
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Finance officer
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
