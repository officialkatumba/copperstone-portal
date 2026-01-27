// const passport = require("passport");
// const User = require("../models/User");
// const crypto = require("crypto");
// const nodemailer = require("nodemailer");

// // Configure email transporter using .env credentials
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST || "smtp.gmail.com",
//   port: process.env.EMAIL_PORT || 587,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// /**
//  * ===============================
//  * 1. Registration
//  * ===============================
//  */

// // Show Student Registration Form

// exports.showRegisterForm = (req, res) => {
//   res.render("auth/register", { title: "Register - Copperstone" });
// };

// // Handle Student Registration
// exports.registerUser = async (req, res) => {
//   const {
//     firstName,
//     surname,
//     otherNames,
//     mobile,
//     email,
//     password,
//     confirmPassword,
//   } = req.body;

//   try {
//     // Validation
//     if (
//       !firstName ||
//       !surname ||
//       !mobile ||
//       !email ||
//       !password ||
//       !confirmPassword
//     ) {
//       req.flash("error_msg", "All required fields must be filled.");
//       return res.redirect("/auth/register");
//     }

//     if (password !== confirmPassword) {
//       req.flash("error_msg", "Passwords do not match.");
//       return res.redirect("/auth/register");
//     }

//     // Check if email already exists
//     const existing = await User.findOne({ email });
//     if (existing) {
//       req.flash("error_msg", "Email already registered.");
//       return res.redirect("/auth/register");
//     }

//     // ✅ Create base user object with default student profile
//     const newUser = new User({
//       firstName,
//       surname,
//       otherNames: otherNames || "",
//       mobile,
//       email,
//       role: "Student", // default role

//       // initialize the studentProfile structure
//       studentProfile: {
//         personalInfo: {
//           dateOfBirth: null,
//           gender: null,
//           nationality: null,
//           nationalIdNumber: null,
//         },
//         contactAddress: {
//           street: "",
//           city: "",
//           province: "",
//           postalCode: "",
//         },
//         emergencyContact: {
//           fullName: "",
//           relation: "",
//           phone: "",
//           email: "",
//         },
//         previousEducation: [],
//         registrationStatus: "Pending",
//         admissionStatus: "Applied",
//       },
//     });

//     // ✅ Register user using passport-local-mongoose (handles hashing)
//     await User.register(newUser, password);

//     req.flash(
//       "success_msg",
//       "Registration successful! Please login to complete your student profile."
//     );
//     res.redirect("/login");
//   } catch (err) {
//     console.error("Registration error:", err);
//     req.flash(
//       "error_msg",
//       err.message || "Something went wrong. Please try again."
//     );
//     res.redirect("/auth/register");
//   }
// };

// /**
//  * ===============================
//  * 2. Authentication
//  * ===============================
//  */

// // Show Login Form
// exports.showLoginForm = (req, res) => {
//   res.render("auth/login", { title: "Login - Copperstone" });
// };

// // Handle Login with Passport
// exports.loginUser = (req, res, next) => {
//   passport.authenticate("local", (err, user, info) => {
//     if (err || !user) {
//       req.flash("error_msg", info?.message || "Login failed.");
//       return res.redirect("/auth/login");
//     }

//     req.logIn(user, async (err) => {
//       if (err) return next(err);

//       req.flash("success_msg", `Welcome back, ${user.fullName || user.email}!`);

//       // Role-based redirects
//       switch (user.role) {
//         case "Admin":
//           return res.redirect("/dashboard/admin");
//         case "AdmissionsOfficer":
//           return res.redirect("/dashboard/admissions");
//         case "FinanceOfficer":
//           return res.redirect("/dashboard/finance");
//         case "TeachingStaff":
//           return res.redirect("/dashboard/staff");
//         case "SuperAdmin":
//           return res.redirect("/dashboard/superadmin");
//         case "Dean":
//           return res.redirect("/dashboard/dean");
//         case "VC":
//           return res.redirect("/dashboard/vc");
//         case "Registrar":
//           return res.redirect("/dashboard/registrar");
//         case "Lecturer":
//           return res.redirect("/dashboard/lecturer");
//         case "DeanOfStudents":
//           return res.redirect("/dashboard/dean-of-students");

//         // Add to your existing switch statement
//         // case "StudentAffairs":
//         //   return res.redirect("/dashboard/student-affairs");
//         case "StudentAffairs":
//           return res.redirect("/dashboard/StudentAffairs");
//         default:
//           return res.redirect("/dashboard/student");
//       }
//     });
//   })(req, res, next);
// };

// // Logout
// exports.logoutUser = (req, res, next) => {
//   req.logout((err) => {
//     if (err) return next(err);
//     req.flash("success_msg", "Logged out successfully.");
//     res.redirect("/auth/login");
//   });
// };

// /**
//  * ===============================
//  * 3. Password Change
//  * ===============================
//  */

// // Show Change Password Form
// exports.getChangePassword = (req, res) => {
//   res.render("auth/changePassword", {
//     title: "Change Password",
//     currentUser: req.user,
//   });
// };

// // Handle Password Change
// exports.postChangePassword = async (req, res) => {
//   try {
//     const { oldPassword, newPassword, confirmPassword } = req.body;

//     if (!oldPassword || !newPassword || !confirmPassword) {
//       req.flash("error_msg", "All fields are required.");
//       return res.redirect("/auth/change-password");
//     }

//     if (newPassword !== confirmPassword) {
//       req.flash("error_msg", "New passwords do not match.");
//       return res.redirect("/auth/change-password");
//     }

//     // passport-local-mongoose gives us changePassword method
//     const user = await User.findById(req.user._id);
//     if (!user) {
//       req.flash("error_msg", "User not found.");
//       return res.redirect("/auth/change-password");
//     }

//     user.changePassword(oldPassword, newPassword, (err) => {
//       if (err) {
//         req.flash("error_msg", "Old password is incorrect.");
//         return res.redirect("/auth/change-password");
//       }

//       req.flash("success_msg", "Your password has been updated successfully!");
//       res.redirect("/auth/change-password");
//     });
//   } catch (err) {
//     console.error("Password change error:", err);
//     req.flash("error_msg", "Something went wrong. Please try again.");
//     res.redirect("/auth/change-password");
//   }
// };

// /**
//  * ===============================
//  * 4. FORGOT PASSWORD - FULL IMPLEMENTATION
//  * ===============================
//  */

// // Show Forgot Password Page
// exports.showForgotPasswordForm = (req, res) => {
//   res.render("auth/forgot-password", {
//     title: "Forgot Password",
//   });
// };

// // Handle Forgot Password POST
// exports.processForgotPassword = async (req, res) => {
//   const { email } = req.body;

//   try {
//     // Validation
//     if (!email) {
//       req.flash("error_msg", "Please enter your email address.");
//       return res.redirect("/auth/forgot-password");
//     }

//     // Find user by email
//     const user = await User.findOne({ email: email.toLowerCase().trim() });

//     // For security, don't reveal if email exists
//     if (!user) {
//       console.log(`Password reset requested for non-existent email: ${email}`);
//       req.flash(
//         "success_msg",
//         "If your email exists in our system, a reset link will be sent."
//       );
//       return res.redirect("/auth/login");
//     }

//     // Generate reset token
//     const resetToken = crypto.randomBytes(32).toString("hex");

//     // Hash the token and set expiry (1 hour from now)
//     user.resetPasswordToken = crypto
//       .createHash("sha256")
//       .update(resetToken)
//       .digest("hex");
//     user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

//     await user.save();

//     // Create reset URL
//     const resetUrl = `${req.protocol}://${req.get(
//       "host"
//     )}/auth/reset-password/${resetToken}`;

//     // Email content
//     const mailOptions = {
//       from: `"Copperstone Portal" <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject: "Password Reset Request - Copperstone University Portal",
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//           <div style="text-align: center; margin-bottom: 30px;">
//             <h2 style="color: #6a11cb; margin-bottom: 10px;">Copperstone University</h2>
//             <p style="color: #666; font-size: 16px;">Student Portal Password Reset</p>
//           </div>

//           <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
//             <h3 style="color: #333; margin-bottom: 15px;">Hello ${user.firstName},</h3>
//             <p style="color: #555; line-height: 1.6;">
//               You requested a password reset for your Copperstone University Portal account.
//               Click the button below to reset your password:
//             </p>

//             <div style="text-align: center; margin: 30px 0;">
//               <a href="${resetUrl}" style="
//                 display: inline-block;
//                 padding: 12px 30px;
//                 background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
//                 color: white;
//                 text-decoration: none;
//                 border-radius: 30px;
//                 font-weight: bold;
//                 font-size: 16px;
//               ">Reset Password</a>
//             </div>

//             <p style="color: #555; line-height: 1.6;">
//               This link will expire in <strong>1 hour</strong>.
//               If you didn't request this, please ignore this email.
//             </p>

//             <p style="color: #777; font-size: 14px; margin-top: 20px;">
//               Or copy and paste this link into your browser:<br>
//               <code style="background-color: #eee; padding: 5px 10px; border-radius: 4px; word-break: break-all;">
//                 ${resetUrl}
//               </code>
//             </p>
//           </div>

//           <div style="border-top: 1px solid #eee; padding-top: 20px; color: #888; font-size: 12px; text-align: center;">
//             <p>Copperstone University Portal<br>
//             This is an automated message, please do not reply.</p>
//             <p>If you need assistance, contact the IT support desk.</p>
//           </div>
//         </div>
//       `,
//     };

//     // Send email
//     await transporter.sendMail(mailOptions);

//     console.log(`Password reset email sent to: ${email}`);
//     req.flash(
//       "success_msg",
//       "Password reset link has been sent to your email. Please check your inbox."
//     );
//     res.redirect("/auth/login");
//   } catch (err) {
//     console.error("Forgot password error:", err);

//     // Check for specific email errors
//     if (err.code === "EAUTH" || err.code === "EENVELOPE") {
//       console.error(
//         "Email authentication error. Check EMAIL_USER and EMAIL_PASS in .env"
//       );
//       req.flash(
//         "error_msg",
//         "Email service configuration error. Please contact administrator."
//       );
//     } else {
//       req.flash("error_msg", "Error sending reset email. Please try again.");
//     }

//     res.redirect("/forgot-password");
//   }
// };

// /**
//  * ===============================
//  * 5. RESET PASSWORD
//  * ===============================
//  */

// // Show Reset Password Form
// exports.showResetPasswordForm = async (req, res) => {
//   try {
//     const { token } = req.params;

//     if (!token) {
//       req.flash("error_msg", "Invalid reset token.");
//       return res.redirect("/auth/forgot-password");
//     }

//     // Hash the token to compare with stored hash
//     const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

//     // Find user with valid reset token
//     const user = await User.findOne({
//       resetPasswordToken: hashedToken,
//       resetPasswordExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       req.flash("error_msg", "Password reset token is invalid or has expired.");
//       return res.redirect("/auth/forgot-password");
//     }

//     res.render("auth/reset-password", {
//       title: "Reset Password",
//       token: token, // Pass the token to the view
//     });
//   } catch (err) {
//     console.error("Reset password form error:", err);
//     req.flash("error_msg", "Something went wrong. Please try again.");
//     res.redirect("/auth/forgot-password");
//   }
// };

// // Handle Reset Password POST
// exports.processResetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { password, confirmPassword } = req.body;

//     // Validation
//     if (!password || !confirmPassword) {
//       req.flash("error_msg", "Please fill in all fields.");
//       return res.redirect(`/auth/reset-password/${token}`);
//     }

//     if (password !== confirmPassword) {
//       req.flash("error_msg", "Passwords do not match.");
//       return res.redirect(`/auth/reset-password/${token}`);
//     }

//     if (password.length < 6) {
//       req.flash("error_msg", "Password must be at least 6 characters long.");
//       return res.redirect(`/auth/reset-password/${token}`);
//     }

//     // Hash the token to compare with stored hash
//     const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

//     // Find user with valid reset token
//     const user = await User.findOne({
//       resetPasswordToken: hashedToken,
//       resetPasswordExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       req.flash("error_msg", "Password reset token is invalid or has expired.");
//       return res.redirect("/auth/forgot-password");
//     }

//     // Set new password
//     await user.setPassword(password);

//     // Clear reset token fields
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;

//     await user.save();

//     // Send confirmation email
//     const mailOptions = {
//       from: `"Copperstone Portal" <${process.env.EMAIL_USER}>`,
//       to: user.email,
//       subject: "Password Reset Successful - Copperstone University",
//       html: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
//           <div style="text-align: center; margin-bottom: 30px;">
//             <h2 style="color: #4CAF50; margin-bottom: 10px;">✓ Password Reset Successful</h2>
//             <p style="color: #666; font-size: 16px;">Copperstone University Portal</p>
//           </div>

//           <div style="background-color: #f0f8ff; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
//             <h3 style="color: #333; margin-bottom: 15px;">Hello ${
//               user.firstName
//             },</h3>
//             <p style="color: #555; line-height: 1.6;">
//               Your Copperstone University Portal password was successfully reset on
//               <strong>${new Date().toLocaleDateString("en-US", {
//                 weekday: "long",
//                 year: "numeric",
//                 month: "long",
//                 day: "numeric",
//                 hour: "2-digit",
//                 minute: "2-digit",
//               })}</strong>.
//             </p>

//             <div style="background-color: #fff8e1; padding: 15px; border-radius: 5px; margin: 20px 0;">
//               <p style="margin: 0; color: #d32f2f;">
//                 <strong>Security Alert:</strong> If you did not make this change, please contact the IT support desk immediately.
//               </p>
//             </div>

//             <p style="color: #555; line-height: 1.6;">
//               You can now log in to your account with your new password.
//             </p>

//             <div style="text-align: center; margin: 30px 0;">
//               <a href="${req.protocol}://${req.get("host")}/login" style="
//                 display: inline-block;
//                 padding: 12px 30px;
//                 background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
//                 color: white;
//                 text-decoration: none;
//                 border-radius: 30px;
//                 font-weight: bold;
//                 font-size: 16px;
//               ">Login to Your Account</a>
//             </div>
//           </div>

//           <div style="border-top: 1px solid #eee; padding-top: 20px; color: #888; font-size: 12px; text-align: center;">
//             <p>Copperstone University Portal - Security Team<br>
//             This is an automated security notification.</p>
//           </div>
//         </div>
//       `,
//     };

//     await transporter.sendMail(mailOptions);

//     req.flash(
//       "success_msg",
//       "Your password has been reset successfully! Please login with your new password."
//     );
//     res.redirect("auth/login");
//   } catch (err) {
//     console.error("Reset password error:", err);
//     req.flash("error_msg", "Error resetting password. Please try again.");
//     res.redirect(`/auth/reset-password/${token}`);
//   }
// };
const passport = require("passport");
const User = require("../models/User");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Configure email transporter using .env credentials
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * ===============================
 * 1. Registration
 * ===============================
 */

// Show Student Registration Form
exports.showRegisterForm = (req, res) => {
  res.render("auth/register", { title: "Register - Copperstone" });
};

// Handle Student Registration
exports.registerUser = async (req, res) => {
  const {
    firstName,
    surname,
    otherNames,
    mobile,
    email,
    password,
    confirmPassword,
  } = req.body;

  try {
    // Validation
    if (
      !firstName ||
      !surname ||
      !mobile ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      req.flash("error_msg", "All required fields must be filled.");
      return res.redirect("/auth/register");
    }

    if (password !== confirmPassword) {
      req.flash("error_msg", "Passwords do not match.");
      return res.redirect("/auth/register");
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      req.flash("error_msg", "Email already registered.");
      return res.redirect("/auth/register");
    }

    // ✅ Create base user object with default student profile
    const newUser = new User({
      firstName,
      surname,
      otherNames: otherNames || "",
      mobile,
      email,
      role: "Student", // default role

      // initialize the studentProfile structure
      studentProfile: {
        personalInfo: {
          dateOfBirth: null,
          gender: null,
          nationality: null,
          nationalIdNumber: null,
        },
        contactAddress: {
          street: "",
          city: "",
          province: "",
          postalCode: "",
        },
        emergencyContact: {
          fullName: "",
          relation: "",
          phone: "",
          email: "",
        },
        previousEducation: [],
        registrationStatus: "Pending",
        admissionStatus: "Applied",
      },
    });

    // ✅ Register user using passport-local-mongoose (handles hashing)
    await User.register(newUser, password);

    req.flash(
      "success_msg",
      "Registration successful! Please login to complete your student profile."
    );
    res.redirect("/auth/login");
  } catch (err) {
    console.error("Registration error:", err);
    req.flash(
      "error_msg",
      err.message || "Something went wrong. Please try again."
    );
    res.redirect("/auth/register");
  }
};

/**
 * ===============================
 * 2. Authentication
 * ===============================
 */

// Show Login Form
exports.showLoginForm = (req, res) => {
  res.render("auth/login", { title: "Login - Copperstone" });
};

// Handle Login with Passport
exports.loginUser = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err || !user) {
      req.flash("error_msg", info?.message || "Login failed.");
      return res.redirect("/auth/login");
    }

    req.logIn(user, async (err) => {
      if (err) return next(err);

      req.flash("success_msg", `Welcome back, ${user.fullName || user.email}!`);

      // Role-based redirects
      switch (user.role) {
        case "Admin":
          return res.redirect("/dashboard/admin");
        case "AdmissionsOfficer":
          return res.redirect("/dashboard/admissions");
        case "FinanceOfficer":
          return res.redirect("/dashboard/finance");
        case "TeachingStaff":
          return res.redirect("/dashboard/staff");
        case "SuperAdmin":
          return res.redirect("/dashboard/superadmin");
        case "Dean":
          return res.redirect("/dashboard/dean");
        case "VC":
          return res.redirect("/dashboard/vc");
        case "Registrar":
          return res.redirect("/dashboard/registrar");
        case "Lecturer":
          return res.redirect("/dashboard/lecturer");
        case "DeanOfStudents":
          return res.redirect("/dashboard/dean-of-students");
        case "StudentAffairs":
          return res.redirect("/dashboard/StudentAffairs");
        // In your auth controller login function, add:
        case "DirectorAcademic":
          return res.redirect("/dashboard/director-academic");
        default:
          return res.redirect("/dashboard/student");
      }
    });
  })(req, res, next);
};

// Logout
exports.logoutUser = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success_msg", "Logged out successfully.");
    res.redirect("/auth/login");
  });
};

/**
 * ===============================
 * 3. Password Change
 * ===============================
 */

// Show Change Password Form
exports.getChangePassword = (req, res) => {
  res.render("auth/changePassword", {
    title: "Change Password",
    currentUser: req.user,
  });
};

// Handle Password Change
exports.postChangePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      req.flash("error_msg", "All fields are required.");
      return res.redirect("/auth/change-password");
    }

    if (newPassword !== confirmPassword) {
      req.flash("error_msg", "New passwords do not match.");
      return res.redirect("/auth/change-password");
    }

    // passport-local-mongoose gives us changePassword method
    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/auth/change-password");
    }

    user.changePassword(oldPassword, newPassword, (err) => {
      if (err) {
        req.flash("error_msg", "Old password is incorrect.");
        return res.redirect("/auth/change-password");
      }

      req.flash("success_msg", "Your password has been updated successfully!");
      res.redirect("/auth/change-password");
    });
  } catch (err) {
    console.error("Password change error:", err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/auth/change-password");
  }
};

/**
 * ===============================
 * 4. FORGOT PASSWORD - FULL IMPLEMENTATION
 * ===============================
 */

// Show Forgot Password Page
exports.showForgotPasswordForm = (req, res) => {
  res.render("auth/forgot-password", {
    title: "Forgot Password",
  });
};

// Handle Forgot Password POST
exports.processForgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Validation
    if (!email) {
      req.flash("error_msg", "Please enter your email address.");
      return res.redirect("/auth/forgot-password");
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // For security, don't reveal if email exists
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      req.flash(
        "success_msg",
        "If your email exists in our system, a reset link will be sent."
      );
      return res.redirect("/auth/login");
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token and set expiry (1 hour from now)
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/auth/reset-password/${resetToken}`;

    // Email content
    const mailOptions = {
      from: `"Copperstone Portal" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request - Copperstone University Portal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #6a11cb; margin-bottom: 10px;">Copperstone University</h2>
            <p style="color: #666; font-size: 16px;">Student Portal Password Reset</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-bottom: 15px;">Hello ${user.firstName},</h3>
            <p style="color: #555; line-height: 1.6;">
              You requested a password reset for your Copperstone University Portal account.
              Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="
                display: inline-block;
                padding: 12px 30px;
                background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
                color: white;
                text-decoration: none;
                border-radius: 30px;
                font-weight: bold;
                font-size: 16px;
              ">Reset Password</a>
            </div>
            
            <p style="color: #555; line-height: 1.6;">
              This link will expire in <strong>1 hour</strong>.
              If you didn't request this, please ignore this email.
            </p>
            
            <p style="color: #777; font-size: 14px; margin-top: 20px;">
              Or copy and paste this link into your browser:<br>
              <code style="background-color: #eee; padding: 5px 10px; border-radius: 4px; word-break: break-all;">
                ${resetUrl}
              </code>
            </p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; color: #888; font-size: 12px; text-align: center;">
            <p>Copperstone University Portal<br>
            This is an automated message, please do not reply.</p>
            <p>If you need assistance, contact the IT support desk.</p>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    console.log(`Password reset email sent to: ${email}`);
    req.flash(
      "success_msg",
      "Password reset link has been sent to your email. Please check your inbox."
    );
    res.redirect("/auth/login");
  } catch (err) {
    console.error("Forgot password error:", err);

    // Check for specific email errors
    if (err.code === "EAUTH" || err.code === "EENVELOPE") {
      console.error(
        "Email authentication error. Check EMAIL_USER and EMAIL_PASS in .env"
      );
      req.flash(
        "error_msg",
        "Email service configuration error. Please contact administrator."
      );
    } else {
      req.flash("error_msg", "Error sending reset email. Please try again.");
    }

    res.redirect("/auth/forgot-password");
  }
};

/**
 * ===============================
 * 5. RESET PASSWORD
 * ===============================
 */

// Show Reset Password Form
exports.showResetPasswordForm = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      req.flash("error_msg", "Invalid reset token.");
      return res.redirect("/auth/forgot-password");
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error_msg", "Password reset token is invalid or has expired.");
      return res.redirect("/auth/forgot-password");
    }

    res.render("auth/reset-password", {
      title: "Reset Password",
      token: token, // Pass the token to the view
    });
  } catch (err) {
    console.error("Reset password form error:", err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/auth/forgot-password");
  }
};

// Handle Reset Password POST
exports.processResetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validation
    if (!password || !confirmPassword) {
      req.flash("error_msg", "Please fill in all fields.");
      return res.redirect(`/auth/reset-password/${token}`);
    }

    if (password !== confirmPassword) {
      req.flash("error_msg", "Passwords do not match.");
      return res.redirect(`/auth/reset-password/${token}`);
    }

    if (password.length < 6) {
      req.flash("error_msg", "Password must be at least 6 characters long.");
      return res.redirect(`/auth/reset-password/${token}`);
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error_msg", "Password reset token is invalid or has expired.");
      return res.redirect("/auth/forgot-password");
    }

    // Set new password
    await user.setPassword(password);

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Send confirmation email
    const mailOptions = {
      from: `"Copperstone Portal" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Successful - Copperstone University",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #4CAF50; margin-bottom: 10px;">✓ Password Reset Successful</h2>
            <p style="color: #666; font-size: 16px;">Copperstone University Portal</p>
          </div>
          
          <div style="background-color: #f0f8ff; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-bottom: 15px;">Hello ${
              user.firstName
            },</h3>
            <p style="color: #555; line-height: 1.6;">
              Your Copperstone University Portal password was successfully reset on 
              <strong>${new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</strong>.
            </p>
            
            <div style="background-color: #fff8e1; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #d32f2f;">
                <strong>Security Alert:</strong> If you did not make this change, please contact the IT support desk immediately.
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.6;">
              You can now log in to your account with your new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${req.protocol}://${req.get("host")}/login" style="
                display: inline-block;
                padding: 12px 30px;
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                color: white;
                text-decoration: none;
                border-radius: 30px;
                font-weight: bold;
                font-size: 16px;
              ">Login to Your Account</a>
            </div>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; color: #888; font-size: 12px; text-align: center;">
            <p>Copperstone University Portal - Security Team<br>
            This is an automated security notification.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    req.flash(
      "success_msg",
      "Your password has been reset successfully! Please login with your new password."
    );
    res.redirect("/auth/login");
  } catch (err) {
    console.error("Reset password error:", err);
    req.flash("error_msg", "Error resetting password. Please try again.");
    res.redirect(`/auth/reset-password/${token}`);
  }
};
