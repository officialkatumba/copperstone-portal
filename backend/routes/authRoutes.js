const express = require("express");
const router = express.Router();
const authCtrl = require("../controllers/authController");
const passport = require("passport");

// Registration
router.get("/register", authCtrl.showRegisterForm);
router.post("/register", authCtrl.registerUser);

// Login
router.get("/login", authCtrl.showLoginForm);
router.post("/login", authCtrl.loginUser);

// Logout
router.get("/logout", authCtrl.logoutUser);

// Change password (protected)
router.get("/change-password", authCtrl.getChangePassword);
router.post("/change-password", authCtrl.postChangePassword);

module.exports = router;
