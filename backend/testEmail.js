// // backend/testEmail.js
// const { sendEmail } = require("./utils/mailer");

// (async () => {
//   try {
//     await sendEmail(
//       "annebupe@gmail.com",
//       "Test Email from Copperstone",
//       "<p>This is a test email using Gmail OAuth2 🔐</p>"
//     );
//     console.log("✅ Test email sent successfully!");
//   } catch (err) {
//     console.error("❌ Email test failed:", err);
//   }
// })();

require("dotenv").config();
const { sendEmail } = require("./utils/mailer");

(async () => {
  try {
    await sendEmail({
      to: "annebupe@gmail.com", // ✅ recipient email goes here
      subject: "Test Email from Copperstone",
      html: "<p>This is a test email using Gmail SMTP 🔐</p>",
    });
    console.log("✅ Test email sent successfully!");
  } catch (err) {
    console.error("❌ Email test failed:", err);
  }
})();
