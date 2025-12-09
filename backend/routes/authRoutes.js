// const express = require("express");
// const router = express.Router();
// const authCtrl = require("../controllers/authController");
// const passport = require("passport");

// // Registration
// router.get("/register", authCtrl.showRegisterForm);
// router.post("/register", authCtrl.registerUser);

// // Login
// router.get("/login", authCtrl.showLoginForm);
// router.post("/login", authCtrl.loginUser);

// // Logout
// router.get("/logout", authCtrl.logoutUser);

// // Change password (protected)
// router.get("/change-password", authCtrl.getChangePassword);
// router.post("/change-password", authCtrl.postChangePassword);

// // Forgot Password
// router.get("/forgot-password", authCtrl.showForgotPasswordForm);
// router.post("/forgot-password", authCtrl.processForgotPassword);

// module.exports = router;

const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/authController");

// Registration
router.get("/register", authCtrl.showRegisterForm);
router.post("/register", authCtrl.registerUser);

// Login
router.get("/login", authCtrl.showLoginForm);
router.post("/login", authCtrl.loginUser);

// Logout
router.get("/logout", authCtrl.logoutUser);

// Change password
router.get("/change-password", authCtrl.getChangePassword);
router.post("/change-password", authCtrl.postChangePassword);

// Forgot Password
router.get("/forgot-password", authCtrl.showForgotPasswordForm);
router.post("/forgot-password", authCtrl.processForgotPassword);

// Reset Password (with token)
router.get("/reset-password/:token", authCtrl.showResetPasswordForm);
router.post("/reset-password/:token", authCtrl.processResetPassword);

module.exports = router;
