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

// async function generateReceiptPDF({ payment }) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       // Thermal receipt dimensions
//       const pageWidth = 165; // 58mm width
//       const margin = 8;

//       // Create document with consistent font
//       const doc = new PDFDocument({
//         margin: 0,
//         size: [pageWidth, 600], // Fixed height to prevent overflow
//         autoFirstPage: false,
//         font: "Courier", // Consistent font throughout
//       });

//       const tmpDir = path.join(__dirname, "../../tmp");
//       if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

//       const fileName = `Receipt_${payment._id}_${Date.now()}.pdf`;
//       const outPath = path.join(tmpDir, fileName);
//       const stream = fs.createWriteStream(outPath);
//       doc.pipe(stream);

//       // Download images if available
//       let logoBuffer, signatureBuffer;

//       try {
//         if (process.env.LOGO) {
//           logoBuffer = await downloadImage(process.env.LOGO);
//         }
//       } catch (err) {
//         console.log("Logo not loaded:", err.message);
//       }

//       try {
//         if (process.env.SIGNATURE) {
//           signatureBuffer = await downloadImage(process.env.SIGNATURE);
//         }
//       } catch (err) {
//         console.log("Signature not loaded:", err.message);
//       }

//       // Add page with exact dimensions
//       doc.addPage({ margin: 0, size: [pageWidth, 600] });

//       let yPos = margin;
//       const contentWidth = pageWidth - margin * 2;

//       /* ===== HEADER SECTION ===== */
//       // Top decorative line
//       doc
//         .moveTo(margin + 10, yPos)
//         .lineTo(pageWidth - margin - 10, yPos)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();
//       yPos += 15;

//       // Logo (centered, compact)
//       if (logoBuffer) {
//         const logoSize = 60;
//         const logoX = (pageWidth - logoSize) / 2;
//         doc.image(logoBuffer, logoX, yPos, {
//           width: logoSize,
//           height: logoSize,
//           fit: [logoSize, logoSize],
//         });
//         yPos += logoSize + 10;
//       }

//       // University name (ensured no overflow)
//       doc
//         .fontSize(18)
//         .font("Courier-Bold")
//         .text("COPPERSTONE UNIVERSITY", margin, yPos, {
//           width: contentWidth,
//           align: "center",
//         });
//       yPos += 20;

//       // Receipt title
//       doc
//         .fontSize(10)
//         .font("Courier-Bold")
//         .text("OFFICIAL PAYMENT RECEIPT", margin, yPos, {
//           width: contentWidth,
//           align: "center",
//         });
//       yPos += 16;

//       doc.fontSize(9).font("Courier").text("Finance Department", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 15;

//       /* ===== SEPARATOR LINE ===== */
//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();
//       yPos += 15;

//       /* ===== RECEIPT INFORMATION ===== */
//       doc.font("Courier-Bold").fontSize(9);
//       doc.text("RECEIPT INFORMATION", margin, yPos);
//       yPos += 12;

//       doc.font("Courier").fontSize(8);

//       // Generate receipt ID with overflow protection
//       const receiptId =
//         payment.reference ||
//         payment._id?.toString().slice(-8) ||
//         `RC-${Date.now().toString().slice(-6)}`;

//       doc.text(`Receipt No: ${receiptId}`, margin, yPos);
//       yPos += 10;

//       const now = new Date();
//       doc.text(`Date: ${now.toLocaleDateString()}`, margin, yPos);
//       yPos += 10;

//       doc.text(
//         `Time: ${now.toLocaleTimeString([], {
//           hour: "2-digit",
//           minute: "2-digit",
//         })}`,
//         margin,
//         yPos
//       );
//       yPos += 15;

//       /* ===== DASHED SEPARATOR ===== */
//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .dash(2, { space: 2 })
//         .strokeColor("#888888")
//         .lineWidth(0.3)
//         .stroke();
//       yPos += 12;

//       /* ===== STUDENT INFORMATION ===== */
//       doc.font("Courier-Bold").fontSize(9);
//       doc.text("STUDENT INFORMATION", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 12;

//       doc.font("Courier").fontSize(8);

//       if (payment.student) {
//         // Handle name with overflow protection
//         const fullName = `${payment.student.firstName} ${payment.student.surname}`;
//         doc.text(`Name: ${fullName}`, margin, yPos);
//         yPos += 10;

//         // Handle email with overflow protection
//         const email = payment.student.email || "N/A";
//         doc.text(`Email: ${email}`, margin, yPos);
//         yPos += 10;

//         if (payment.student.studentId) {
//           doc.text(`Student ID: ${payment.student.studentId}`, margin, yPos);
//           yPos += 10;
//         }
//       }
//       yPos += 10;

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

//       doc.font("Courier").fontSize(8);

//       // Payment category with overflow handling
//       doc.text(`Category: ${payment.category || "N/A"}`, margin, yPos);
//       yPos += 10;

//       // Description with word wrap
//       const description = payment.description || "Payment";
//       doc.text(`Description:`, margin, yPos);
//       yPos += 6;
//       doc.text(description, margin + 10, yPos, {
//         width: contentWidth - 10,
//         lineGap: 2,
//       });
//       yPos +=
//         Math.ceil(
//           doc.heightOfString(description, { width: contentWidth - 10 }) / 8
//         ) *
//           8 +
//         4;

//       doc.text(`Method: ${payment.method || "N/A"}`, margin, yPos);
//       yPos += 10;

//       if (payment.semester) {
//         doc.text(`Semester: ${payment.semester}`, margin, yPos);
//         yPos += 10;
//       }

//       if (payment.academicYear) {
//         doc.text(`Academic Year: ${payment.academicYear}`, margin, yPos);
//         yPos += 10;
//       }
//       yPos += 10;

//       /* ===== AMOUNT SECTION ===== */
//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();
//       yPos += 12;

//       doc.font("Courier-Bold").fontSize(9);
//       doc.text("PAYMENT SUMMARY", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 12;

//       const amount = parseFloat(payment.amount) || 0;
//       const vat = amount * 0.16;
//       const subtotal = amount - vat;

//       doc.font("Courier").fontSize(8);

//       // Subtotal with right alignment
//       doc.text("Subtotal:", margin, yPos);
//       doc.text(`ZMW ${subtotal.toFixed(2)}`, pageWidth - margin - 5, yPos, {
//         align: "right",
//         width: 50,
//       });
//       yPos += 10;

//       // VAT with right alignment
//       doc.text("VAT (16%):", margin, yPos);
//       doc.text(`ZMW ${vat.toFixed(2)}`, pageWidth - margin - 5, yPos, {
//         align: "right",
//         width: 50,
//       });
//       yPos += 12;

//       // Total amount line
//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();
//       yPos += 8;

//       doc.font("Courier-Bold").fontSize(10);
//       doc.text("TOTAL:", margin, yPos);
//       doc.text(`ZMW ${amount.toFixed(2)}`, pageWidth - margin - 5, yPos, {
//         align: "right",
//         width: 50,
//       });
//       yPos += 12;

//       doc
//         .moveTo(margin, yPos)
//         .lineTo(pageWidth - margin, yPos)
//         .strokeColor("#000000")
//         .lineWidth(0.5)
//         .stroke();
//       yPos += 15;

//       /* ===== PAYMENT STATUS ===== */
//       const status = payment.status ? payment.status.toUpperCase() : "PENDING";
//       const statusColor = status === "COMPLETED" ? "#008000" : "#FF0000";

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
//           }
//         );
//         yPos += 12;
//       }

//       /* ===== SIGNATURE AREA ===== */
//       yPos += 10;

//       if (signatureBuffer) {
//         const sigWidth = 50;
//         const sigX = (pageWidth - sigWidth) / 2;

//         doc.image(signatureBuffer, sigX, yPos, {
//           width: sigWidth,
//           fit: [sigWidth, 30],
//         });
//         yPos += 40;
//       }

//       doc.font("Courier-Bold").fontSize(9).fillColor("#000000");
//       doc.text("FINANCE DEPARTMENT", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 10;

//       doc.font("Courier").fontSize(8);
//       doc.text("Copperstone University", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 15;

//       /* ===== FOOTER ===== */
//       doc
//         .moveTo(margin + 10, yPos)
//         .lineTo(pageWidth - margin - 10, yPos)
//         .dash(2, { space: 2 })
//         .strokeColor("#000000")
//         .lineWidth(0.3)
//         .stroke();
//       yPos += 12;

//       doc.font("Courier-Bold").fontSize(8);
//       doc.text("*** OFFICIAL RECEIPT ***", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 10;

//       doc.font("Courier").fontSize(7);
//       doc.text("finance@copperstone.edu.zm", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 8;

//       doc.text("+260 211 123456", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 10;

//       doc.font("Courier-Oblique").fontSize(8);
//       doc.text("Thank you for your payment", margin, yPos, {
//         width: contentWidth,
//         align: "center",
//       });
//       yPos += 10;

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
//

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
      // Thermal receipt dimensions
      const pageWidth = 165; // 58mm width
      const margin = 8;

      // Create document with consistent font
      const doc = new PDFDocument({
        margin: 0,
        size: [pageWidth, 600], // Fixed height to prevent overflow
        autoFirstPage: false,
        font: "Courier", // Consistent font throughout
      });

      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const fileName = `Receipt_${payment._id}_${Date.now()}.pdf`;
      const outPath = path.join(tmpDir, fileName);
      const stream = fs.createWriteStream(outPath);
      doc.pipe(stream);

      // Download images if available
      let logoBuffer, signatureBuffer;

      try {
        if (process.env.LOGO) {
          logoBuffer = await downloadImage(process.env.LOGO);
        }
      } catch (err) {
        console.log("Logo not loaded:", err.message);
      }

      try {
        if (process.env.SIGNATURE) {
          signatureBuffer = await downloadImage(process.env.SIGNATURE);
        }
      } catch (err) {
        console.log("Signature not loaded:", err.message);
      }

      // Add page with exact dimensions
      doc.addPage({ margin: 0, size: [pageWidth, 600] });

      let yPos = margin;
      const contentWidth = pageWidth - margin * 2;

      /* ===== HEADER SECTION ===== */
      // Logo at the very top (removed top decorative line)
      if (logoBuffer) {
        const logoSize = 60;
        const logoX = (pageWidth - logoSize) / 2;
        doc.image(logoBuffer, logoX, yPos, {
          width: logoSize,
          height: logoSize,
          fit: [logoSize, logoSize],
        });
        yPos += logoSize + 12; // Reduced spacing
      }

      // University name with proper spacing
      doc
        .fontSize(14)
        .font("Courier-Bold")
        .text("COPPERSTONE UNIVERSITY", margin, yPos, {
          width: contentWidth,
          align: "center",
        });
      yPos += 16; // Reduced spacing

      // Add vertical space as requested
      yPos += 8; // Extra space between university and receipt title

      // Receipt title
      doc
        .fontSize(10)
        .font("Courier-Bold")
        .text("OFFICIAL PAYMENT RECEIPT", margin, yPos, {
          width: contentWidth,
          align: "center",
        });
      yPos += 14;

      doc.fontSize(9).font("Courier").text("Finance Department", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 15;

      /* ===== SEPARATOR LINE ===== */
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();
      yPos += 15;

      /* ===== RECEIPT INFORMATION ===== */
      doc.font("Courier-Bold").fontSize(9);
      doc.text("RECEIPT INFORMATION", margin, yPos);
      yPos += 12;

      doc.font("Courier").fontSize(8);

      // Generate receipt ID with overflow protection
      const receiptId =
        payment.reference ||
        payment._id?.toString().slice(-8) ||
        `RC-${Date.now().toString().slice(-6)}`;

      // Make all description labels bold
      doc.font("Courier-Bold").text("Receipt No:", margin, yPos);
      doc.font("Courier").text(` ${receiptId}`, margin + 45, yPos);
      yPos += 10;

      const now = new Date();
      doc.font("Courier-Bold").text("Date:", margin, yPos);
      doc
        .font("Courier")
        .text(` ${now.toLocaleDateString()}`, margin + 25, yPos);
      yPos += 10;

      doc.font("Courier-Bold").text("Time:", margin, yPos);
      doc.font("Courier").text(
        ` ${now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        margin + 25,
        yPos
      );
      yPos += 15;

      /* ===== DASHED SEPARATOR ===== */
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .dash(2, { space: 2 })
        .strokeColor("#888888")
        .lineWidth(0.3)
        .stroke();
      yPos += 12;

      /* ===== STUDENT INFORMATION ===== */
      doc.font("Courier-Bold").fontSize(9);
      doc.text("STUDENT INFORMATION", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 12;

      doc.fontSize(8);

      if (payment.student) {
        // Handle name with overflow protection - make label bold
        const fullName = `${payment.student.firstName} ${payment.student.surname}`;
        doc.font("Courier-Bold").text("Name:", margin, yPos);
        doc.font("Courier").text(` ${fullName}`, margin + 30, yPos);
        yPos += 10;

        // Handle email with overflow protection - make label bold
        const email = payment.student.email || "N/A";
        doc.font("Courier-Bold").text("Email:", margin, yPos);
        doc.font("Courier").text(` ${email}`, margin + 30, yPos);
        yPos += 10;

        if (payment.student.studentId) {
          doc.font("Courier-Bold").text("Student ID:", margin, yPos);
          doc
            .font("Courier")
            .text(` ${payment.student.studentId}`, margin + 50, yPos);
          yPos += 10;
        }
      }
      yPos += 10;

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

      // Payment category with overflow handling - make label bold
      doc.font("Courier-Bold").text("Category:", margin, yPos);
      doc
        .font("Courier")
        .text(` ${payment.category || "N/A"}`, margin + 45, yPos);
      yPos += 10;

      // Description with proper word wrap and spacing - make label bold
      const description = payment.description || "Payment";
      doc.font("Courier-Bold").text("Description:", margin, yPos);
      yPos += 6;

      // Calculate description height
      const descriptionHeight = doc.heightOfString(description, {
        width: contentWidth - 15,
        lineGap: 3,
      });

      doc.font("Courier").text(description, margin + 12, yPos, {
        width: contentWidth - 15,
        lineGap: 3,
      });
      yPos += descriptionHeight + 8;

      // Payment method - make label bold
      doc.font("Courier-Bold").text("Method:", margin, yPos);
      doc
        .font("Courier")
        .text(` ${payment.method || "N/A"}`, margin + 40, yPos);
      yPos += 10;

      if (payment.semester) {
        // Semester - make label bold
        doc.font("Courier-Bold").text("Semester:", margin, yPos);
        doc.font("Courier").text(` ${payment.semester}`, margin + 45, yPos);
        yPos += 10;
      }

      if (payment.academicYear) {
        // Academic Year - make label bold
        doc.font("Courier-Bold").text("Academic Year:", margin, yPos);
        doc.font("Courier").text(` ${payment.academicYear}`, margin + 65, yPos);
        yPos += 10;
      }
      yPos += 10;

      /* ===== AMOUNT SECTION ===== */
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();
      yPos += 12;

      doc.font("Courier-Bold").fontSize(9);
      doc.text("PAYMENT SUMMARY", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 12;

      const amount = parseFloat(payment.amount) || 0;
      const vat = amount * 0.16;
      const subtotal = amount - vat;

      doc.fontSize(8);

      // Amounts aligned to middle of page (not too far right)
      const amountStartX = pageWidth / 2; // Start amounts from middle

      // Subtotal - make label bold
      doc.font("Courier-Bold").text("Subtotal:", margin, yPos);
      doc
        .font("Courier")
        .text(`ZMW ${subtotal.toFixed(2)}`, amountStartX, yPos, {
          width: contentWidth / 2,
          align: "right",
        });
      yPos += 10;

      // VAT - make label bold
      doc.font("Courier-Bold").text("VAT (16%):", margin, yPos);
      doc.font("Courier").text(`ZMW ${vat.toFixed(2)}`, amountStartX, yPos, {
        width: contentWidth / 2,
        align: "right",
      });
      yPos += 12;

      // Total amount line
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();
      yPos += 8;

      // TOTAL - make label bold
      doc.font("Courier-Bold").fontSize(10);
      doc.text("TOTAL:", margin, yPos);
      doc.font("Courier").text(`ZMW ${amount.toFixed(2)}`, amountStartX, yPos, {
        width: contentWidth / 2,
        align: "right",
      });
      yPos += 12;

      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .strokeColor("#000000")
        .lineWidth(0.5)
        .stroke();
      yPos += 15;

      /* ===== PAYMENT STATUS ===== */
      const status = payment.status ? payment.status.toUpperCase() : "PENDING";
      const statusColor = status === "COMPLETED" ? "#008000" : "#FF0000";

      doc.font("Courier-Bold").fontSize(9).fillColor(statusColor);
      doc.text(`STATUS: ${status}`, margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 12;

      if (payment.verifiedAt) {
        doc.font("Courier").fontSize(8).fillColor("#000000");
        doc.text(
          `Verified: ${new Date(payment.verifiedAt).toLocaleDateString()}`,
          margin,
          yPos,
          {
            width: contentWidth,
            align: "center",
          }
        );
        yPos += 12;
      }

      /* ===== SIGNATURE AREA ===== */
      yPos += 10;

      if (signatureBuffer) {
        const sigWidth = 50;
        const sigX = (pageWidth - sigWidth) / 2;

        doc.image(signatureBuffer, sigX, yPos, {
          width: sigWidth,
          fit: [sigWidth, 30],
        });
        yPos += 40;
      }

      doc.font("Courier-Bold").fontSize(9).fillColor("#000000");
      doc.text("FINANCE DEPARTMENT", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 10;

      doc.font("Courier").fontSize(8);
      doc.text("Copperstone University", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 15;

      /* ===== FOOTER ===== */
      doc
        .moveTo(margin + 10, yPos)
        .lineTo(pageWidth - margin - 10, yPos)
        .dash(2, { space: 2 })
        .strokeColor("#000000")
        .lineWidth(0.3)
        .stroke();
      yPos += 12;

      doc.font("Courier-Bold").fontSize(8);
      doc.text("*** OFFICIAL RECEIPT ***", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 10;

      doc.font("Courier").fontSize(7);
      doc.text("finance@copperstone.edu.zm", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 8;

      doc.text("+260 211 123456", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 10;

      doc.font("Courier-Oblique").fontSize(8);
      doc.text("Thank you for your payment", margin, yPos, {
        width: contentWidth,
        align: "center",
      });
      yPos += 10;

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
