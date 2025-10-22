// backend/utils/pdfGenerator.js
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function generateAcceptancePDF(application, chosenProgramme, startDate) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });

      // Ensure tmp exists (caller should create once), but guard here:
      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const fileName = `Acceptance_${application._id}_${Date.now()}.pdf`;
      const outPath = path.join(tmpDir, fileName);
      const stream = fs.createWriteStream(outPath);
      doc.pipe(stream);

      // Add logo (if path exists in env)
      try {
        const logoPath = process.env.UNI_LOGO_PATH;
        if (logoPath && fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 30, { width: 100 });
        }
      } catch (e) {
        // ignore logo errors
      }

      // Header
      doc
        .fontSize(16)
        .text("COPPERSTONE UNIVERSITY", { align: "center", continued: false })
        .moveDown(0.2);

      doc
        .fontSize(12)
        .text("OFFICIAL ADMISSION LETTER", { align: "center" })
        .moveDown(1);

      // Date
      doc
        .fontSize(10)
        .text(`Date: ${new Date().toLocaleDateString()}`, { align: "right" })
        .moveDown(1);

      // Recipient
      const fullName = `${
        application.applicant.firstName || application.applicant.fullName || ""
      } ${application.applicant.surname || ""}`.trim();
      doc.fontSize(11).text(`Dear ${fullName},`).moveDown(0.8);

      doc
        .fontSize(11)
        .text(
          `Congratulations! We are pleased to inform you that your application has been approved for admission to the following programme:`,
          { align: "left" }
        );

      doc.moveDown(0.6);
      doc
        .font("Helvetica-Bold")
        .text(`${chosenProgramme.name}`, { continued: false })
        .font("Helvetica")
        .moveDown(0.6);

      if (startDate) {
        doc
          .text(
            `Programme start date: ${new Date(startDate).toLocaleDateString()}`
          )
          .moveDown(0.6);
      }

      doc.text(
        "Please await further instructions from the Admissions Office regarding registration, orientation and payment details.",
        { align: "left" }
      );

      if (application.remarks) {
        doc.moveDown(1);
        doc.font("Helvetica-Bold").text("Remarks:");
        doc.font("Helvetica").text(application.remarks);
      }

      doc.moveDown(2);
      doc.text("Warm regards,", { align: "left" });
      doc.text("Admissions Office", { align: "left" });
      doc.text("Copperstone University", { align: "left" });

      // Optional signature image
      try {
        const sigPath = process.env.SIGNATURE_IMAGE_PATH;
        if (sigPath && fs.existsSync(sigPath)) {
          doc.image(sigPath, { width: 120, align: "left" });
        }
      } catch (e) {
        // ignore
      }

      doc.end();

      stream.on("finish", () => resolve(outPath));
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateAcceptancePDF };
