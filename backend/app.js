const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const path = require("path");
require("dotenv").config();

const app = express();

// ----- Database -----
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ----- Passport Config -----
require("./config/passportConfig")(passport);

// ----- Middleware -----
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // enable JSON APIs too

// ----- Static Files -----
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../frontend/public")));

// ----- View Engine & Layouts -----
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));

// ----- Session -----
app.use(
  session({
    secret: process.env.SESSION_SECRET || "copperstone_secret",
    resave: false,
    saveUninitialized: false,
  })
);

// ----- Passport Middleware -----
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// ----- Flash Vars -----
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error"); // passport errors
  res.locals.user = req.user || null;
  next();
});

// ----- Routes -----
const homeRoute = require("./routes/homeRoutes");
const authRoute = require("./routes/authRoutes");
const dashboardRoute = require("./routes/dashboardRoutes");
const admissionsRoutes = require("./routes/admissionsRoutes");

app.use("/", homeRoute); // ✅ Homepage now works again
app.use("/", authRoute);
app.use("/", dashboardRoute);
const applicationRoutes = require("./routes/applicationRoutes");
app.use("/programs", applicationRoutes);
app.use("/admissions", admissionsRoutes); // ✅ Admissions Desk

module.exports = app;
