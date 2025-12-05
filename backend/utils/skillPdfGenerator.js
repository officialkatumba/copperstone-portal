// // utils/skillPdfGenerator.js - SPECIFIC FOR SKILLS
// const PDFDocument = require("pdfkit");
// const fs = require("fs");
// const path = require("path");

// /**
//  * Generate acceptance letter specifically for skill training programs
//  * @param {Object} application - SkillApplication document (populated with applicant)
//  * @param {Object} skill - Skill document
//  * @param {String} startDate - Training start date (optional)
//  * @returns {Promise<String>} - Path to generated PDF file
//  */
// const generateSkillAcceptancePDF = async (
//   application,
//   skill,
//   startDate = null
// ) => {
//   return new Promise((resolve, reject) => {
//     try {
//       // Create output directory if it doesn't exist
//       const outputDir = path.join(__dirname, "../temp_pdfs");
//       if (!fs.existsSync(outputDir)) {
//         fs.mkdirSync(outputDir, { recursive: true });
//       }

//       const outputPath = path.join(
//         outputDir,
//         `Skill_Acceptance_${application._id}_${Date.now()}.pdf`
//       );
//       const doc = new PDFDocument({
//         size: "A4",
//         margins: { top: 50, bottom: 50, left: 60, right: 60 },
//       });

//       const stream = fs.createWriteStream(outputPath);
//       doc.pipe(stream);

//       // ---------------------------
//       // HEADER: University Logo & Info
//       // ---------------------------
//       doc
//         .fillColor("#000080")
//         .fontSize(18)
//         .font("Helvetica-Bold")
//         .text("COPPERSTONE UNIVERSITY", { align: "center" });

//       doc
//         .fillColor("#666666")
//         .fontSize(10)
//         .font("Helvetica")
//         .text("Excellence in Skills Development", { align: "center" })
//         .moveDown(0.5);

//       doc
//         .strokeColor("#000080")
//         .lineWidth(1)
//         .moveTo(60, 90)
//         .lineTo(550, 90)
//         .stroke()
//         .moveDown(2);

//       // ---------------------------
//       // TITLE
//       // ---------------------------
//       doc
//         .fillColor("#000000")
//         .fontSize(14)
//         .font("Helvetica-Bold")
//         .text("SKILL TRAINING ACCEPTANCE LETTER", { align: "center" })
//         .moveDown(1.5);

//       // ---------------------------
//       // REFERENCE & DATE
//       // ---------------------------
//       doc
//         .fillColor("#333333")
//         .fontSize(10)
//         .font("Helvetica")
//         .text(
//           `Ref: CU/SKILL/${skill.code}/${application._id
//             .toString()
//             .slice(-6)
//             .toUpperCase()}`,
//           { align: "right" }
//         );

//       doc
//         .text(
//           `Date: ${new Date().toLocaleDateString("en-GB", {
//             day: "2-digit",
//             month: "long",
//             year: "numeric",
//           })}`,
//           { align: "right" }
//         )
//         .moveDown(2);

//       // ---------------------------
//       // APPLICANT ADDRESS
//       // ---------------------------
//       doc
//         .fontSize(10)
//         .text(
//           `${application.applicant.firstName} ${application.applicant.surname}`
//         )
//         .text(application.applicant.email)
//         .text(`Mobile: ${application.applicant.mobile}`)
//         .moveDown(2);

//       // ---------------------------
//       // SUBJECT
//       // ---------------------------
//       doc
//         .fillColor("#000080")
//         .fontSize(11)
//         .font("Helvetica-Bold")
//         .text(`Subject: Acceptance for ${skill.name} Skill Training`)
//         .moveDown(1.5);

//       // ---------------------------
//       // SALUTATION
//       // ---------------------------
//       doc
//         .fillColor("#000000")
//         .fontSize(10)
//         .font("Helvetica")
//         .text(
//           `Dear ${application.applicant.firstName} ${application.applicant.surname},`
//         )
//         .moveDown(1);

//       // ---------------------------
//       // BODY CONTENT (NO 14-DAY REGISTRATION DEADLINE)
//       // ---------------------------
//       const bodyContent = [
//         `We are pleased to inform you that your application for ${skill.name} (Code: ${skill.code}) skill training has been reviewed and <strong>APPROVED</strong>.`,

//         `You have been admitted to the ${skill.name} program under the Skill Development Department of Copperstone University. This program leads to a ${skill.level} upon successful completion.`,

//         `Program Duration: ${skill.duration}`,

//         startDate
//           ? `Training Start Date: ${new Date(startDate).toLocaleDateString(
//               "en-GB",
//               {
//                 day: "2-digit",
//                 month: "long",
//                 year: "numeric",
//               }
//             )}`
//           : `Training Schedule: To be communicated by the Skill Development Department`,

//         `Program Level: ${skill.level}`,

//         `This acceptance is valid for the ${new Date().getFullYear()} academic year and is contingent upon adherence to Copperstone University's rules and regulations governing skill training programs.`,

//         `Please bring this letter, a copy of your national ID, and passport-sized photographs when reporting for orientation.`,

//         `We look forward to welcoming you to our skill development community and supporting your professional growth.`,
//       ];

//       bodyContent.forEach((paragraph, index) => {
//         if (paragraph.includes("<strong>")) {
//           // Handle bold text
//           const parts = paragraph.split("<strong>");
//           doc.fillColor("#000000").font("Helvetica");
//           doc.text(parts[0]);
//           doc.fillColor("#000000").font("Helvetica-Bold");
//           doc.text(parts[1].replace("</strong>", ""), { continued: true });
//           doc.fillColor("#000000").font("Helvetica");
//           if (parts[2]) doc.text(parts[2], { continued: false });
//         } else {
//           doc.text(paragraph);
//         }
//         doc.moveDown(0.8);
//       });

//       // ---------------------------
//       // CLOSING
//       // ---------------------------
//       doc.moveDown(1.5).text("Yours sincerely,").moveDown(2);

//       // SIGNATURE BLOCK
//       doc
//         .fontSize(11)
//         .font("Helvetica-Bold")
//         .text("___________________________")
//         .fontSize(10)
//         .text("Ms. Tolani Longwe")
//         .text("Registrar ")
//         .text("Copperstone University")
//         .moveDown(1);

//       // ---------------------------
//       // FOOTER
//       // ---------------------------
//       const footerY = doc.page.height - 100;
//       doc
//         .moveTo(60, footerY)
//         .lineTo(550, footerY)
//         .strokeColor("#CCCCCC")
//         .lineWidth(0.5)
//         .stroke()
//         .moveDown(0.5);

//       doc
//         .fillColor("#666666")
//         .fontSize(8)
//         .font("Helvetica")
//         .text("Copperstone University | P.O. Box 12345, Kitwe, Zambia", {
//           align: "center",
//         })
//         .text(
//           "Email: registrar@copperstoneuniversity.ac.zm | Phone: +260 212 123456 | Website: www.copperstone.ac.zm",
//           { align: "center" }
//         );

//       // ---------------------------
//       // FINALIZE
//       // ---------------------------
//       doc.end();

//       stream.on("finish", () => {
//         console.log(`✅ Skill acceptance PDF generated: ${outputPath}`);
//         resolve(outputPath);
//       });

//       stream.on("error", (err) => {
//         console.error("❌ PDF stream error:", err);
//         reject(err);
//       });
//     } catch (error) {
//       console.error("❌ PDF generation error:", error);
//       reject(error);
//     }
//   });
// };

// module.exports = { generateSkillAcceptancePDF };

// utils/skillPdfGenerator.js
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

async function generateSkillAcceptancePDF(application, skill, startDate) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });

      // Ensure tmp exists
      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const fileName = `Skill_Acceptance_${application._id}_${Date.now()}.pdf`;
      const outPath = path.join(tmpDir, fileName);
      const stream = fs.createWriteStream(outPath);
      doc.pipe(stream);

      // Download logo and signature first
      let topLogoBuffer, signatureBuffer;

      try {
        const logoUrl = process.env.LOGO;
        if (logoUrl) {
          topLogoBuffer = await downloadImage(logoUrl);
        }
      } catch (e) {
        console.warn("⚠️ Could not load top logo:", e.message);
      }

      try {
        const signatureUrl = process.env.SIGNATURE;
        if (signatureUrl) {
          signatureBuffer = await downloadImage(signatureUrl);
        }
      } catch (e) {
        console.warn("⚠️ Could not load signature:", e.message);
      }

      // Top Logo
      if (topLogoBuffer) {
        try {
          doc.image(topLogoBuffer, 50, 30, { width: 80, height: 80 });
        } catch (e) {
          console.warn("⚠️ Could not add top logo to PDF:", e.message);
        }
      }

      // University Header with Address
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("#000000") // Black color
        .text("COPPERSTONE UNIVERSITY", { align: "center" })
        .moveDown(0.2);

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#000000") // Black color
        .text("Plot 38002, Baluba Campus, P.O. Box 22041,", { align: "center" })
        .text("Along Ndola – Kitwe Dual carriageway, KITWE, ZAMBIA", {
          align: "center",
        })
        .text("Cell: +260 965571607, +260 0967499292, +260 965 653 101", {
          align: "center",
        })
        .text(
          "www.copperstoneuniversity.edu.zm | email: registrar@copperstoneuniversity.ac.zm", // Updated email
          { align: "center" }
        )
        .moveDown(1.5);

      // Recipient Details Section
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#000000") // Black color
        .text("TO:")
        .moveDown(0.3);

      const fullName = `${
        application.applicant.firstName || application.applicant.fullName || ""
      } ${application.applicant.surname || ""}`.trim();

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#000000") // Black color
        .text(`${fullName}`)
        .text(`${application.applicant.email}`)
        .text(`${application.applicant.mobile}`)
        .moveDown(0.5);

      // Date below recipient info
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#000000") // Black color
        .text(
          `Date: ${new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`,
          { align: "left" }
        )
        .moveDown(1.5);

      // Salutation
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#000000") // Black color
        .text(`Dear ${fullName},`)
        .moveDown(1);

      // RE: OFFICIAL SKILL TRAINING ADMISSION LETTER
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor("#000000") // Black color
        .text("RE: OFFICIAL SKILL TRAINING ADMISSION LETTER")
        .moveDown(1);

      // Main Content
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#000000") // Black color
        .text(
          `We are pleased to inform you that your application has been carefully reviewed and we are delighted to offer you admission to Copperstone University for the following skill training programme:`,
          { align: "left", lineGap: 5 }
        )
        .moveDown(1);

      // Skill Details (without background color)
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(`${skill.name}`)
        .moveDown(0.5);

      doc
        .fontSize(11)
        .font("Helvetica")
        .text(`Skill Code: ${skill.code}`)
        .moveDown(0.3);

      doc.text(`Duration: ${skill.duration}`).moveDown(0.3);

      if (startDate) {
        doc
          .text(
            `Commencement Date: ${new Date(startDate).toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )}`
          )
          .moveDown(0.3);
      }

      doc.text(`Level: ${skill.level || "Certificate"}`).moveDown(2);

      // Next Steps - MODIFIED: Removed "Complete your registration within 14 days"
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Next Steps:", { underline: true })
        .moveDown(0.5);

      doc
        .font("Helvetica")
        .text("1. Attend the skill training orientation programme as scheduled")
        .text("2. Submit all required original documents for verification")
        .text(
          "3. Complete your skill training fee payment as per the fee structure"
        )
        .moveDown(1);

      // Important Notes
      doc
        .font("Helvetica-Bold")
        .text("Important Information:", { underline: true })
        .moveDown(0.5);

      doc
        .font("Helvetica")
        .text(
          "• This skill training offer is valid for the specified intake only"
        )
        .text(
          "• Admission is subject to verification of all submitted documents"
        )
        .text(
          "• For any queries, contact registrar@copperstoneuniversity.ac.zm"
        ) // Updated email
        .moveDown(2);

      if (application.remarks) {
        doc.font("Helvetica-Bold").text("Special Remarks:").moveDown(0.3);

        doc.font("Helvetica").text(application.remarks).moveDown(1);
      }

      // Closing
      doc.font("Helvetica-Bold").text("Yours sincerely,").moveDown(0.8); // Changed from "Warm regards,"

      // Signature Section
      if (signatureBuffer) {
        try {
          doc.image(signatureBuffer, 50, doc.y, { width: 100, height: 50 });
          doc.y += 60;
        } catch (e) {
          console.warn("⚠️ Could not add signature to PDF:", e.message);
          doc.y += 20;
        }
      } else {
        doc.y += 20;
      }

      // SIGNATURE BLOCK - UPDATED with Registrar's name
      doc
        .font("Helvetica-Bold")
        .text("___________________________")
        .fontSize(10)
        .text("Ms. Tolani Longwe")
        .text("Registrar")
        .text("Copperstone University")
        .text("Email: registrar@copperstoneuniversity.ac.zm") // Registrar email
        .text("Phone: +260 211 123 4567")
        .moveDown(2);

      // Footer
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#000000") // Black color
        .text(
          "Copperstone University - Our Vision! Our country! Our World!",
          50,
          780,
          { align: "center", width: 495 }
        );

      doc.end();

      stream.on("finish", () => {
        console.log(`✅ Skill acceptance PDF generated: ${outPath}`);
        resolve(outPath);
      });

      stream.on("error", (err) => reject(err));
    } catch (err) {
      console.error("❌ Skill PDF generation error:", err);
      reject(err);
    }
  });
}

module.exports = { generateSkillAcceptancePDF };
