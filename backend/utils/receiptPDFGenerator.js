// // const PDFDocument = require("pdfkit");
// // const fs = require("fs");
// // const path = require("path");

// // async function generateReceiptPDF({ application, payment }) {
// //   return new Promise((resolve, reject) => {
// //     try {
// //       const doc = new PDFDocument({ margin: 50 });
// //       const tmpDir = path.join(__dirname, "../../tmp");
// //       if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

// //       const fileName = `Receipt_${application._id}_${Date.now()}.pdf`;
// //       const outPath = path.join(tmpDir, fileName);

// //       doc.pipe(fs.createWriteStream(outPath));

// //       doc.fontSize(18).text("COPPERSTONE UNIVERSITY", { align: "center" });
// //       doc.moveDown();
// //       doc.fontSize(14).text("OFFICIAL PAYMENT RECEIPT", { align: "center" });
// //       doc.moveDown(2);

// //       doc.fontSize(11);
// //       doc.text(`Receipt Date: ${new Date().toDateString()}`);
// //       doc.text(
// //         `Student: ${application.applicant.firstName} ${application.applicant.surname}`
// //       );
// //       doc.text(`Email: ${application.applicant.email}`);
// //       doc.moveDown();

// //       doc.text(`Description: ${payment.description}`);
// //       doc.text(`Payment Method: ${payment.method}`);
// //       doc.text(`Amount Paid: ZMW ${payment.amount}`);
// //       doc.text(`Status: VERIFIED`);
// //       doc.moveDown(2);

// //       doc.text("Issued by Finance Office");
// //       doc.text("Copperstone University");

// //       doc.end();

// //       doc.on("end", () => resolve(outPath));
// //     } catch (err) {
// //       reject(err);
// //     }
// //   });
// // }

// // module.exports = { generateReceiptPDF };

// // utils/receiptPDFGenerator.js
// const PDFDocument = require("pdfkit");
// const fs = require("fs");
// const path = require("path");

// async function generateReceiptPDF({ payment }) {
//   // Changed parameter to only accept payment
//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ margin: 50 });
//       const tmpDir = path.join(__dirname, "../../tmp");
//       if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

//       // Use payment._id instead of application._id
//       const fileName = `Receipt_${payment._id}_${Date.now()}.pdf`;
//       const outPath = path.join(tmpDir, fileName);

//       doc.pipe(fs.createWriteStream(outPath));

//       // Header
//       doc.fontSize(18).text("COPPERSTONE UNIVERSITY", { align: "center" });
//       doc.moveDown();
//       doc.fontSize(14).text("OFFICIAL PAYMENT RECEIPT", { align: "center" });
//       doc.moveDown(2);

//       // Receipt details
//       doc.fontSize(11);
//       doc.text(`Receipt No: ${payment._id}`);
//       doc.text(`Receipt Date: ${new Date().toDateString()}`);
//       doc.moveDown();

//       // Check if student data exists and is populated
//       if (payment.student) {
//         doc.text(
//           `Student: ${payment.student.firstName} ${payment.student.surname}`
//         );
//         doc.text(`Email: ${payment.student.email}`);
//         doc.moveDown();
//       } else {
//         doc.text(`Student ID: ${payment.student}`);
//         doc.moveDown();
//       }

//       // Payment details
//       doc.text(`Payment Category: ${payment.category}`);
//       doc.text(`Description: ${payment.description}`);
//       doc.text(`Payment Method: ${payment.method}`);
//       doc.text(`Amount Paid: ZMW ${payment.amount.toFixed(2)}`);

//       if (payment.semester) {
//         doc.text(`Semester: ${payment.semester}`);
//       }

//       if (payment.academicYear) {
//         doc.text(`Academic Year: ${payment.academicYear}`);
//       }

//       doc.text(`Status: ${payment.status || "VERIFIED"}`);
//       doc.moveDown(2);

//       // Footer
//       doc.text("Issued by Finance Office");
//       doc.text("Copperstone University");
//       doc.moveDown();
//       doc
//         .fontSize(10)
//         .text("This is an official receipt. Please keep it for your records.", {
//           align: "center",
//         });

//       doc.end();

//       doc.on("end", () => resolve(outPath));
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

async function generateReceiptPDF({ payment }) {
  return new Promise(async (resolve, reject) => {
    try {
      // 2-inch thermal printer width: 58mm = 165 points
      const pageWidth = 165; // 58mm width
      const margin = 5; // Very small margin for thermal

      const doc = new PDFDocument({
        margin: 0,
        size: [pageWidth, 800], // Fixed height, will auto-expand
        autoFirstPage: false,
      });

      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const fileName = `Receipt_${payment._id}_${Date.now()}.pdf`;
      const outPath = path.join(tmpDir, fileName);
      const stream = fs.createWriteStream(outPath);
      doc.pipe(stream);

      // Download logo and signature (simplified for thermal)
      let simpleLogoBuffer, signatureBuffer;

      try {
        const logoUrl = process.env.LOGO;
        if (logoUrl) {
          simpleLogoBuffer = await downloadImage(logoUrl);
        }
      } catch (e) {
        console.warn("⚠️ Could not load logo for thermal receipt:", e.message);
      }

      try {
        const signatureUrl = process.env.SIGNATURE;
        if (signatureUrl) {
          signatureBuffer = await downloadImage(signatureUrl);
        }
      } catch (e) {
        console.warn(
          "⚠️ Could not load signature for thermal receipt:",
          e.message
        );
      }

      // Add first page
      doc.addPage({ margin: 0, size: [pageWidth, 800] });

      let yPos = margin;

      // ===== THERMAL RECEIPT HEADER =====
      // Top line
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .stroke();
      yPos += 8;

      // Simple logo (small for thermal)
      if (simpleLogoBuffer) {
        try {
          // Resize logo to fit thermal width
          const logoWidth = 30;
          const logoHeight = 30;
          const logoX = (pageWidth - logoWidth) / 2;

          doc.image(simpleLogoBuffer, logoX, yPos, {
            width: logoWidth,
            height: logoHeight,
          });
          yPos += logoHeight + 5;
        } catch (e) {
          console.warn("⚠️ Could not add logo to thermal receipt:", e.message);
        }
      }

      // University name (centered, bold)
      doc.font("Courier-Bold").fontSize(9).text("COPPERSTONE UNIVERSITY", {
        align: "center",
        y: yPos,
      });
      yPos += 12;

      doc.font("Courier-Bold").fontSize(8).text("OFFICIAL PAYMENT RECEIPT", {
        align: "center",
      });
      yPos += 10;

      // Finance department
      doc.font("Courier").fontSize(7).text("Finance Department", {
        align: "center",
      });
      yPos += 15;

      // Separator line
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .stroke();
      yPos += 8;

      // ===== RECEIPT INFO (COMPACT) =====
      doc.font("Courier").fontSize(7);

      // Receipt number and date on same line
      // const receiptId = payment._id.toString().slice(-8).toUpperCase();
      const receiptId =
        payment.reference ||
        payment._id?.toString()?.slice(-8) ||
        "APP-" + Date.now().toString().slice(-6);

      const receiptLine = `RECEIPT: ${receiptId}`;
      const dateLine = `DATE: ${new Date().toLocaleDateString()}`;

      // Calculate positions
      const receiptWidth = doc.widthOfString(receiptLine);
      const dateWidth = doc.widthOfString(dateLine);

      doc.text(receiptLine, margin, yPos);
      doc.text(dateLine, pageWidth - margin - dateWidth, yPos);
      yPos += 9;

      // Time
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.text(`TIME: ${time}`, margin, yPos);
      yPos += 9;

      // Separator
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .stroke();
      yPos += 8;

      // ===== STUDENT INFO =====
      doc.font("Courier-Bold").fontSize(8).text("STUDENT", { align: "center" });
      yPos += 10;

      doc.font("Courier").fontSize(7);

      if (payment.student) {
        // Truncate long names for thermal
        const fullName = `${payment.student.firstName} ${payment.student.surname}`;
        const truncatedName =
          fullName.length > 24 ? fullName.substring(0, 21) + "..." : fullName;

        doc.text(`NAME: ${truncatedName}`, margin, yPos);
        yPos += 8;

        // Truncate email
        const email = payment.student.email;
        const truncatedEmail =
          email.length > 28 ? email.substring(0, 25) + "..." : email;
        doc.text(`EMAIL: ${truncatedEmail}`, margin, yPos);
        yPos += 8;

        if (payment.student.studentId) {
          doc.text(`ID: ${payment.student.studentId}`, margin, yPos);
          yPos += 8;
        }
      } else {
        doc.text(`STUDENT ID: ${payment.student}`, margin, yPos);
        yPos += 8;
      }

      // Separator
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .stroke();
      yPos += 8;

      // ===== PAYMENT DETAILS =====
      doc
        .font("Courier-Bold")
        .fontSize(8)
        .text("PAYMENT DETAILS", { align: "center" });
      yPos += 10;

      doc.font("Courier").fontSize(7);

      // Category
      const category =
        payment.category.length > 20
          ? payment.category.substring(0, 17) + "..."
          : payment.category;
      doc.text(`CATEGORY: ${category}`, margin, yPos);
      yPos += 8;

      // Description (may wrap)
      const desc = payment.description;
      if (desc.length > 28) {
        // Split long descriptions
        const firstLine = desc.substring(0, 28);
        const secondLine = desc.substring(28, 56);
        doc.text(`DESC: ${firstLine}`, margin, yPos);
        yPos += 8;
        if (secondLine) {
          doc.text(`      ${secondLine}`, margin, yPos);
          yPos += 8;
        }
      } else {
        doc.text(`DESC: ${desc}`, margin, yPos);
        yPos += 8;
      }

      doc.text(`METHOD: ${payment.method}`, margin, yPos);
      yPos += 8;

      if (payment.semester) {
        doc.text(`SEMESTER: ${payment.semester}`, margin, yPos);
        yPos += 8;
      }

      if (payment.academicYear) {
        doc.text(`YEAR: ${payment.academicYear}`, margin, yPos);
        yPos += 8;
      }

      // Separator
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .stroke();
      yPos += 8;

      // ===== AMOUNT SECTION =====
      doc
        .font("Courier-Bold")
        .fontSize(8)
        .text("AMOUNT BREAKDOWN", { align: "center" });
      yPos += 10;

      const amount = parseFloat(payment.amount);
      const vatRate = 0.16;
      const vatAmount = amount * vatRate;
      const subtotal = amount - vatAmount;

      // Helper for amount lines
      const addAmountLine = (label, value, isTotal = false) => {
        if (isTotal) {
          doc.font("Courier-Bold").fontSize(8);
        } else {
          doc.font("Courier").fontSize(7);
        }

        // Label
        doc.text(label, margin, yPos);

        // Value (right aligned)
        const valueText = `ZMW ${value.toFixed(2)}`;
        const valueWidth = doc.widthOfString(valueText);
        doc.text(valueText, pageWidth - margin - valueWidth, yPos);

        yPos += isTotal ? 10 : 7;
      };

      addAmountLine("SUBTOTAL:", subtotal);
      addAmountLine("VAT (16%):", vatAmount);

      // Total line
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .stroke();
      yPos += 5;

      addAmountLine("TOTAL:", amount, true);

      // Double line for total
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .stroke();
      yPos += 10;

      // ===== PAYMENT STATUS =====
      doc
        .font("Courier-Bold")
        .fontSize(8)
        .text(`STATUS: ${payment.status.toUpperCase()}`, { align: "center" });
      yPos += 12;

      if (payment.verifiedAt) {
        doc
          .font("Courier")
          .fontSize(7)
          .text(
            `VERIFIED: ${new Date(payment.verifiedAt).toLocaleDateString()}`,
            { align: "center" }
          );
        yPos += 8;
      }

      // ===== SIGNATURE SECTION (THERMAL FRIENDLY) =====
      yPos += 10;

      // Small signature for thermal
      if (signatureBuffer) {
        try {
          const sigWidth = 40;
          const sigHeight = 20;
          const sigX = (pageWidth - sigWidth) / 2;

          doc.image(signatureBuffer, sigX, yPos, {
            width: sigWidth,
            height: sigHeight,
          });
          yPos += sigHeight + 5;
        } catch (e) {
          console.warn(
            "⚠️ Could not add signature to thermal receipt:",
            e.message
          );
        }
      }

      // Finance officer line
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .stroke();
      yPos += 8;

      doc
        .font("Courier-Bold")
        .fontSize(8)
        .text("FINANCE DEPARTMENT", { align: "center" });
      yPos += 10;

      doc
        .font("Courier")
        .fontSize(7)
        .text("Copperstone University", { align: "center" });
      yPos += 7;

      // ===== FOOTER =====
      yPos += 10;
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .stroke();
      yPos += 8;

      doc
        .font("Courier")
        .fontSize(6)
        .text("*** OFFICIAL RECEIPT ***", { align: "center" });
      yPos += 7;

      doc
        .font("Courier")
        .fontSize(6)
        .text("Keep for your records", { align: "center" });
      yPos += 7;

      doc
        .font("Courier")
        .fontSize(6)
        .text("Valid for tax purposes", { align: "center" });
      yPos += 10;

      // Contact info (compact)
      doc
        .font("Courier")
        .fontSize(5)
        .text("finance@copperstone.edu.zm", { align: "center" });
      yPos += 6;

      doc
        .font("Courier")
        .fontSize(5)
        .text("+260 211 123456", { align: "center" });
      yPos += 10;

      // Final separator
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .stroke();
      yPos += 5;

      doc
        .font("Courier")
        .fontSize(5)
        .text("Thank you for choosing Copperstone", { align: "center" });
      yPos += 6;

      doc.font("Courier").fontSize(5).text("=".repeat(35), { align: "center" });

      doc.end();

      stream.on("finish", () => resolve(outPath));
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

// Alternative: Simple text-only thermal receipt (most compatible)
async function generateSimpleThermalReceipt({ payment }) {
  return new Promise(async (resolve, reject) => {
    try {
      const pageWidth = 165; // 58mm
      const margin = 5;

      const doc = new PDFDocument({
        margin: 0,
        size: [pageWidth, 800],
        font: "Courier",
      });

      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const fileName = `Receipt_${payment._id}_${Date.now()}.pdf`;
      const outPath = path.join(tmpDir, fileName);
      const stream = fs.createWriteStream(outPath);
      doc.pipe(stream);

      // Header
      doc.fontSize(8).text("=".repeat(40), { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(9).text("COPPERSTONE UNIVERSITY", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(8).text("OFFICIAL PAYMENT RECEIPT", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(7).text("Finance Department", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(8).text("=".repeat(40), { align: "center" });
      doc.moveDown();

      // Receipt Info
      doc.fontSize(7).text(`Receipt: ${payment._id.toString().slice(-8)}`);
      doc.text(`Date: ${new Date().toLocaleDateString()}`);
      doc.text(
        `Time: ${new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      );
      doc.moveDown();
      doc.fontSize(7).text("-".repeat(40), { align: "center" });
      doc.moveDown();

      // Student
      doc.fontSize(7).text("STUDENT:", { underline: true });
      if (payment.student) {
        doc.text(`${payment.student.firstName} ${payment.student.surname}`);
        doc.text(payment.student.email);
        if (payment.student.studentId) {
          doc.text(`ID: ${payment.student.studentId}`);
        }
      }
      doc.moveDown();

      // Payment
      doc.fontSize(7).text("PAYMENT:", { underline: true });
      doc.text(`Category: ${payment.category}`);
      doc.text(`Desc: ${payment.description}`);
      doc.text(`Method: ${payment.method}`);
      if (payment.semester) doc.text(`Semester: ${payment.semester}`);
      if (payment.academicYear) doc.text(`Year: ${payment.academicYear}`);
      doc.moveDown();

      // Amount
      doc.fontSize(7).text("AMOUNT:", { underline: true });
      const amount = parseFloat(payment.amount);
      const vat = amount * 0.16;
      const subtotal = amount - vat;

      doc.text(`Subtotal: ZMW ${subtotal.toFixed(2)}`);
      doc.text(`VAT 16%: ZMW ${vat.toFixed(2)}`);
      doc.text("-".repeat(40), { align: "center" });
      doc
        .fontSize(9)
        .text(`TOTAL: ZMW ${amount.toFixed(2)}`, { align: "center" });
      doc.text("-".repeat(40), { align: "center" });
      doc.moveDown();

      // Status & Signature
      doc.fontSize(7).text(`Status: ${payment.status}`);
      if (payment.verifiedAt) {
        doc.text(
          `Verified: ${new Date(payment.verifiedAt).toLocaleDateString()}`
        );
      }
      doc.moveDown();
      doc.text("-".repeat(40), { align: "center" });
      doc.moveDown();
      doc.fontSize(8).text("FINANCE DEPARTMENT", { align: "center" });
      doc.fontSize(7).text("Copperstone University", { align: "center" });
      doc.moveDown();

      // Footer
      doc.fontSize(6).text("*** OFFICIAL RECEIPT ***", { align: "center" });
      doc.text("Keep for records", { align: "center" });
      doc.text("Valid for tax purposes", { align: "center" });
      doc.moveDown();
      doc.fontSize(5).text("finance@copperstone.edu.zm", { align: "center" });
      doc.text("+260 211 123456", { align: "center" });
      doc.moveDown();
      doc.fontSize(6).text("Thank you!", { align: "center" });
      doc.text("=".repeat(40), { align: "center" });

      doc.end();
      stream.on("finish", () => resolve(outPath));
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateReceiptPDF, generateSimpleThermalReceipt };
