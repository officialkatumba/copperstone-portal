const Expense = require("../models/Expense");
const { generateSignedUrl } = require("../config/gcsUpload");

// Show create expense form
exports.showCreateExpenseForm = async (req, res) => {
  res.render("finance/expenses/create", {
    title: "Record University Expense",
    user: req.user,
  });
};

// Create new expense (pre-approved)
exports.createExpense = async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      currency,
      category,
      paymentMethod,
      transactionReference,
      date,
      budgetCode,
      receiptNumber,
    } = req.body;

    // Validate required fields
    if (!title || !amount || !category) {
      req.flash("error_msg", "Title, amount, and category are required.");
      return res.redirect("/finance/expenses/new");
    }

    // Create expense with Paid status (pre-approved)
    const expense = await Expense.create({
      title,
      description: description || "",
      amount: parseFloat(amount),
      currency: currency || "ZMW",
      category,
      paymentMethod: paymentMethod || "Bank Transfer",
      transactionReference: transactionReference || "",
      date: date ? new Date(date) : new Date(),
      status: "Paid", // Directly paid since pre-approved
      requestedBy: req.user._id,
      approvedBy: req.user._id, // Auto-approved by finance officer
      approvedAt: new Date(),
      createdBy: req.user._id,
      budgetCode: budgetCode || "",
      receiptNumber: receiptNumber || "",
    });

    // Handle receipt upload if provided
    if (req.file) {
      try {
        const { uploadToGCS } = require("../config/gcsUpload");

        const uploaded = await uploadToGCS(
          req.file,
          {
            firstName: req.user.firstName || "Finance",
            surname: req.user.surname || "Officer",
          },
          "EXPENSE",
          new Date().getFullYear().toString(),
        );

        expense.receipt = {
          name: req.file.originalname,
          gcsUrl: uploaded.publicUrl,
          gcsPath: uploaded.path,
          uploadedAt: new Date(),
        };

        await expense.save();
      } catch (uploadError) {
        // Continue without receipt
      }
    }

    req.flash(
      "success_msg",
      `Expense "${expense.title}" recorded successfully as paid.`,
    );
    return res.redirect("/finance/expenses");
  } catch (err) {
    req.flash(
      "error_msg",
      "Failed to record expense. Please check your input.",
    );
    return res.redirect("/finance/expenses/new");
  }
};

// List all expenses
exports.listExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.search) {
      query.$or = [
        { title: new RegExp(req.query.search, "i") },
        { description: new RegExp(req.query.search, "i") },
        { category: new RegExp(req.query.search, "i") },
        { budgetCode: new RegExp(req.query.search, "i") },
      ];
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const expenses = await Expense.find(query)
      .populate("requestedBy", "firstName surname")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Format data
    expenses.forEach((expense) => {
      expense.formattedDate = new Date(expense.date).toLocaleDateString(
        "en-ZM",
      );
      expense.formattedAmount = `K ${expense.amount.toLocaleString("en-ZM", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    });

    const totalCount = await Expense.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get totals
    const totalAllResult = await Expense.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalAll = totalAllResult.length ? totalAllResult[0].total : 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalMonthResult = await Expense.aggregate([
      { $match: { status: "Paid", date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalMonth = totalMonthResult.length ? totalMonthResult[0].total : 0;

    res.render("finance/expenses/list", {
      title: "University Expense Records",
      expenses,
      totalAll,
      totalMonth,
      totalCount,
      currentPage: page,
      totalPages,
      limit,
      search: req.query.search || "",
      category: req.query.category || "",
      status: req.query.status || "",
      categories: [
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
      user: req.user,
    });
  } catch (err) {
    req.flash("error_msg", "Failed to load expenses.");
    res.redirect("/dashboard/finance");
  }
};

// View expense detail
exports.viewExpenseDetail = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("requestedBy", "firstName surname email")
      .populate("approvedBy", "firstName surname")
      .lean();

    if (!expense) {
      req.flash("error_msg", "Expense not found.");
      return res.redirect("/finance/expenses");
    }

    expense.formattedDate = new Date(expense.date).toLocaleDateString("en-ZM", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    expense.formattedAmount = `K ${expense.amount.toLocaleString("en-ZM", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    if (expense.receipt && expense.receipt.gcsPath) {
      try {
        expense.receipt.signedUrl = await generateSignedUrl(
          expense.receipt.gcsPath,
        );
      } catch (urlError) {
        expense.receipt.signedUrl = expense.receipt.gcsUrl;
      }
    }

    res.render("finance/expenses/detail", {
      title: `Expense: ${expense.title}`,
      expense,
      user: req.user,
    });
  } catch (err) {
    req.flash("error_msg", "Could not load expense details.");
    res.redirect("/finance/expenses");
  }
};

// Delete expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      req.flash("error_msg", "Expense not found.");
      return res.redirect("/finance/expenses");
    }

    // Check permission
    if (!["FinanceManager", "Admin"].includes(req.user.role)) {
      req.flash("error_msg", "You do not have permission to delete expenses.");
      return res.redirect("/finance/expenses");
    }

    await Expense.findByIdAndDelete(req.params.id);

    req.flash("success_msg", `Expense "${expense.title}" has been deleted.`);
    res.redirect("/finance/expenses");
  } catch (err) {
    req.flash("error_msg", "Could not delete expense.");
    res.redirect("/finance/expenses");
  }
};

// Export expenses to CSV
exports.exportExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate("requestedBy", "firstName surname")
      .sort({ date: -1 })
      .lean();

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=expenses_${new Date().toISOString().split("T")[0]}.csv`,
    );

    const header =
      "Title,Category,Description,Amount,Currency,Date,Payment Method,Transaction Reference,Status,Budget Code,Receipt Number,Requested By\n";

    const rows = expenses
      .map((expense) => {
        const row = [
          `"${expense.title.replace(/"/g, '""')}"`,
          `"${expense.category}"`,
          `"${(expense.description || "").replace(/"/g, '""')}"`,
          expense.amount,
          expense.currency,
          new Date(expense.date).toISOString().split("T")[0],
          `"${expense.paymentMethod}"`,
          `"${expense.transactionReference || ""}"`,
          `"${expense.status}"`,
          `"${expense.budgetCode || ""}"`,
          `"${expense.receiptNumber || ""}"`,
          `"${expense.requestedBy ? `${expense.requestedBy.firstName} ${expense.requestedBy.surname}` : ""}"`,
        ];
        return row.join(",");
      })
      .join("\n");

    res.send(header + rows);
  } catch (err) {
    req.flash("error_msg", "Could not export expenses.");
    res.redirect("/finance/expenses");
  }
};

// View expense receipt
exports.viewExpenseReceipt = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense || !expense.receipt || !expense.receipt.gcsPath) {
      req.flash("error_msg", "No receipt found for this expense.");
      return res.redirect("back");
    }

    const signedUrl = await generateSignedUrl(expense.receipt.gcsPath);
    return res.redirect(signedUrl);
  } catch (err) {
    req.flash("error_msg", "Could not access receipt.");
    return res.redirect("back");
  }
};
