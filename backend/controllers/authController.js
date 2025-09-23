const passport = require("passport");
const User = require("../models/User");

/**
 * ===============================
 * 1. Registration
 * ===============================
 */

// Show Student Registration Form
exports.showRegisterForm = (req, res) => {
  res.render("auth/register");
};

// Handle Student Registration
exports.registerUser = async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;
  try {
    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      req.flash("error", "All fields are required.");
      return res.redirect("/register");
    }
    if (password !== confirmPassword) {
      req.flash("error", "Passwords do not match.");
      return res.redirect("/register");
    }

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      req.flash("error", "Email already registered.");
      return res.redirect("/register");
    }

    // Create new user
    await User.create({ fullName, email, password });
    req.flash("success", "Registration successful! Please login.");
    res.redirect("/login");
  } catch (err) {
    console.error("Registration error:", err);
    req.flash("error", "Something went wrong. Please try again.");
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
  res.render("auth/login");
};

// Handle Login with Passport
exports.loginUser = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err || !user) {
      req.flash("error", info?.message || "Login failed.");
      return res.redirect("/login");
    }

    req.logIn(user, async (err) => {
      if (err) return next(err);

      try {
        // Optional: populate more data if needed
        const populatedUser = await User.findById(user._id);
        const displayName = populatedUser.fullName || populatedUser.email;

        req.flash("success", `Welcome back, ${displayName}!`);

        // Store user in session
        req.session.user = populatedUser;

        // Role-based redirects
        if (populatedUser.role === "Admin") {
          return res.redirect("/admin/dashboard");
        }
        if (populatedUser.role === "AdmissionsOfficer") {
          return res.redirect("/admissions/dashboard");
        }
        if (populatedUser.role === "FinanceOfficer") {
          return res.redirect("/finance/dashboard");
        }

        // Default for students/others
        return res.redirect("/dashboard");
      } catch (error) {
        console.error("Login population error:", error);
        return next(error);
      }
    });
  })(req, res, next);
};

// Logout
exports.logoutUser = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Logged out successfully.");
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
    currentUser: req.user,
    error: "",
    success: "",
  });
};

// Handle Password Change
exports.postChangePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.render("auth/changePassword", {
        currentUser: req.user,
        error: "New passwords do not match.",
        success: "",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.render("auth/changePassword", {
        currentUser: req.user,
        error: "User not found.",
        success: "",
      });
    }

    // Manually verify old password since we're using bcrypt
    const validOld = await user.isValidPassword(oldPassword);
    if (!validOld) {
      return res.render("auth/changePassword", {
        currentUser: req.user,
        error: "Old password is incorrect.",
        success: "",
      });
    }

    // Save new password
    user.password = newPassword;
    await user.save();

    res.render("auth/changePassword", {
      currentUser: req.user,
      error: "",
      success: "Your password has been updated successfully!",
    });
  } catch (err) {
    console.error("Password change error:", err);
    res.render("auth/changePassword", {
      currentUser: req.user,
      error: "Something went wrong. Please try again.",
      success: "",
    });
  }
};
