const passport = require("passport");
const User = require("../models/User");

/**
 * ===============================
 * 1. Registration
 * ===============================
 */

// Show Student Registration Form
// exports.showRegisterForm = (req, res) => {
//   res.render("auth/register", { title: "Register - Copperstone" });
// };

exports.showRegisterForm = (req, res) => {
  res.render("auth/register", { title: "Register - Copperstone" });
};

// Handle Student Registration
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
//       return res.redirect("/register");
//     }

//     if (password !== confirmPassword) {
//       req.flash("error_msg", "Passwords do not match.");
//       return res.redirect("/register");
//     }

//     // Check if email already exists
//     const existing = await User.findOne({ email });
//     if (existing) {
//       req.flash("error_msg", "Email already registered.");
//       return res.redirect("/register");
//     }

//     // Create new user object without password
//     const newUser = new User({
//       firstName,
//       surname,
//       otherNames: otherNames || "",
//       mobile,
//       email,
//       role: "Student", // default role
//     });

//     // passport-local-mongoose handles password hashing & salting
//     await User.register(newUser, password);

//     req.flash("success_msg", "Registration successful! Please login.");
//     res.redirect("/login");
//   } catch (err) {
//     console.error("Registration error:", err);
//     req.flash(
//       "error_msg",
//       err.message || "Something went wrong. Please try again."
//     );
//     res.redirect("/register");
//   }
// };

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
      return res.redirect("/register");
    }

    if (password !== confirmPassword) {
      req.flash("error_msg", "Passwords do not match.");
      return res.redirect("/register");
    }

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      req.flash("error_msg", "Email already registered.");
      return res.redirect("/register");
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
    res.redirect("/login");
  } catch (err) {
    console.error("Registration error:", err);
    req.flash(
      "error_msg",
      err.message || "Something went wrong. Please try again."
    );
    res.redirect("/register");
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
      return res.redirect("/login");
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
    res.redirect("/login");
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
      return res.redirect("/change-password");
    }

    if (newPassword !== confirmPassword) {
      req.flash("error_msg", "New passwords do not match.");
      return res.redirect("/change-password");
    }

    // passport-local-mongoose gives us changePassword method
    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/change-password");
    }

    user.changePassword(oldPassword, newPassword, (err) => {
      if (err) {
        req.flash("error_msg", "Old password is incorrect.");
        return res.redirect("/change-password");
      }

      req.flash("success_msg", "Your password has been updated successfully!");
      res.redirect("/change-password");
    });
  } catch (err) {
    console.error("Password change error:", err);
    req.flash("error_msg", "Something went wrong. Please try again.");
    res.redirect("/change-password");
  }
};

// Show Forgot Password Page
exports.showForgotPasswordForm = (req, res) => {
  res.render("auth/forgot-password", {
    title: "Forgot Password",
  });
};

// Handle Forgot Password POST
exports.processForgotPassword = async (req, res) => {
  const { email } = req.body;
  // TODO: Lookup user, create token, send email
  req.flash("success_msg", "If this email exists, a reset link has been sent.");
  res.redirect("/login");
};
