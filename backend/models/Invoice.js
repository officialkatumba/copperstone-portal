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
