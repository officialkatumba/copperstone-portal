// backend/utils/excelGenerator.js
const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");

/**
 * Generate Excel report for payments
 * @param {Object} reportData - The report data object
 * @returns {Promise<string>} - Path to generated Excel file
 */
async function generatePaymentExcel(reportData) {
  const tempDir = path.join(__dirname, "../temp");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const excelPath = path.join(tempDir, `payment_report_${Date.now()}.xlsx`);

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Copperstone University Finance";
  workbook.lastModifiedBy = "Finance Department";
  workbook.created = new Date();
  workbook.modified = new Date();

  // ============ SUMMARY SHEET ============
  const summarySheet = workbook.addWorksheet("Executive Summary", {
    properties: { tabColor: { argb: "003366" } },
    pageSetup: { paperSize: 9, orientation: "portrait" },
  });

  // Add title
  summarySheet.mergeCells("A1:F1");
  const titleRow = summarySheet.getCell("A1");
  titleRow.value = "COPPERSTONE UNIVERSITY - FINANCIAL PAYMENTS REPORT";
  titleRow.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titleRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "003366" },
  };
  titleRow.alignment = { horizontal: "center", vertical: "middle" };
  summarySheet.getRow(1).height = 30;

  // Date range
  summarySheet.mergeCells("A2:F2");
  const dateRow = summarySheet.getCell("A2");
  dateRow.value = `Period: ${reportData.dateRange.formattedStart} to ${reportData.dateRange.formattedEnd}`;
  dateRow.font = { size: 12, bold: true };
  dateRow.alignment = { horizontal: "center" };
  dateRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "F0F8FF" },
  };

  // Generated timestamp
  summarySheet.mergeCells("A3:F3");
  const genRow = summarySheet.getCell("A3");
  genRow.value = `Generated: ${reportData.generatedAt}`;
  genRow.font = { size: 10, italic: true };
  genRow.alignment = { horizontal: "center" };

  // Add empty row
  summarySheet.addRow([]);

  // ============ FINANCIAL SUMMARY SECTION ============
  summarySheet.mergeCells("A5:F5");
  const summaryHeader = summarySheet.getCell("A5");
  summaryHeader.value = "FINANCIAL SUMMARY";
  summaryHeader.font = { size: 14, bold: true, color: { argb: "003366" } };
  summaryHeader.alignment = { horizontal: "left" };

  // Summary data table
  const summaryHeaders = ["Metric", "Value", "", "Metric", "Value"];
  const headerRow = summarySheet.addRow(summaryHeaders);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4A5568" },
    };
    cell.alignment = { horizontal: "center" };
  });

  // Summary data rows
  const summaryData = [
    [
      "Total Payments",
      reportData.summary.totalPayments.toLocaleString(),
      "",
      "Total Collected",
      `ZMW ${formatNumber(reportData.summary.totalAmount)}`,
    ],
    [
      "Total Due",
      `ZMW ${formatNumber(reportData.summary.totalDue)}`,
      "",
      "Total Paid",
      `ZMW ${formatNumber(reportData.summary.totalPaid)}`,
    ],
    [
      "Outstanding Balance",
      `ZMW ${formatNumber(reportData.summary.totalBalance)}`,
      "",
      "Completion Rate",
      `${reportData.summary.completionPercentage}%`,
    ],
    [
      "Min Payment",
      `ZMW ${formatNumber(reportData.summary.minAmount || 0)}`,
      "",
      "Max Payment",
      `ZMW ${formatNumber(reportData.summary.maxAmount || 0)}`,
    ],
    [
      "Average Payment",
      `ZMW ${formatNumber(reportData.summary.averageAmount || 0)}`,
      "",
      "",
      "",
    ],
  ];

  summaryData.forEach((rowData) => {
    const row = summarySheet.addRow(rowData);
    row.eachCell((cell, colNumber) => {
      if (colNumber === 2 || colNumber === 5) {
        cell.font = { bold: true };
        if (
          cell.value.toString().includes("Outstanding") ||
          (colNumber === 5 && rowData[3] === "Outstanding Balance")
        ) {
          cell.font = { bold: true, color: { argb: "E53E3E" } };
        }
      }
      cell.alignment = {
        horizontal: colNumber === 1 || colNumber === 4 ? "left" : "right",
      };
    });
  });

  // ============ STATUS BREAKDOWN ============
  summarySheet.addRow([]);
  summarySheet.mergeCells("A15:F15");
  const statusHeader = summarySheet.getCell("A15");
  statusHeader.value = "PAYMENT STATUS BREAKDOWN";
  statusHeader.font = { size: 14, bold: true, color: { argb: "003366" } };
  statusHeader.alignment = { horizontal: "left" };

  // Status table headers
  const statusHeaders = ["Status", "Count", "Percentage", "Amount", "", ""];
  const statusHeaderRow = summarySheet.addRow(statusHeaders);
  statusHeaderRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2C5282" },
    };
    cell.alignment = { horizontal: colNumber <= 3 ? "left" : "right" };
  });

  // Status data
  Object.entries(reportData.summary.statusCount).forEach(([status, count]) => {
    const percentage = (
      (count / reportData.summary.totalPayments) *
      100
    ).toFixed(1);
    const row = summarySheet.addRow([
      status,
      count,
      `${percentage}%`,
      "",
      "",
      "",
    ]);

    // Color code status
    let color;
    if (status === "Verified" || status === "Fully Paid") color = "1CC88A";
    else if (status === "Pending") color = "F6C23E";
    else if (status === "Rejected") color = "E74A3B";
    else if (status === "Partially Paid") color = "36B9CC";

    if (color) {
      row.getCell(1).font = { color: { argb: color }, bold: true };
    }
  });

  // ============ CATEGORY BREAKDOWN ============
  summarySheet.addRow([]);
  summarySheet.mergeCells("A25:F25");
  const catHeader = summarySheet.getCell("A25");
  catHeader.value = "CATEGORY BREAKDOWN";
  catHeader.font = { size: 14, bold: true, color: { argb: "003366" } };
  catHeader.alignment = { horizontal: "left" };

  // Category table headers
  const catHeaders = [
    "Category",
    "Count",
    "Collected (ZMW)",
    "Due (ZMW)",
    "Balance (ZMW)",
    "% of Total",
  ];
  const catHeaderRow = summarySheet.addRow(catHeaders);
  catHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1F4F4F" },
    };
    cell.alignment = { horizontal: "center" };
  });

  // Category data
  const categories = Object.entries(reportData.summary.categories).sort(
    (a, b) => b[1].totalAmount - a[1].totalAmount,
  );

  categories.forEach(([category, data]) => {
    const row = summarySheet.addRow([
      category,
      data.count,
      formatNumber(data.totalAmount),
      formatNumber(data.totalDue),
      formatNumber(data.totalBalance),
      `${data.percentage || "0.0"}%`,
    ]);

    // Highlight rows with balance
    if (data.totalBalance > 0) {
      row.getCell(5).font = { bold: true, color: { argb: "E53E3E" } };
    }

    row.eachCell((cell, colNumber) => {
      if (colNumber >= 3) {
        cell.alignment = { horizontal: "right" };
        cell.numFmt = "#,##0.00";
      }
    });
  });

  // Category totals row
  const totalRow = summarySheet.addRow([
    "TOTAL",
    reportData.summary.totalPayments,
    formatNumber(reportData.summary.totalAmount),
    formatNumber(reportData.summary.totalDue),
    formatNumber(reportData.summary.totalBalance),
    "100%",
  ]);
  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "EDF2F7" },
    };
  });

  // ============ DETAILED PAYMENTS SHEET ============
  const detailSheet = workbook.addWorksheet("Detailed Payments", {
    properties: { tabColor: { argb: "1CC88A" } },
    pageSetup: { paperSize: 9, orientation: "landscape" },
  });

  // Detail sheet title
  detailSheet.mergeCells("A1:J1");
  const detailTitle = detailSheet.getCell("A1");
  detailTitle.value = "DETAILED PAYMENT RECORDS";
  detailTitle.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  detailTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1CC88A" },
  };
  detailTitle.alignment = { horizontal: "center", vertical: "middle" };

  // Date range on detail sheet
  detailSheet.mergeCells("A2:J2");
  const detailDate = detailSheet.getCell("A2");
  detailDate.value = `Period: ${reportData.dateRange.formattedStart} to ${reportData.dateRange.formattedEnd}`;
  detailDate.font = { size: 11, italic: true };
  detailDate.alignment = { horizontal: "center" };

  // Detail table headers
  const detailHeaders = [
    "Date",
    "Receipt #",
    "Student Name",
    "Student ID",
    "Category",
    "Amount (ZMW)",
    "Due (ZMW)",
    "Balance (ZMW)",
    "Method",
    "Status",
  ];

  const detailHeaderRow = detailSheet.addRow([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  detailHeaderRow.values = detailHeaders;

  detailHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2C3E50" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Add payment data
  const allPayments = reportData.allPayments || reportData.payments || [];

  allPayments.forEach((payment) => {
    const date = payment.createdAt
      ? new Date(payment.createdAt).toLocaleDateString("en-GB")
      : "N/A";
    const studentName = payment.student
      ? `${payment.student.firstName || ""} ${payment.student.surname || ""}`.trim()
      : "N/A";
    const studentId = payment.student?.studentId || "N/A";
    const category = payment.category || "Uncategorized";
    const amount = payment.amount || 0;
    const due = payment.totalDue || 0;
    const balance = payment.balanceAfterPayment || 0;
    const method = payment.method || "N/A";
    const status = payment.status || "N/A";

    const row = detailSheet.addRow([
      date,
      payment.reference,
      studentName,
      studentId,
      category,
      amount,
      due,
      balance,
      method,
      status,
    ]);

    // Format cells
    row.eachCell((cell, colNumber) => {
      cell.alignment = {
        horizontal:
          colNumber === 5 || colNumber === 6 || colNumber === 7
            ? "right"
            : "left",
        vertical: "middle",
      };

      // Format numbers
      if (colNumber === 5 || colNumber === 6 || colNumber === 7) {
        cell.numFmt = "#,##0.00";
      }

      // Color code balance
      if (colNumber === 7 && balance > 0) {
        cell.font = { bold: true, color: { argb: "E53E3E" } };
      }

      // Color code status
      if (colNumber === 10) {
        let color;
        if (status === "Verified" || status === "Fully Paid") color = "1CC88A";
        else if (status === "Pending") color = "F6C23E";
        else if (status === "Rejected") color = "E74A3B";
        else if (status === "Partially Paid") color = "36B9CC";

        if (color) {
          cell.font = { color: { argb: color }, bold: true };
        }
      }

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Add totals row
  const totalAmount = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalDue = allPayments.reduce((sum, p) => sum + (p.totalDue || 0), 0);
  const totalBalance = allPayments.reduce(
    (sum, p) => sum + (p.balanceAfterPayment || 0),
    0,
  );

  const footerRow = detailSheet.addRow([
    "",
    "",
    "",
    "",
    "",
    totalAmount,
    totalDue,
    totalBalance,
    "",
    "",
  ]);
  footerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "EDF2F7" },
    };
    if (colNumber >= 6 && colNumber <= 8) {
      cell.numFmt = "#,##0.00";
    }
  });

  // Merge cells for label
  detailSheet.mergeCells("A5:E5");
  detailSheet.getCell("A5").value = "GRAND TOTALS:";
  detailSheet.getCell("A5").font = { bold: true };
  detailSheet.getCell("A5").alignment = { horizontal: "right" };

  // ============ OUTSTANDING BALANCES SHEET ============
  const outstandingPayments = allPayments.filter(
    (p) => (p.balanceAfterPayment || 0) > 0,
  );

  if (outstandingPayments.length > 0) {
    const outstandingSheet = workbook.addWorksheet("Outstanding Balances", {
      properties: { tabColor: { argb: "E53E3E" } },
    });

    outstandingSheet.mergeCells("A1:H1");
    const outstandingTitle = outstandingSheet.getCell("A1");
    outstandingTitle.value = "OUTSTANDING BALANCES REPORT";
    outstandingTitle.font = {
      size: 16,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    outstandingTitle.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "E53E3E" },
    };
    outstandingTitle.alignment = { horizontal: "center" };

    outstandingSheet.mergeCells("A2:H2");
    outstandingSheet.getCell("A2").value =
      `Total Outstanding: ZMW ${formatNumber(totalBalance)} | ${outstandingPayments.length} payment(s)`;
    outstandingSheet.getCell("A2").font = { bold: true, size: 12 };
    outstandingSheet.getCell("A2").alignment = { horizontal: "center" };

    // Headers
    const outstandingHeaders = [
      "Date",
      "Receipt",
      "Student",
      "Category",
      "Amount",
      "Due",
      "Balance",
      "Expected Date",
    ];
    const outHeaderRow = outstandingSheet.addRow(outstandingHeaders);
    outHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "C53030" },
      };
      cell.alignment = { horizontal: "center" };
    });

    // Outstanding data
    outstandingPayments.forEach((payment) => {
      const expectedDate = payment.expectedPaymentDate
        ? new Date(payment.expectedPaymentDate).toLocaleDateString("en-GB")
        : "Not set";

      outstandingSheet
        .addRow([
          payment.createdAt
            ? new Date(payment.createdAt).toLocaleDateString("en-GB")
            : "N/A",
          payment.reference,
          payment.student
            ? `${payment.student.firstName} ${payment.student.surname}`.trim()
            : "N/A",
          payment.category || "Uncategorized",
          payment.amount || 0,
          payment.totalDue || 0,
          payment.balanceAfterPayment || 0,
          expectedDate,
        ])
        .eachCell((cell, colNumber) => {
          if (colNumber >= 5 && colNumber <= 7) {
            cell.numFmt = "#,##0.00";
            if (colNumber === 7) {
              cell.font = { bold: true, color: { argb: "E53E3E" } };
            }
          }
        });
    });

    // Auto-fit columns for outstanding sheet
    outstandingSheet.columns.forEach((column) => {
      column.width = 15;
    });
  }

  // Auto-fit columns for summary sheet
  summarySheet.columns.forEach((column) => {
    column.width = 18;
  });

  // Auto-fit columns for detail sheet
  detailSheet.columns.forEach((column) => {
    column.width = 15;
  });

  // Add some extra formatting
  detailSheet.getColumn(2).width = 18; // Receipt #
  detailSheet.getColumn(3).width = 25; // Student Name
  detailSheet.getColumn(4).width = 15; // Student ID

  // Save the workbook
  await workbook.xlsx.writeFile(excelPath);

  return excelPath;
}

/**
 * Format number with thousands separator
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  if (num === undefined || num === null) return "0.00";
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = {
  generatePaymentExcel,
};
