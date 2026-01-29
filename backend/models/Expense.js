const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const expenseSchema = new Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, "Expense title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // Financial Information
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "ZMW", // Zambian Kwacha
      enum: ["ZMW", "USD", "EUR", "GBP"],
    },

    // Category
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      enum: [
        "Salaries",
        "Utilities",
        "Office Supplies",
        "Transport",
        "Maintenance",
        "Training",
        "Software",
        "Hardware",
        "Marketing",
        "Travel",
        "Accommodation",
        "Food",
        "Medical",
        "Insurance",
        "Other",
      ],
    },

    // Payment Details
    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "Cheque", "Mobile Money", "Other"],
      default: "Bank Transfer",
    },
    transactionReference: {
      type: String,
      trim: true,
    },

    // Dates
    date: {
      type: Date,
      required: [true, "Expense date is required"],
      default: Date.now,
    },

    // Status
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Paid"],
      default: "Pending",
    },

    // People involved
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Requester is required"],
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },

    // Supporting Document
    receiptNumber: {
      type: String,
      trim: true,
    },

    // Budget tracking
    budgetCode: {
      type: String,
      trim: true,
    },

    // Audit trail
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for better query performance
expenseSchema.index({ category: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ requestedBy: 1 });

// Virtual for formatted amount with Kwacha symbol
expenseSchema.virtual("formattedAmount").get(function () {
  return `K ${this.amount.toLocaleString("en-ZM", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
});

// Static method to get total expenses
expenseSchema.statics.getTotalExpenses = async function (startDate, endDate) {
  const matchStage = { status: "Paid" };

  if (startDate) matchStage.date = { $gte: startDate };
  if (endDate) {
    if (matchStage.date) {
      matchStage.date.$lte = endDate;
    } else {
      matchStage.date = { $lte: endDate };
    }
  }

  const result = await this.aggregate([
    { $match: matchStage },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return result.length > 0 ? result[0].total : 0;
};

// Instance method to approve expense
expenseSchema.methods.approve = function (approverId) {
  this.status = "Approved";
  this.approvedBy = approverId;
  this.approvedAt = new Date();
  return this.save();
};

// Instance method to mark as paid
expenseSchema.methods.markAsPaid = function () {
  this.status = "Paid";
  return this.save();
};

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;
