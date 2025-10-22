// backend/utils/mailer.js
// require("dotenv").config();
// const nodemailer = require("nodemailer");
// const { google } = require("googleapis");

// const oAuth2Client = new google.auth.OAuth2(
//   process.env.EMAIL_CLIENT_ID,
//   process.env.EMAIL_CLIENT_SECRET,
//   process.env.EMAIL_REDIRECT_URI
// );

// oAuth2Client.setCredentials({ refresh_token: process.env.EMAIL_REFRESH_TOKEN });

// async function createTransporter() {
//   const { token } = await oAuth2Client.getAccessToken(); // returns token-like object in some versions
//   const accessToken = token || (await oAuth2Client.getAccessToken());

//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       type: "OAuth2",
//       user: process.env.EMAIL_USER,
//       clientId: process.env.EMAIL_CLIENT_ID,
//       clientSecret: process.env.EMAIL_CLIENT_SECRET,
//       refreshToken: process.env.EMAIL_REFRESH_TOKEN,
//       accessToken: accessToken.token || accessToken,
//     },
//   });

//   return transporter;
// }

// /**
//  * sendEmail(to, subject, html, attachments)
//  * attachments: array of nodemailer attachment objects, e.g. [{ filename, path }]
//  */
// async function sendEmail(to, subject, html, attachments = []) {
//   const transporter = await createTransporter();

//   const mailOptions = {
//     from: `"Copperstone University Admissions" <${process.env.EMAIL_USER}>`,
//     to,
//     subject,
//     html,
//     attachments,
//   };

//   const info = await transporter.sendMail(mailOptions);
//   return info;
// }

// module.exports = { sendEmail };

// require("dotenv").config();
// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   secure: false, // true for port 465, false for port 587
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// async function sendEmail({ to, subject, text, html, attachments }) {
//   try {
//     const mailOptions = {
//       from: `"Copperstone University Admissions" <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       text,
//       html,
//       attachments, // optional array of file attachments
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log("✅ Email sent:", info.response);
//     return true;
//   } catch (error) {
//     console.error("❌ Email send failed:", error);
//     return false;
//   }
// }

// // module.exports = sendEmail;
// module.exports = { sendEmail };

require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for port 465, false for port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // ← your app password (e.g., ybvy hdhg pjnn ehqv)
  },
});

async function sendEmail({ to, subject, text, html, attachments }) {
  try {
    const mailOptions = {
      from: `"Copperstone University Admissions" <${process.env.EMAIL_USER}>`,
      to, // ✅ required
      subject,
      text: text || "",
      html: html || "",
      attachments: attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
    return true;
  } catch (error) {
    console.error("❌ Email send failed:", error);
    return false;
  }
}

module.exports = { sendEmail };
