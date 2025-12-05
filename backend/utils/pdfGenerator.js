// // backend/utils/pdfGenerator.js
// const PDFDocument = require("pdfkit");
// const fs = require("fs");
// const path = require("path");

// async function generateAcceptancePDF(application, chosenProgramme, startDate) {
//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ margin: 50, size: "A4" });

//       // Ensure tmp exists (caller should create once), but guard here:
//       const tmpDir = path.join(__dirname, "../../tmp");
//       if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

//       const fileName = `Acceptance_${application._id}_${Date.now()}.pdf`;
//       const outPath = path.join(tmpDir, fileName);
//       const stream = fs.createWriteStream(outPath);
//       doc.pipe(stream);

//       // Add logo (if path exists in env)
//       try {
//         const logoPath = process.env.UNI_LOGO_PATH;
//         if (logoPath && fs.existsSync(logoPath)) {
//           doc.image(logoPath, 50, 30, { width: 100 });
//         }
//       } catch (e) {
//         // ignore logo errors
//       }

//       // Header
//       doc
//         .fontSize(16)
//         .text("COPPERSTONE UNIVERSITY", { align: "center", continued: false })
//         .moveDown(0.2);

//       doc
//         .fontSize(12)
//         .text("OFFICIAL ADMISSION LETTER", { align: "center" })
//         .moveDown(1);

//       // Date
//       doc
//         .fontSize(10)
//         .text(`Date: ${new Date().toLocaleDateString()}`, { align: "right" })
//         .moveDown(1);

//       // Recipient
//       const fullName = `${
//         application.applicant.firstName || application.applicant.fullName || ""
//       } ${application.applicant.surname || ""}`.trim();
//       doc.fontSize(11).text(`Dear ${fullName},`).moveDown(0.8);

//       doc
//         .fontSize(11)
//         .text(
//           `Congratulations! We are pleased to inform you that your application has been approved for admission to the following programme:`,
//           { align: "left" }
//         );

//       doc.moveDown(0.6);
//       doc
//         .font("Helvetica-Bold")
//         .text(`${chosenProgramme.name}`, { continued: false })
//         .font("Helvetica")
//         .moveDown(0.6);

//       if (startDate) {
//         doc
//           .text(
//             `Programme start date: ${new Date(startDate).toLocaleDateString()}`
//           )
//           .moveDown(0.6);
//       }

//       doc.text(
//         "Please await further instructions from the Admissions Office regarding registration, orientation and payment details.",
//         { align: "left" }
//       );

//       if (application.remarks) {
//         doc.moveDown(1);
//         doc.font("Helvetica-Bold").text("Remarks:");
//         doc.font("Helvetica").text(application.remarks);
//       }

//       doc.moveDown(2);
//       doc.text("Warm regards,", { align: "left" });
//       doc.text("Admissions Office", { align: "left" });
//       doc.text("Copperstone University", { align: "left" });

//       // Optional signature image
//       try {
//         const sigPath = process.env.SIGNATURE_IMAGE_PATH;
//         if (sigPath && fs.existsSync(sigPath)) {
//           doc.image(sigPath, { width: 120, align: "left" });
//         }
//       } catch (e) {
//         // ignore
//       }

//       doc.end();

//       stream.on("finish", () => resolve(outPath));
//       stream.on("error", (err) => reject(err));
//     } catch (err) {
//       reject(err);
//     }
//   });
// }

// module.exports = { generateAcceptancePDF };

// backend/utils/pdfGenerator.js
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

// async function generateAcceptancePDF(application, chosenProgramme, startDate) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ margin: 50, size: "A4" });

//       // Ensure tmp exists
//       const tmpDir = path.join(__dirname, "../../tmp");
//       if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

//       const fileName = `Acceptance_${application._id}_${Date.now()}.pdf`;
//       const outPath = path.join(tmpDir, fileName);
//       const stream = fs.createWriteStream(outPath);
//       doc.pipe(stream);

//       // Download logos and signature first
//       let topLogoBuffer, signatureBuffer, bottomLogoBuffer;

//       try {
//         const logoUrl = process.env.LOGO;
//         if (logoUrl) {
//           topLogoBuffer = await downloadImage(logoUrl);
//         }
//       } catch (e) {
//         console.warn("⚠️ Could not load top logo:", e.message);
//       }

//       try {
//         const signatureUrl = process.env.SIGNATURE;
//         if (signatureUrl) {
//           signatureBuffer = await downloadImage(signatureUrl);
//         }
//       } catch (e) {
//         console.warn("⚠️ Could not load signature:", e.message);
//       }

//       try {
//         const bottomLogoUrl = process.env.LOGO; // Same logo for bottom
//         if (bottomLogoUrl) {
//           bottomLogoBuffer = await downloadImage(bottomLogoUrl);
//         }
//       } catch (e) {
//         console.warn("⚠️ Could not load bottom logo:", e.message);
//       }

//       // Top Logo
//       if (topLogoBuffer) {
//         try {
//           doc.image(topLogoBuffer, 50, 30, { width: 80, height: 80 });
//         } catch (e) {
//           console.warn("⚠️ Could not add top logo to PDF:", e.message);
//         }
//       }

//       // Header
//       doc
//         .fontSize(20)
//         .font("Helvetica-Bold")
//         .fillColor("#2c3e50")
//         .text("COPPERSTONE UNIVERSITY", { align: "center" })
//         .moveDown(0.3);

//       doc
//         .fontSize(14)
//         .font("Helvetica-Bold")
//         .fillColor("#e74c3c")
//         .text("OFFICIAL ADMISSION LETTER", { align: "center" })
//         .moveDown(1.5);

//       // Date
//       doc
//         .fontSize(10)
//         .font("Helvetica")
//         .fillColor("#7f8c8d")
//         .text(
//           `Date: ${new Date().toLocaleDateString("en-US", {
//             year: "numeric",
//             month: "long",
//             day: "numeric",
//           })}`,
//           { align: "right" }
//         )
//         .moveDown(2);

//       // Recipient
//       const fullName = `${
//         application.applicant.firstName || application.applicant.fullName || ""
//       } ${application.applicant.surname || ""}`.trim();

//       doc
//         .fontSize(12)
//         .font("Helvetica-Bold")
//         .fillColor("#2c3e50")
//         .text(`Dear ${fullName},`)
//         .moveDown(1);

//       // Main Content
//       doc
//         .fontSize(11)
//         .font("Helvetica")
//         .fillColor("#2c3e50")
//         .text(
//           `We are pleased to inform you that your application has been carefully reviewed and we are delighted to offer you admission to Copperstone University for the following programme:`,
//           { align: "left", lineGap: 5 }
//         )
//         .moveDown(1);

//       // Programme Details Box
//       doc.rect(50, doc.y, 495, 80).fill("#f8f9fa").fillColor("#2c3e50");

//       doc
//         .fontSize(13)
//         .font("Helvetica-Bold")
//         .text(`${chosenProgramme.name}`, 60, doc.y + 15)
//         .moveDown(0.5);

//       doc
//         .fontSize(11)
//         .font("Helvetica")
//         .text(`Programme Code: ${chosenProgramme.code}`, 60, doc.y)
//         .moveDown(0.3);

//       // Use durationYears from programme object
//       const duration = chosenProgramme.durationYears
//         ? `${chosenProgramme.durationYears} year${
//             chosenProgramme.durationYears > 1 ? "s" : ""
//           }`
//         : "Duration not specified";

//       doc.text(`Duration: ${duration}`, 60, doc.y).moveDown(0.3);

//       if (startDate) {
//         doc
//           .text(
//             `Commencement Date: ${new Date(startDate).toLocaleDateString(
//               "en-US",
//               {
//                 year: "numeric",
//                 month: "long",
//                 day: "numeric",
//               }
//             )}`,
//             60,
//             doc.y
//           )
//           .moveDown(0.3);
//       }

//       doc.text(`Level: ${chosenProgramme.level}`, 60, doc.y).moveDown(2);

//       // Next Steps
//       doc
//         .fontSize(11)
//         .font("Helvetica-Bold")
//         .text("Next Steps:", { underline: true })
//         .moveDown(0.5);

//       doc
//         .font("Helvetica")
//         .text(
//           "1. Complete your registration within 14 days of receiving this letter"
//         )
//         .text("2. Attend the orientation programme as scheduled")
//         .text("3. Submit all required original documents for verification")
//         .text("4. Complete your tuition fee payment as per the fee structure")
//         .moveDown(1);

//       // Important Notes
//       doc
//         .font("Helvetica-Bold")
//         .text("Important Information:", { underline: true })
//         .moveDown(0.5);

//       doc
//         .font("Helvetica")
//         .text("• This offer is valid for the specified intake only")
//         .text(
//           "• Admission is subject to verification of all submitted documents"
//         )
//         .text(
//           "• Failure to register by the deadline may result in cancellation"
//         )
//         .text("• For any queries, contact admissions@copperstone.edu.zm")
//         .moveDown(2);

//       if (application.remarks) {
//         doc.font("Helvetica-Bold").text("Special Remarks:").moveDown(0.3);

//         doc.font("Helvetica").text(application.remarks).moveDown(1);
//       }

//       // Closing
//       doc.font("Helvetica-Bold").text("Warm regards,").moveDown(0.8);

//       // Signature Section
//       if (signatureBuffer) {
//         try {
//           doc.image(signatureBuffer, 50, doc.y, { width: 100, height: 50 });
//           doc.y += 60;
//         } catch (e) {
//           console.warn("⚠️ Could not add signature to PDF:", e.message);
//           doc.y += 20;
//         }
//       } else {
//         doc.y += 20;
//       }

//       doc
//         .font("Helvetica-Bold")
//         .text("Admissions Office")
//         .text("Copperstone University")
//         .text("Email: admissions@copperstone.edu.zm")
//         .text("Phone: +260 211 123 4567")
//         .moveDown(2);

//       // Bottom Logo
//       if (bottomLogoBuffer) {
//         try {
//           doc.image(bottomLogoBuffer, 250, doc.y, { width: 60, height: 60 });
//         } catch (e) {
//           console.warn("⚠️ Could not add bottom logo to PDF:", e.message);
//         }
//       }

//       // Footer
//       doc
//         .fontSize(8)
//         .font("Helvetica")
//         .fillColor("#7f8c8d")
//         .text(
//           "Copperstone University - Transforming Lives Through Quality Education",
//           50,
//           780,
//           { align: "center", width: 495 }
//         );

//       doc.end();

//       stream.on("finish", () => resolve(outPath));
//       stream.on("error", (err) => reject(err));
//     } catch (err) {
//       reject(err);
//     }
//   });
// }

// module.exports = { generateAcceptancePDF };

// backend/utils/pdfGenerator.js
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

// async function generateAcceptancePDF(application, chosenProgramme, startDate) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ margin: 50, size: "A4" });

//       // Ensure tmp exists
//       const tmpDir = path.join(__dirname, "../../tmp");
//       if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

//       const fileName = `Acceptance_${application._id}_${Date.now()}.pdf`;
//       const outPath = path.join(tmpDir, fileName);
//       const stream = fs.createWriteStream(outPath);
//       doc.pipe(stream);

//       // Download logo and signature first
//       let topLogoBuffer, signatureBuffer;

//       try {
//         const logoUrl = process.env.LOGO;
//         if (logoUrl) {
//           topLogoBuffer = await downloadImage(logoUrl);
//         }
//       } catch (e) {
//         console.warn("⚠️ Could not load top logo:", e.message);
//       }

//       try {
//         const signatureUrl = process.env.SIGNATURE;
//         if (signatureUrl) {
//           signatureBuffer = await downloadImage(signatureUrl);
//         }
//       } catch (e) {
//         console.warn("⚠️ Could not load signature:", e.message);
//       }

//       // Top Logo
//       if (topLogoBuffer) {
//         try {
//           doc.image(topLogoBuffer, 50, 30, { width: 80, height: 80 });
//         } catch (e) {
//           console.warn("⚠️ Could not add top logo to PDF:", e.message);
//         }
//       }

//       // University Header with Address
//       doc
//         .fontSize(20)
//         .font("Helvetica-Bold")
//         .fillColor("#2c3e50")
//         .text("COPPERSTONE UNIVERSITY", { align: "center" })
//         .moveDown(0.2);

//       doc
//         .fontSize(9)
//         .font("Helvetica")
//         .fillColor("#7f8c8d")
//         .text("Plot 38002, Baluba Campus, P.O. Box 22041,", { align: "center" })
//         .text("Along Ndola – Kitwe Dual carriageway, KITWE, ZAMBIA", {
//           align: "center",
//         })
//         .text("Cell: +260 965571607, +260 0967499292, +260 965 653 101", {
//           align: "center",
//         })
//         .text(
//           "www.copperstoneuniversity.edu.zm | email: customercareucopperstone@gmail.com",
//           { align: "center" }
//         )
//         .moveDown(0.5);

//       // Letter Subject
//       doc
//         .fontSize(14)
//         .font("Helvetica-Bold")
//         .fillColor("#e74c3c")
//         .text("OFFICIAL ADMISSION LETTER", { align: "center" })
//         .moveDown(1.5);

//       // Date
//       doc
//         .fontSize(10)
//         .font("Helvetica")
//         .fillColor("#7f8c8d")
//         .text(
//           `Date: ${new Date().toLocaleDateString("en-US", {
//             year: "numeric",
//             month: "long",
//             day: "numeric",
//           })}`,
//           { align: "right" }
//         )
//         .moveDown(1.5);

//       // Recipient Details Section
//       doc
//         .fontSize(10)
//         .font("Helvetica-Bold")
//         .fillColor("#2c3e50")
//         .text("TO:")
//         .moveDown(0.3);

//       const fullName = `${
//         application.applicant.firstName || application.applicant.fullName || ""
//       } ${application.applicant.surname || ""}`.trim();

//       doc
//         .fontSize(10)
//         .font("Helvetica")
//         .text(`${fullName}`)
//         .text(`${application.applicant.email}`)
//         .text(`${application.applicant.mobile}`)
//         .moveDown(1.5);

//       // Salutation
//       doc
//         .fontSize(12)
//         .font("Helvetica-Bold")
//         .fillColor("#2c3e50")
//         .text(`Dear ${fullName},`)
//         .moveDown(1);

//       // Main Content
//       doc
//         .fontSize(11)
//         .font("Helvetica")
//         .fillColor("#2c3e50")
//         .text(
//           `We are pleased to inform you that your application has been carefully reviewed and we are delighted to offer you admission to Copperstone University for the following programme:`,
//           { align: "left", lineGap: 5 }
//         )
//         .moveDown(1);

//       // Programme Details Box
//       doc.rect(50, doc.y, 495, 80).fill("#f8f9fa").fillColor("#2c3e50");

//       doc
//         .fontSize(13)
//         .font("Helvetica-Bold")
//         .text(`${chosenProgramme.name}`, 60, doc.y + 15)
//         .moveDown(0.5);

//       doc
//         .fontSize(11)
//         .font("Helvetica")
//         .text(`Programme Code: ${chosenProgramme.code}`, 60, doc.y)
//         .moveDown(0.3);

//       // Use durationYears from programme object
//       const duration = chosenProgramme.durationYears
//         ? `${chosenProgramme.durationYears} year${
//             chosenProgramme.durationYears > 1 ? "s" : ""
//           }`
//         : "Duration not specified";

//       doc.text(`Duration: ${duration}`, 60, doc.y).moveDown(0.3);

//       if (startDate) {
//         doc
//           .text(
//             `Commencement Date: ${new Date(startDate).toLocaleDateString(
//               "en-US",
//               {
//                 year: "numeric",
//                 month: "long",
//                 day: "numeric",
//               }
//             )}`,
//             60,
//             doc.y
//           )
//           .moveDown(0.3);
//       }

//       doc.text(`Level: ${chosenProgramme.level}`, 60, doc.y).moveDown(2);

//       // Next Steps
//       doc
//         .fontSize(11)
//         .font("Helvetica-Bold")
//         .text("Next Steps:", { underline: true })
//         .moveDown(0.5);

//       doc
//         .font("Helvetica")
//         .text(
//           "1. Complete your registration within 14 days of receiving this letter"
//         )
//         .text("2. Attend the orientation programme as scheduled")
//         .text("3. Submit all required original documents for verification")
//         .text("4. Complete your tuition fee payment as per the fee structure")
//         .moveDown(1);

//       // Important Notes
//       doc
//         .font("Helvetica-Bold")
//         .text("Important Information:", { underline: true })
//         .moveDown(0.5);

//       doc
//         .font("Helvetica")
//         .text("• This offer is valid for the specified intake only")
//         .text(
//           "• Admission is subject to verification of all submitted documents"
//         )
//         .text(
//           "• Failure to register by the deadline may result in cancellation"
//         )
//         .text("• For any queries, contact admissions@copperstone.edu.zm")
//         .moveDown(2);

//       if (application.remarks) {
//         doc.font("Helvetica-Bold").text("Special Remarks:").moveDown(0.3);

//         doc.font("Helvetica").text(application.remarks).moveDown(1);
//       }

//       // Closing
//       doc.font("Helvetica-Bold").text("Warm regards,").moveDown(0.8);

//       // Signature Section
//       if (signatureBuffer) {
//         try {
//           doc.image(signatureBuffer, 50, doc.y, { width: 100, height: 50 });
//           doc.y += 60;
//         } catch (e) {
//           console.warn("⚠️ Could not add signature to PDF:", e.message);
//           doc.y += 20;
//         }
//       } else {
//         doc.y += 20;
//       }

//       doc
//         .font("Helvetica-Bold")
//         .text("Admissions Office")
//         .text("Copperstone University")
//         .text("Email: admissions@copperstone.edu.zm")
//         .text("Phone: +260 211 123 4567")
//         .moveDown(2);

//       // Footer (removed bottom logo)
//       doc
//         .fontSize(8)
//         .font("Helvetica")
//         .fillColor("#7f8c8d")
//         .text(
//           "Copperstone University - Transforming Lives Through Quality Education",
//           50,
//           780,
//           { align: "center", width: 495 }
//         );

//       doc.end();

//       stream.on("finish", () => resolve(outPath));
//       stream.on("error", (err) => reject(err));
//     } catch (err) {
//       reject(err);
//     }
//   });
// }

// module.exports = { generateAcceptancePDF };

// backend/utils/pdfGenerator.js
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

async function generateAcceptancePDF(application, chosenProgramme, startDate) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });

      // Ensure tmp exists
      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      const fileName = `Acceptance_${application._id}_${Date.now()}.pdf`;
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
          "www.copperstoneuniversity.edu.zm | email: customercareucopperstone@gmail.com",
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

      // RE: OFFICIAL ADMISSION LETTER (below programme details)
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor("#000000") // Black color
        .text("RE: OFFICIAL ADMISSION LETTER")
        .moveDown(1);

      // Main Content
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#000000") // Black color
        .text(
          `We are pleased to inform you that your application has been carefully reviewed and we are delighted to offer you admission to Copperstone University for the following programme:`,
          { align: "left", lineGap: 5 }
        )
        .moveDown(1);

      // Programme Details (without background color)
      const programmeDetailsY = doc.y;

      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(`${chosenProgramme.name}`)
        .moveDown(0.5);

      doc
        .fontSize(11)
        .font("Helvetica")
        .text(`Programme Code: ${chosenProgramme.code}`)
        .moveDown(0.3);

      // Use durationYears from programme object
      const duration = chosenProgramme.durationYears
        ? `${chosenProgramme.durationYears} year${
            chosenProgramme.durationYears > 1 ? "s" : ""
          }`
        : "Duration not specified";

      doc.text(`Duration: ${duration}`).moveDown(0.3);

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

      doc.text(`Level: ${chosenProgramme.level}`).moveDown(2);

      // Next Steps
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Next Steps:", { underline: true })
        .moveDown(0.5);

      doc
        .font("Helvetica")
        .text(
          "1. Complete your registration within 14 days of receiving this letter"
        )
        .text("2. Attend the orientation programme as scheduled")
        .text("3. Submit all required original documents for verification")
        .text("4. Complete your tuition fee payment as per the fee structure")
        .moveDown(1);

      // Important Notes
      doc
        .font("Helvetica-Bold")
        .text("Important Information:", { underline: true })
        .moveDown(0.5);

      doc
        .font("Helvetica")
        .text("• This offer is valid for the specified intake only")
        .text(
          "• Admission is subject to verification of all submitted documents"
        )
        .text(
          "• Failure to register by the deadline may result in cancellation"
        )
        .text(
          "• For any queries, contact registrar@copperstoneuniversity.ac.zm"
        )
        .moveDown(2);

      if (application.remarks) {
        doc.font("Helvetica-Bold").text("Special Remarks:").moveDown(0.3);

        doc.font("Helvetica").text(application.remarks).moveDown(1);
      }

      // Closing
      doc.font("Helvetica-Bold").text("Warm regards,").moveDown(0.8);

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

      doc
        .font("Helvetica-Bold")
        .text("Admissions Office")
        .text("Copperstone University")
        .text("Email: registrar@copperstoneuniversity.ac.zm")
        .text("Phone: +260 211 123 4567")
        .moveDown(2);

      // Footer
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#000000") // Black color
        .text(
          "Copperstone University - Our Vision! Our country! Our World",
          50,
          780,
          { align: "center", width: 495 }
        );

      doc.end();

      stream.on("finish", () => resolve(outPath));
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateAcceptancePDF };
