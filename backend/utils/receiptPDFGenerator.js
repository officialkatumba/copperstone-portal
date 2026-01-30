// // backend/utils/receiptPDFGenerator.js
// const PDFDocument = require("pdfkit");
// const fs = require("fs");
// const path = require("path");
// const https = require("https");
// const http = require("http");

// // Helper function to download image
// function downloadImage(url) {
//   return new Promise((resolve, reject) => {
//     const client = url.startsWith("https") ? https : http;

//     client
//       .get(url, (response) => {
//         if (response.statusCode !== 200) {
//           reject(new Error(`Failed to download image: ${response.statusCode}`));
//           return;
//         }

//         const chunks = [];
//         response.on("data", (chunk) => chunks.push(chunk));
//         response.on("end", () => resolve(Buffer.concat(chunks)));
//         response.on("error", reject);
//       })
//       .on("error", reject);
//   });
// }

// async function generateReceiptPDF({ payment, application = null }) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       // Thermal receipt dimensions
//       const pageWidth = 165; // 58mm width
//       const margin = 10;

//       // Create document with consistent font
//       const doc = new PDFDocument({
//         margin: 0,
//         size: [pageWidth, 600],
//         autoFirstPage: false,
//         font: "Courier",
//       });

//       const tmpDir = path.join(__dirname, "../../tmp");
//       if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

//       const fileName = `Receipt_${payment._id}_${Date.now()}.pdf`;
//       const outPath = path.join(tmpDir, fileName);
//       const stream = fs.createWriteStream(outPath);
//       doc.pipe(stream);

//       // Download images if available
//       let logoBuffer;

//       try {
//         if (process.env.LOGO) {
//           logoBuffer = await downloadImage(process.env.LOGO);
//         }
//       } catch (err) {
//         console.log("Logo not loaded:", err.message);
//       }

//       // Add page with exact dimensions
//       doc.addPage({ margin: 0, size: [pageWidth, 700] });

//       let yPos = margin;
//       const contentWidth = pageWidth - margin * 2;

//       /* ===== HEADER SECTION ===== */
//       if (logoBuffer) {
//         const logoSize = 45;
//         const logoX = (pageWidth - logoSize) / 2;
//         doc.image(logoBuffer, logoX, yPos, {
//           width: logoSize,
//           height: logoSize,
//           fit: [logoSize, logoSize],
//         });
//         yPos += logoSize + 8;
//       }

//       // University Title Section
//       doc
//         .fontSize(10)
//         .font("Courier-Bold")
//         .text("COPPERSTONE UNIVERSITY", margin, yPos, {
//           width: contentWidth,
//           align: "center",
//         });
//       yPos += 14;

//       // Official Receipt Section
//       doc
//         .fontSize(9)
//         .font("Courier-Bold")
//         .text("OFFICIAL PAYMENT RECEIPT", margin, yPos, {
//           width: contentWidth,
//           align: "center",
//         });
//       yPos += 12;

//       // Department Section
//       doc.fontSize(8).font("Courier").text("Finance Department", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 12;

//       /* ===== HEADER SEPARATOR ===== */
//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();
//       yPos += 12;

//       /* ===== RECEIPT INFORMATION ===== */
//       doc.font("Courier-Bold").fontSize(9);
//       doc.text("RECEIPT INFORMATION", margin, yPos);
//       yPos += 12;

//       doc.font("Courier").fontSize(8);

//       const receiptId =
//         payment.reference ||
//         payment._id?.toString().slice(-8) ||
//         `RC-${Date.now().toString().slice(-6)}`;

//       // Receipt No
//       doc.font("Courier-Bold").text("Receipt No:", margin, yPos);
//       doc.font("Courier").text(` ${receiptId}`, margin + 50, yPos);
//       yPos += 10;

//       // Date
//       const now = new Date();
//       doc.font("Courier-Bold").text("Date:", margin, yPos);
//       doc
//         .font("Courier")
//         .text(` ${now.toLocaleDateString()}`, margin + 25, yPos);
//       yPos += 10;

//       // Time
//       doc.font("Courier-Bold").text("Time:", margin, yPos);
//       doc.font("Courier").text(
//         ` ${now.toLocaleTimeString([], {
//           hour: "2-digit",
//           minute: "2-digit",
//         })}`,
//         margin + 25,
//         yPos,
//       );
//       yPos += 12;

//       /* ===== DASHED SEPARATOR ===== */
//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .dash(2, { space: 2 })
//         .strokeColor("#888888")
//         .lineWidth(0.3)
//         .stroke();
//       yPos += 12;

//       /* ===== ACADEMIC INFORMATION (NEW SECTION) ===== */
//       // Only show if we have application data
//       if (application) {
//         doc.font("Courier-Bold").fontSize(9);
//         doc.text("ACADEMIC INFORMATION", margin, yPos, {
//           width: contentWidth,
//           align: "center",
//         });
//         yPos += 12;

//         doc.fontSize(8);

//         // Mode of Study
//         if (application.modeOfStudy) {
//           doc.font("Courier-Bold").text("Mode of Study:", margin, yPos);
//           doc
//             .font("Courier")
//             .text(` ${application.modeOfStudy}`, margin + 55, yPos);
//           yPos += 10;
//         }

//         // Approved Programme - Only show if application is approved
//         if (application.status === "Approved" && application.firstChoice) {
//           let programmeText = "Programme Approved";

//           if (typeof application.firstChoice === "object") {
//             programmeText =
//               application.firstChoice.name || "Programme Approved";
//             if (application.firstChoice.code) {
//               programmeText += ` (${application.firstChoice.code})`;
//             }
//           }

//           doc.font("Courier-Bold").text("Approved Programme:", margin, yPos);
//           yPos += 10;

//           doc.font("Courier").text(programmeText, margin + 12, yPos, {
//             width: contentWidth - 12,
//             lineGap: 2,
//           });

//           // Calculate text height
//           const programmeHeight = doc.heightOfString(programmeText, {
//             width: contentWidth - 15,
//             lineGap: 2,
//           });
//           yPos += programmeHeight + 8;
//         } else if (application.firstChoice) {
//           // Show first choice if not approved yet
//           let programmeText = "Not specified";

//           if (typeof application.firstChoice === "object") {
//             programmeText = application.firstChoice.name || "First Choice";
//             if (application.firstChoice.code) {
//               programmeText += ` (${application.firstChoice.code})`;
//             }
//           }

//           doc.font("Courier-Bold").text("Applied Programme:", margin, yPos);
//           yPos += 10;

//           doc.font("Courier").text(programmeText, margin + 12, yPos, {
//             width: contentWidth - 12,
//             lineGap: 2,
//           });

//           const programmeHeight = doc.heightOfString(programmeText, {
//             width: contentWidth - 15,
//             lineGap: 2,
//           });
//           yPos += programmeHeight + 8;
//         }

//         yPos += 8;

//         /* ===== DASHED SEPARATOR ===== */
//         doc
//           .moveTo(margin, yPos)
//           .lineTo(pageWidth - margin, yPos)
//           .dash(2, { space: 2 })
//           .strokeColor("#888888")
//           .lineWidth(0.3)
//           .stroke();
//         yPos += 12;
//       }

//       /* ===== STUDENT INFORMATION ===== */
//       doc.font("Courier-Bold").fontSize(9);
//       doc.text("STUDENT INFORMATION", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 12;

//       doc.fontSize(8);

//       if (payment.student) {
//         const fullName = `${payment.student.firstName} ${payment.student.surname}`;

//         // Name
//         doc.font("Courier-Bold").text("Name:", margin, yPos);
//         yPos += 10;
//         doc.font("Courier").text(fullName, margin + 12, yPos, {
//           width: contentWidth - 12,
//         });
//         yPos += 10;

//         const email = payment.student.email || "N/A";
//         // Email
//         doc.font("Courier-Bold").text("Email:", margin, yPos);
//         yPos += 10;
//         doc.font("Courier").text(email, margin + 12, yPos, {
//           width: contentWidth - 12,
//         });
//         yPos += 10;

//         if (payment.student.studentId) {
//           // Student ID
//           doc.font("Courier-Bold").text("Student ID:", margin, yPos);
//           yPos += 10;
//           doc
//             .font("Courier")
//             .text(payment.student.studentId, margin + 12, yPos, {
//               width: contentWidth - 12,
//             });
//           yPos += 10;
//         }
//       }
//       yPos += 8;

//       /* ===== DASHED SEPARATOR ===== */
//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .dash(2, { space: 2 })
//         .strokeColor("#888888")
//         .lineWidth(0.3)
//         .stroke();
//       yPos += 12;

//       /* ===== PAYMENT DETAILS ===== */
//       doc.font("Courier-Bold").fontSize(9);
//       doc.text("PAYMENT DETAILS", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 12;

//       doc.fontSize(8);

//       // Category
//       doc.font("Courier-Bold").text("Category:", margin, yPos);
//       yPos += 10;
//       doc.font("Courier").text(payment.category || "N/A", margin + 12, yPos, {
//         width: contentWidth - 12,
//       });
//       yPos += 10;

//       const description = payment.description || "Payment";
//       // Description
//       doc.font("Courier-Bold").text("Description:", margin, yPos);
//       yPos += 10;

//       const descriptionHeight = doc.heightOfString(description, {
//         width: contentWidth - 15,
//         lineGap: 2,
//       });

//       doc.font("Courier").text(description, margin + 12, yPos, {
//         width: contentWidth - 15,
//         lineGap: 2,
//       });
//       yPos += descriptionHeight + 8;

//       // Method
//       doc.font("Courier-Bold").text("Method:", margin, yPos);
//       doc
//         .font("Courier")
//         .text(` ${payment.method || "N/A"}`, margin + 35, yPos);
//       yPos += 10;

//       if (payment.semester) {
//         // Semester
//         doc.font("Courier-Bold").text("Semester:", margin, yPos);
//         doc.font("Courier").text(` ${payment.semester}`, margin + 45, yPos);
//         yPos += 10;
//       }

//       if (payment.academicYear) {
//         // Academic Year
//         doc.font("Courier-Bold").text("Academic Year:", margin, yPos);
//         doc.font("Courier").text(` ${payment.academicYear}`, margin + 65, yPos);
//         yPos += 10;
//       }
//       yPos += 8;

//       /* ===== PAYMENT SUMMARY SECTION ===== */
//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();
//       yPos += 10;

//       doc.font("Courier-Bold").fontSize(9);
//       doc.text("PAYMENT SUMMARY", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 12;

//       doc.fontSize(8);

//       // Helper function to format numbers with thousand separator
//       const formatNumber = (num) => {
//         return parseFloat(num)
//           .toFixed(2)
//           .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
//       };

//       const amountStartX = margin + 60;
//       const amountPaid = parseFloat(payment.amount) || 0;
//       const totalDue = parseFloat(payment.totalDue) || amountPaid;
//       const balanceRemaining = parseFloat(payment.balanceAfterPayment) || 0;

//       // Total Due
//       doc.font("Courier-Bold").text("Total Due:", margin, yPos);
//       doc
//         .font("Courier")
//         .text(`ZMW ${formatNumber(totalDue)}`, amountStartX, yPos);
//       yPos += 10;

//       // Amount Paid
//       doc.font("Courier-Bold").text("Amount Paid:", margin, yPos);
//       doc
//         .font("Courier")
//         .text(`ZMW ${formatNumber(amountPaid)}`, amountStartX, yPos);
//       yPos += 10;

//       // Balance
//       doc.font("Courier-Bold").text("Balance:", margin, yPos);
//       doc
//         .font("Courier")
//         .text(`ZMW ${formatNumber(balanceRemaining)}`, amountStartX, yPos);
//       yPos += 12;

//       // Total Paid separator
//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();
//       yPos += 10;

//       // TOTAL PAID
//       doc.font("Courier-Bold").fontSize(9);
//       doc.text("TOTAL PAID:", margin, yPos);
//       doc
//         .font("Courier")
//         .fontSize(8)
//         .text(`ZMW ${formatNumber(amountPaid)}`, amountStartX, yPos);
//       yPos += 12;

//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();
//       yPos += 12;

//       /* ===== PAYMENT STATUS ===== */
//       const status = payment.status ? payment.status.toUpperCase() : "PENDING";
//       const statusColor =
//         status === "VERIFIED" || status === "FULLY PAID"
//           ? "#008000"
//           : status === "PARTIALLY PAID"
//             ? "#FFA500"
//             : "#FF0000";

//       doc.font("Courier-Bold").fontSize(9).fillColor(statusColor);
//       doc.text(`STATUS: ${status}`, margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 12;

//       if (payment.verifiedAt) {
//         doc.font("Courier").fontSize(8).fillColor("#000000");
//         doc.text(
//           `Verified: ${new Date(payment.verifiedAt).toLocaleDateString()}`,
//           margin,
//           yPos,
//           {
//             width: contentWidth,
//             align: "center",
//           },
//         );
//         yPos += 10;
//       }

//       /* ===== SIGNATURE AREA ===== */
//       yPos += 8;

//       // Signature line
//       doc
//         .moveTo(margin + 30, yPos + 15)
//         .lineTo(pageWidth - margin - 30, yPos + 15)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();

//       yPos += 25;

//       // University name in signature area
//       doc.font("Courier").fontSize(8);
//       doc.text("COPPERSTONE UNIVERSITY", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 12;

//       // Finance Department
//       doc.font("Courier").fontSize(6).fillColor("#000000");
//       doc.text("Our Vision!,Our Country,Our World!", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 10;

//       /* ===== FOOTER SECTION ===== */
//       // Top dashed line
//       doc
//         .moveTo(margin + 10, yPos)
//         .lineTo(pageWidth - margin - 10, yPos)
//         .dash(2, { space: 2 })
//         .strokeColor("#000000")
//         .lineWidth(0.3)
//         .stroke();
//       yPos += 10;

//       // ADDRESS SECTION
//       doc.font("Courier").fontSize(6);
//       doc.text("Plot 38002, Baluba Campus", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 8;

//       doc.text("Ndola-Kitwe Dual carriageway, KITWE", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 8;

//       // Thank you message
//       doc.font("Courier-Oblique").fontSize(8);
//       doc.text("Thank you for your payment", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 10;

//       // Add payment balance note if applicable
//       if (balanceRemaining > 0) {
//         doc.font("Courier-Bold").fontSize(7).fillColor("#FF0000");
//         doc.text(
//           `* Balance of ZMW ${formatNumber(balanceRemaining)} pending`,
//           margin,
//           yPos,
//           {
//             width: contentWidth,
//             align: "center",
//           },
//         );
//         yPos += 10;
//       }

//       // Bottom border
//       doc
//         .moveTo(margin + 10, yPos)
//         .lineTo(pageWidth - margin - 10, yPos)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();

//       doc.end();

//       stream.on("finish", () => resolve(outPath));
//       stream.on("error", reject);
//     } catch (err) {
//       reject(err);
//     }
//   });
// }

// module.exports = { generateReceiptPDF };

// backend/utils/receiptPDFGenerator.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// Helper function to download image
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    client
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
        response.on("error", reject);
      })
      .on("error", reject);
  });
}

// async function generateReceiptPDF({ payment, application = null }) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       // Thermal receipt dimensions
//       const pageWidth = 165; // 58mm width
//       const margin = 10;

//       // Create document with consistent font
//       const doc = new PDFDocument({
//         margin: 0,
//         size: [pageWidth, 600],
//         autoFirstPage: false,
//         font: "Courier",
//       });

//       const tmpDir = path.join(__dirname, "../../tmp");
//       if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

//       const fileName = `Receipt_${payment._id}_${Date.now()}.pdf`;
//       const outPath = path.join(tmpDir, fileName);
//       const stream = fs.createWriteStream(outPath);
//       doc.pipe(stream);

//       // Download images if available
//       let logoBuffer;

//       try {
//         if (process.env.LOGO) {
//           logoBuffer = await downloadImage(process.env.LOGO);
//         }
//       } catch (err) {
//         console.log("Logo not loaded:", err.message);
//       }

//       // Add page with exact dimensions
//       doc.addPage({ margin: 0, size: [pageWidth, 750] }); // Increased height to accommodate new section

//       let yPos = margin;
//       const contentWidth = pageWidth - margin * 2;

//       /* ===== HEADER SECTION ===== */
//       if (logoBuffer) {
//         const logoSize = 45;
//         const logoX = (pageWidth - logoSize) / 2;
//         doc.image(logoBuffer, logoX, yPos, {
//           width: logoSize,
//           height: logoSize,
//           fit: [logoSize, logoSize],
//         });
//         yPos += logoSize + 8;
//       }

//       // University Title Section
//       doc
//         .fontSize(10)
//         .font("Courier-Bold")
//         .text("COPPERSTONE UNIVERSITY", margin, yPos, {
//           width: contentWidth,
//           align: "center",
//         });
//       yPos += 14;

//       // Official Receipt Section
//       doc
//         .fontSize(9)
//         .font("Courier-Bold")
//         .text("OFFICIAL PAYMENT RECEIPT", margin, yPos, {
//           width: contentWidth,
//           align: "center",
//         });
//       yPos += 12;

//       // Department Section
//       doc.fontSize(8).font("Courier").text("Finance Department", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 12;

//       /* ===== HEADER SEPARATOR ===== */
//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();
//       yPos += 12;

//       /* ===== RECEIPT INFORMATION ===== */
//       doc.font("Courier-Bold").fontSize(9);
//       doc.text("RECEIPT INFORMATION", margin, yPos);
//       yPos += 12;

//       doc.font("Courier").fontSize(8);

//       const receiptId =
//         payment.reference ||
//         payment._id?.toString().slice(-8) ||
//         `RC-${Date.now().toString().slice(-6)}`;

//       // Receipt No
//       doc.font("Courier-Bold").text("Receipt No:", margin, yPos);
//       doc.font("Courier").text(` ${receiptId}`, margin + 50, yPos);
//       yPos += 10;

//       // Date
//       const now = new Date();
//       doc.font("Courier-Bold").text("Date:", margin, yPos);
//       doc
//         .font("Courier")
//         .text(` ${now.toLocaleDateString()}`, margin + 25, yPos);
//       yPos += 10;

//       // Time
//       doc.font("Courier-Bold").text("Time:", margin, yPos);
//       doc.font("Courier").text(
//         ` ${now.toLocaleTimeString([], {
//           hour: "2-digit",
//           minute: "2-digit",
//         })}`,
//         margin + 25,
//         yPos,
//       );
//       yPos += 12;

//       /* ===== DASHED SEPARATOR ===== */
//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .dash(2, { space: 2 })
//         .strokeColor("#888888")
//         .lineWidth(0.3)
//         .stroke();
//       yPos += 12;

//       /* ===== PAYMENT DATES SECTION ===== */
//       doc.font("Courier-Bold").fontSize(9);
//       doc.text("PAYMENT DATES", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 12;

//       doc.fontSize(8);

//       // Date Deposited (paymentReceivedOn)
//       const depositDate = payment.paymentReceivedOn
//         ? new Date(payment.paymentReceivedOn).toLocaleDateString()
//         : now.toLocaleDateString();

//       doc.font("Courier-Bold").text("Date Deposited:", margin, yPos);
//       doc.font("Courier").text(` ${depositDate}`, margin + 65, yPos);
//       yPos += 10;

//       // Date Verified (verifiedAt)
//       const verifiedDate = payment.verifiedAt
//         ? new Date(payment.verifiedAt).toLocaleDateString()
//         : now.toLocaleDateString();

//       doc.font("Courier-Bold").text("Date Verified:", margin, yPos);
//       doc.font("Courier").text(` ${verifiedDate}`, margin + 65, yPos);
//       yPos += 10;

//       // Verified By (user name)
//       if (payment.verifiedBy && payment.verifiedBy.firstName) {
//         const verifierName = `${payment.verifiedBy.firstName} ${payment.verifiedBy.surname}`;
//         doc.font("Courier-Bold").text("Verified By:", margin, yPos);
//         doc.font("Courier").text(` ${verifierName}`, margin + 55, yPos);
//         yPos += 10;
//       }
//       yPos += 8;

//       /* ===== DASHED SEPARATOR ===== */
//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .dash(2, { space: 2 })
//         .strokeColor("#888888")
//         .lineWidth(0.3)
//         .stroke();
//       yPos += 12;

//       /* ===== ACADEMIC INFORMATION (NEW SECTION) ===== */
//       // Only show if we have application data
//       if (application) {
//         doc.font("Courier-Bold").fontSize(9);
//         doc.text("ACADEMIC INFORMATION", margin, yPos, {
//           width: contentWidth,
//           align: "center",
//         });
//         yPos += 12;

//         doc.fontSize(8);

//         // Mode of Study
//         if (application.modeOfStudy) {
//           doc.font("Courier-Bold").text("Mode of Study:", margin, yPos);
//           doc
//             .font("Courier")
//             .text(` ${application.modeOfStudy}`, margin + 55, yPos);
//           yPos += 10;
//         }

//         // Approved Programme - Only show if application is approved
//         if (application.status === "Approved" && application.firstChoice) {
//           let programmeText = "Programme Approved";

//           if (typeof application.firstChoice === "object") {
//             programmeText =
//               application.firstChoice.name || "Programme Approved";
//             if (application.firstChoice.code) {
//               programmeText += ` (${application.firstChoice.code})`;
//             }
//           }

//           doc.font("Courier-Bold").text("Approved Programme:", margin, yPos);
//           yPos += 10;

//           doc.font("Courier").text(programmeText, margin + 12, yPos, {
//             width: contentWidth - 12,
//             lineGap: 2,
//           });

//           // Calculate text height
//           const programmeHeight = doc.heightOfString(programmeText, {
//             width: contentWidth - 15,
//             lineGap: 2,
//           });
//           yPos += programmeHeight + 8;
//         } else if (application.firstChoice) {
//           // Show first choice if not approved yet
//           let programmeText = "Not specified";

//           if (typeof application.firstChoice === "object") {
//             programmeText = application.firstChoice.name || "First Choice";
//             if (application.firstChoice.code) {
//               programmeText += ` (${application.firstChoice.code})`;
//             }
//           }

//           doc.font("Courier-Bold").text("Applied Programme:", margin, yPos);
//           yPos += 10;

//           doc.font("Courier").text(programmeText, margin + 12, yPos, {
//             width: contentWidth - 12,
//             lineGap: 2,
//           });

//           const programmeHeight = doc.heightOfString(programmeText, {
//             width: contentWidth - 15,
//             lineGap: 2,
//           });
//           yPos += programmeHeight + 8;
//         }

//         yPos += 8;

//         /* ===== DASHED SEPARATOR ===== */
//         doc
//           .moveTo(margin, yPos)
//           .lineTo(pageWidth - margin, yPos)
//           .dash(2, { space: 2 })
//           .strokeColor("#888888")
//           .lineWidth(0.3)
//           .stroke();
//         yPos += 12;
//       }

//       /* ===== STUDENT INFORMATION ===== */
//       doc.font("Courier-Bold").fontSize(9);
//       doc.text("STUDENT INFORMATION", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 12;

//       doc.fontSize(8);

//       if (payment.student) {
//         const fullName = `${payment.student.firstName} ${payment.student.surname}`;

//         // Name
//         doc.font("Courier-Bold").text("Name:", margin, yPos);
//         yPos += 10;
//         doc.font("Courier").text(fullName, margin + 12, yPos, {
//           width: contentWidth - 12,
//         });
//         yPos += 10;

//         const email = payment.student.email || "N/A";
//         // Email
//         doc.font("Courier-Bold").text("Email:", margin, yPos);
//         yPos += 10;
//         doc.font("Courier").text(email, margin + 12, yPos, {
//           width: contentWidth - 12,
//         });
//         yPos += 10;

//         if (payment.student.studentId) {
//           // Student ID
//           doc.font("Courier-Bold").text("Student ID:", margin, yPos);
//           yPos += 10;
//           doc
//             .font("Courier")
//             .text(payment.student.studentId, margin + 12, yPos, {
//               width: contentWidth - 12,
//             });
//           yPos += 10;
//         }
//       }
//       yPos += 8;

//       /* ===== DASHED SEPARATOR ===== */
//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .dash(2, { space: 2 })
//         .strokeColor("#888888")
//         .lineWidth(0.3)
//         .stroke();
//       yPos += 12;

//       /* ===== PAYMENT DETAILS ===== */
//       doc.font("Courier-Bold").fontSize(9);
//       doc.text("PAYMENT DETAILS", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 12;

//       doc.fontSize(8);

//       // Category
//       doc.font("Courier-Bold").text("Category:", margin, yPos);
//       yPos += 10;
//       doc.font("Courier").text(payment.category || "N/A", margin + 12, yPos, {
//         width: contentWidth - 12,
//       });
//       yPos += 10;

//       const description = payment.description || "Payment";
//       // Description
//       doc.font("Courier-Bold").text("Description:", margin, yPos);
//       yPos += 10;

//       const descriptionHeight = doc.heightOfString(description, {
//         width: contentWidth - 15,
//         lineGap: 2,
//       });

//       doc.font("Courier").text(description, margin + 12, yPos, {
//         width: contentWidth - 15,
//         lineGap: 2,
//       });
//       yPos += descriptionHeight + 8;

//       // Method
//       doc.font("Courier-Bold").text("Method:", margin, yPos);
//       doc
//         .font("Courier")
//         .text(` ${payment.method || "N/A"}`, margin + 35, yPos);
//       yPos += 10;

//       if (payment.semester) {
//         // Semester
//         doc.font("Courier-Bold").text("Semester:", margin, yPos);
//         doc.font("Courier").text(` ${payment.semester}`, margin + 45, yPos);
//         yPos += 10;
//       }

//       if (payment.academicYear) {
//         // Academic Year
//         doc.font("Courier-Bold").text("Academic Year:", margin, yPos);
//         doc.font("Courier").text(` ${payment.academicYear}`, margin + 65, yPos);
//         yPos += 10;
//       }
//       yPos += 8;

//       /* ===== PAYMENT SUMMARY SECTION ===== */
//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();
//       yPos += 10;

//       doc.font("Courier-Bold").fontSize(9);
//       doc.text("PAYMENT SUMMARY", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 12;

//       doc.fontSize(8);

//       // Helper function to format numbers with thousand separator
//       const formatNumber = (num) => {
//         return parseFloat(num)
//           .toFixed(2)
//           .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
//       };

//       const amountStartX = margin + 60;
//       const amountPaid = parseFloat(payment.amount) || 0;
//       const totalDue = parseFloat(payment.totalDue) || amountPaid;
//       const balanceRemaining = parseFloat(payment.balanceAfterPayment) || 0;

//       // Total Due
//       doc.font("Courier-Bold").text("Total Due:", margin, yPos);
//       doc
//         .font("Courier")
//         .text(`ZMW ${formatNumber(totalDue)}`, amountStartX, yPos);
//       yPos += 10;

//       // Amount Paid
//       doc.font("Courier-Bold").text("Amount Paid:", margin, yPos);
//       doc
//         .font("Courier")
//         .text(`ZMW ${formatNumber(amountPaid)}`, amountStartX, yPos);
//       yPos += 10;

//       // Balance
//       doc.font("Courier-Bold").text("Balance:", margin, yPos);
//       doc
//         .font("Courier")
//         .text(`ZMW ${formatNumber(balanceRemaining)}`, amountStartX, yPos);
//       yPos += 12;

//       // Total Paid separator
//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();
//       yPos += 10;

//       // TOTAL PAID
//       doc.font("Courier-Bold").fontSize(9);
//       doc.text("TOTAL PAID:", margin, yPos);
//       doc
//         .font("Courier")
//         .fontSize(8)
//         .text(`ZMW ${formatNumber(amountPaid)}`, amountStartX, yPos);
//       yPos += 12;

//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();
//       yPos += 12;

//       /* ===== PAYMENT STATUS ===== */
//       const status = payment.status ? payment.status.toUpperCase() : "PENDING";
//       const statusColor =
//         status === "VERIFIED" || status === "FULLY PAID"
//           ? "#008000"
//           : status === "PARTIALLY PAID"
//             ? "#FFA500"
//             : "#FF0000";

//       doc.font("Courier-Bold").fontSize(9).fillColor(statusColor);
//       doc.text(`STATUS: ${status}`, margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 12;

//       /* ===== SIGNATURE AREA ===== */
//       yPos += 8;

//       // Signature line
//       doc
//         .moveTo(margin + 30, yPos + 15)
//         .lineTo(pageWidth - margin - 30, yPos + 15)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();

//       yPos += 25;

//       // University name in signature area
//       doc.font("Courier").fontSize(8);
//       doc.text("COPPERSTONE UNIVERSITY", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 12;

//       // Finance Department
//       doc.font("Courier").fontSize(6).fillColor("#000000");
//       doc.text("Our Vision!,Our Country,Our World!", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 10;

//       /* ===== FOOTER SECTION ===== */
//       // Top dashed line
//       doc
//         .moveTo(margin + 10, yPos)
//         .lineTo(pageWidth - margin - 10, yPos)
//         .dash(2, { space: 2 })
//         .strokeColor("#000000")
//         .lineWidth(0.3)
//         .stroke();
//       yPos += 10;

//       // ADDRESS SECTION
//       doc.font("Courier").fontSize(6);
//       doc.text("Plot 38002, Baluba Campus", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 8;

//       doc.text("Ndola-Kitwe Dual carriageway, KITWE", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 8;

//       // Thank you message
//       doc.font("Courier-Oblique").fontSize(8);
//       doc.text("Thank you for your payment", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 10;

//       // Add payment balance note if applicable
//       if (balanceRemaining > 0) {
//         doc.font("Courier-Bold").fontSize(7).fillColor("#FF0000");
//         doc.text(
//           `* Balance of ZMW ${formatNumber(balanceRemaining)} pending`,
//           margin,
//           yPos,
//           {
//             width: contentWidth,
//             align: "center",
//           },
//         );
//         yPos += 10;
//       }

//       // Bottom border
//       doc
//         .moveTo(margin + 10, yPos)
//         .lineTo(pageWidth - margin - 10, yPos)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();

//       doc.end();

//       stream.on("finish", () => resolve(outPath));
//       stream.on("error", reject);
//     } catch (err) {
//       reject(err);
//     }
//   });
// }

// module.exports = { generateReceiptPDF };

async function generateReceiptPDF({ payment, application = null }) {
  return new Promise(async (resolve, reject) => {
    try {
      // Thermal receipt dimensions
      const pageWidth = 165; // 58mm width
      const margin = 10;

      // Create document with consistent font
      const doc = new PDFDocument({
        margin: 0,
        size: [pageWidth, 600],
        autoFirstPage: false,
        font: "Courier",
      });

      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const fileName = `Receipt_${payment._id}_${Date.now()}.pdf`;
      const outPath = path.join(tmpDir, fileName);
      const stream = fs.createWriteStream(outPath);
      doc.pipe(stream);

      // Download images if available
      let logoBuffer;

      try {
        if (process.env.LOGO) {
          logoBuffer = await downloadImage(process.env.LOGO);
        }
      } catch (err) {
        console.log("Logo not loaded:", err.message);
      }

      // Add page with exact dimensions
      doc.addPage({ margin: 0, size: [pageWidth, 800] }); // Increased height to accommodate all sections

      let yPos = margin;
      const contentWidth = pageWidth - margin * 2;

      /* ===== HEADER SECTION ===== */
      if (logoBuffer) {
        const logoSize = 45;
        const logoX = (pageWidth - logoSize) / 2;
        doc.image(logoBuffer, logoX, yPos, {
          width: logoSize,
          height: logoSize,
          fit: [logoSize, logoSize],
        });
        yPos += logoSize + 8;
      }

      // University Title Section
      doc
        .fontSize(10)
        .font("Courier-Bold")
        .text("COPPERSTONE UNIVERSITY", margin, yPos, {
          width: contentWidth,
          align: "center",
        });
      yPos += 14;

      // Official Receipt Section
      doc
        .fontSize(9)
        .font("Courier-Bold")
        .text("OFFICIAL PAYMENT RECEIPT", margin, yPos, {
          width: contentWidth,
          align: "center",
        });
      yPos += 12;

      // Department Section
      doc.fontSize(8).font("Courier").text("Finance Department", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 12;

      /* ===== HEADER SEPARATOR ===== */
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();
      yPos += 12;

      /* ===== RECEIPT INFORMATION ===== */
      doc.font("Courier-Bold").fontSize(9);
      doc.text("RECEIPT INFORMATION", margin, yPos);
      yPos += 12;

      doc.font("Courier").fontSize(8);

      const receiptId =
        payment.reference ||
        payment._id?.toString().slice(-8) ||
        `RC-${Date.now().toString().slice(-6)}`;

      // Receipt No
      doc.font("Courier-Bold").text("Receipt No:", margin, yPos);
      doc.font("Courier").text(` ${receiptId}`, margin + 50, yPos);
      yPos += 10;

      // Date
      const now = new Date();
      doc.font("Courier-Bold").text("Date:", margin, yPos);
      doc
        .font("Courier")
        .text(` ${now.toLocaleDateString()}`, margin + 25, yPos);
      yPos += 10;

      // Time
      doc.font("Courier-Bold").text("Time:", margin, yPos);
      doc.font("Courier").text(
        ` ${now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        margin + 25,
        yPos,
      );
      yPos += 12;

      /* ===== DASHED SEPARATOR ===== */
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .dash(2, { space: 2 })
        .strokeColor("#888888")
        .lineWidth(0.3)
        .stroke();
      yPos += 12;

      /* ===== PAYMENT DATES SECTION ===== */
      doc.font("Courier-Bold").fontSize(9);
      doc.text("PAYMENT DATES", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 12;

      doc.fontSize(8);

      // Date Deposited (paymentReceivedOn)
      const depositDate = payment.paymentReceivedOn
        ? new Date(payment.paymentReceivedOn).toLocaleDateString()
        : now.toLocaleDateString();

      doc.font("Courier-Bold").text("Date Deposited:", margin, yPos);
      doc.font("Courier").text(` ${depositDate}`, margin + 65, yPos);
      yPos += 10;

      // Date Verified (verifiedAt)
      const verifiedDate = payment.verifiedAt
        ? new Date(payment.verifiedAt).toLocaleDateString()
        : now.toLocaleDateString();

      doc.font("Courier-Bold").text("Date Verified:", margin, yPos);
      doc.font("Courier").text(` ${verifiedDate}`, margin + 65, yPos);
      yPos += 10;

      // Verified By (user name)
      if (payment.verifiedBy && payment.verifiedBy.firstName) {
        const verifierName = `${payment.verifiedBy.firstName} ${payment.verifiedBy.surname}`;
        doc.font("Courier-Bold").text("Verified By:", margin, yPos);
        doc.font("Courier").text(` ${verifierName}`, margin + 55, yPos);
        yPos += 10;
      }
      yPos += 8;

      /* ===== DASHED SEPARATOR ===== */
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .dash(2, { space: 2 })
        .strokeColor("#888888")
        .lineWidth(0.3)
        .stroke();
      yPos += 12;
      /* ===== COMPACT ACADEMIC INFORMATION SECTION ===== */
      // Show academic info if available
      if (application || payment.programme) {
        doc.font("Courier-Bold").fontSize(9);
        doc.text("ACADEMIC INFORMATION", margin, yPos, {
          width: contentWidth,
          align: "center",
        });
        yPos += 12;

        doc.fontSize(8);

        // Get programme information
        let programmeName = "Not Specified";
        let programmeCode = "";
        let modeOfStudy = "";

        // First check application data
        if (application) {
          if (application.firstChoice) {
            if (typeof application.firstChoice === "object") {
              programmeName = application.firstChoice.name || programmeName;
              programmeCode = application.firstChoice.code || "";
            } else {
              programmeName = application.firstChoice;
            }
          }
          modeOfStudy = application.modeOfStudy || "";
        }

        // Then check payment.programme
        else if (payment.programme) {
          if (typeof payment.programme === "object") {
            programmeName = payment.programme.name || programmeName;
            programmeCode = payment.programme.code || "";
          } else {
            programmeName = payment.programme;
          }
        }

        // Get mode of study, semester, and academic year
        modeOfStudy = modeOfStudy || payment.modeOfStudy || "";
        const semester = payment.semester || "";
        const academicYear =
          payment.academicYear || new Date().getFullYear().toString();

        // Programme display
        if (programmeCode) {
          doc.font("Courier-Bold").text("Programme:", margin, yPos);
          doc.font("Courier").text(`${programmeCode}`, margin + 55, yPos);
          yPos += 10;
          doc.font("Courier").text(programmeName, margin + 5, yPos, {
            width: contentWidth - 5,
            lineGap: 1,
          });
          const programmeHeight = doc.heightOfString(programmeName, {
            width: contentWidth - 5,
            lineGap: 1,
          });
          yPos += programmeHeight + 4;
        } else if (programmeName !== "Not Specified") {
          doc.font("Courier-Bold").text("Programme:", margin, yPos);
          yPos += 10;
          doc.font("Courier").text(programmeName, margin + 5, yPos, {
            width: contentWidth - 5,
            lineGap: 1,
          });
          const programmeHeight = doc.heightOfString(programmeName, {
            width: contentWidth - 5,
            lineGap: 1,
          });
          yPos += programmeHeight + 4;
        }

        // Mode of Study (on its own line)
        if (modeOfStudy) {
          doc.font("Courier-Bold").text("Mode:", margin, yPos);
          doc.font("Courier").text(modeOfStudy, margin + 30, yPos);
          yPos += 10;
        }

        // Semester (on its own line below Programme)
        if (semester) {
          doc.font("Courier-Bold").text("Semester:", margin, yPos);
          doc.font("Courier").text(semester, margin + 45, yPos);
          yPos += 10;
        }

        // Academic Year (display as "Year")
        if (academicYear) {
          doc.font("Courier-Bold").text("Year:", margin, yPos);
          doc.font("Courier").text(academicYear, margin + 30, yPos);
          yPos += 10;
        }

        yPos += 8;

        /* ===== DASHED SEPARATOR ===== */
        doc
          .moveTo(margin, yPos)
          .lineTo(pageWidth - margin, yPos)
          .dash(2, { space: 2 })
          .strokeColor("#888888")
          .lineWidth(0.3)
          .stroke();
        yPos += 12;
      }

      /* ===== STUDENT INFORMATION ===== */
      doc.font("Courier-Bold").fontSize(9);
      doc.text("STUDENT INFORMATION", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 12;

      doc.fontSize(8);

      if (payment.student) {
        const fullName = `${payment.student.firstName} ${payment.student.surname}`;

        // Name
        doc.font("Courier-Bold").text("Name:", margin, yPos);
        yPos += 10;
        doc.font("Courier").text(fullName, margin + 12, yPos, {
          width: contentWidth - 12,
        });
        yPos += 10;

        const email = payment.student.email || "N/A";
        // Email
        doc.font("Courier-Bold").text("Email:", margin, yPos);
        yPos += 10;
        doc.font("Courier").text(email, margin + 12, yPos, {
          width: contentWidth - 12,
        });
        yPos += 10;

        if (payment.student.studentId) {
          // Student ID
          doc.font("Courier-Bold").text("Student ID:", margin, yPos);
          yPos += 10;
          doc
            .font("Courier")
            .text(payment.student.studentId, margin + 12, yPos, {
              width: contentWidth - 12,
            });
          yPos += 10;
        }
      }
      yPos += 8;

      /* ===== DASHED SEPARATOR ===== */
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .dash(2, { space: 2 })
        .strokeColor("#888888")
        .lineWidth(0.3)
        .stroke();
      yPos += 12;

      /* ===== PAYMENT DETAILS ===== */
      doc.font("Courier-Bold").fontSize(9);
      doc.text("PAYMENT DETAILS", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 12;

      doc.fontSize(8);

      // Category
      doc.font("Courier-Bold").text("Category:", margin, yPos);
      yPos += 10;
      doc.font("Courier").text(payment.category || "N/A", margin + 12, yPos, {
        width: contentWidth - 12,
      });
      yPos += 10;

      const description = payment.description || "Payment";
      // Description
      doc.font("Courier-Bold").text("Description:", margin, yPos);
      yPos += 10;

      const descriptionHeight = doc.heightOfString(description, {
        width: contentWidth - 15,
        lineGap: 2,
      });

      doc.font("Courier").text(description, margin + 12, yPos, {
        width: contentWidth - 15,
        lineGap: 2,
      });
      yPos += descriptionHeight + 8;

      // Method
      doc.font("Courier-Bold").text("Method:", margin, yPos);
      doc
        .font("Courier")
        .text(` ${payment.method || "N/A"}`, margin + 35, yPos);
      yPos += 10;

      yPos += 8;

      /* ===== PAYMENT SUMMARY SECTION ===== */
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();
      yPos += 10;

      doc.font("Courier-Bold").fontSize(9);
      doc.text("PAYMENT SUMMARY", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 12;

      doc.fontSize(8);

      // Helper function to format numbers with thousand separator
      const formatNumber = (num) => {
        return parseFloat(num)
          .toFixed(2)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      };

      const amountStartX = margin + 60;
      const amountPaid = parseFloat(payment.amount) || 0;
      const totalDue = parseFloat(payment.totalDue) || amountPaid;
      const balanceRemaining = parseFloat(payment.balanceAfterPayment) || 0;

      // Total Due
      doc.font("Courier-Bold").text("Total Due:", margin, yPos);
      doc
        .font("Courier")
        .text(`ZMW ${formatNumber(totalDue)}`, amountStartX, yPos);
      yPos += 10;

      // Amount Paid
      doc.font("Courier-Bold").text("Amount Paid:", margin, yPos);
      doc
        .font("Courier")
        .text(`ZMW ${formatNumber(amountPaid)}`, amountStartX, yPos);
      yPos += 10;

      // Balance
      doc.font("Courier-Bold").text("Balance:", margin, yPos);
      doc
        .font("Courier")
        .text(`ZMW ${formatNumber(balanceRemaining)}`, amountStartX, yPos);
      yPos += 12;

      // Total Paid separator
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();
      yPos += 10;

      // TOTAL PAID
      doc.font("Courier-Bold").fontSize(9);
      doc.text("TOTAL PAID:", margin, yPos);
      doc
        .font("Courier")
        .fontSize(8)
        .text(`ZMW ${formatNumber(amountPaid)}`, amountStartX, yPos);
      yPos += 12;

      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();
      yPos += 12;

      /* ===== PAYMENT STATUS ===== */
      const status = payment.status ? payment.status.toUpperCase() : "PENDING";
      const statusColor =
        status === "VERIFIED" || status === "FULLY PAID"
          ? "#008000"
          : status === "PARTIALLY PAID"
            ? "#FFA500"
            : "#FF0000";

      doc.font("Courier-Bold").fontSize(9).fillColor(statusColor);
      doc.text(`STATUS: ${status}`, margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 12;

      /* ===== SIGNATURE AREA ===== */
      yPos += 8;

      // Signature line
      doc
        .moveTo(margin + 30, yPos + 15)
        .lineTo(pageWidth - margin - 30, yPos + 15)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();

      yPos += 25;

      // University name in signature area
      doc.font("Courier").fontSize(8);
      doc.text("COPPERSTONE UNIVERSITY", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 12;

      // Finance Department
      doc.font("Courier").fontSize(6).fillColor("#000000");
      doc.text("Our Vision!,Our Country,Our World!", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 10;

      /* ===== FOOTER SECTION ===== */
      // Top dashed line
      doc
        .moveTo(margin + 10, yPos)
        .lineTo(pageWidth - margin - 10, yPos)
        .dash(2, { space: 2 })
        .strokeColor("#000000")
        .lineWidth(0.3)
        .stroke();
      yPos += 10;

      // ADDRESS SECTION
      doc.font("Courier").fontSize(6);
      doc.text("Plot 38002, Baluba Campus", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 8;

      doc.text("Ndola-Kitwe Dual carriageway, KITWE", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 8;

      // Thank you message
      doc.font("Courier-Oblique").fontSize(8);
      doc.text("Thank you for your payment", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 10;

      // Add payment balance note if applicable
      if (balanceRemaining > 0) {
        doc.font("Courier-Bold").fontSize(7).fillColor("#FF0000");
        doc.text(
          `* Balance of ZMW ${formatNumber(balanceRemaining)} pending`,
          margin,
          yPos,
          {
            width: contentWidth,
            align: "center",
          },
        );
        yPos += 10;
      }

      // Bottom border
      doc
        .moveTo(margin + 10, yPos)
        .lineTo(pageWidth - margin - 10, yPos)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();

      doc.end();

      stream.on("finish", () => resolve(outPath));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateReceiptPDF };
