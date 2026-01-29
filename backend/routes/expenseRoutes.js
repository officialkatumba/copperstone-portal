const express = require("express");
const router = express.Router();
const {
  showCreateExpenseForm,
  createExpense,
  listExpenses,
  viewExpenseDetail,
  deleteExpense,
  exportExpenses,
  viewExpenseReceipt,
} = require("../controllers/expenseController");

const { multerUpload } = require("../config/gcsUpload");

router.get("/", listExpenses);
router.get("/new", showCreateExpenseForm);
router.post("/", multerUpload.single("receipt"), createExpense);
router.get("/:id", viewExpenseDetail);
router.post("/:id/delete", deleteExpense);
router.get("/export/csv", exportExpenses);
router.get("/:id/receipt", viewExpenseReceipt);

module.exports = router;
