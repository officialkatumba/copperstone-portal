const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;

const flash = require("connect-flash");
const passport = require("passport");
const path = require("path");
const helmet = require("helmet");
require("dotenv").config();

console.log("======================================");
console.log("ENVIRONMENT CHECK:");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Is production?", process.env.NODE_ENV === "production");
console.log("======================================");

const app = express();

// 🟢 DEBUG LOGS
console.log("✅ Express app created successfully");
console.log("✅ NODE_ENV:", process.env.NODE_ENV);
console.log("✅ PORT from env:", process.env.PORT);

// ==================================================
// TRUST PROXY
// ==================================================
app.enable("trust proxy");

// ==================================================
// HELMET
// ==================================================
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// ==================================================
// HTTPS REDIRECT (PRODUCTION ONLY)
// ==================================================
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  // Force HTTPS only
  if (!req.secure) {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }

  next();
});

// ==================================================
// DATABASE
// ==================================================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ==================================================
// PASSPORT CONFIG
// ==================================================
require("./config/passportConfig")(passport);

// ==================================================
// CORE MIDDLEWARE
// ==================================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==================================================
// STATIC FILES
// ==================================================
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../frontend/public")));

// ==================================================
// VIEW ENGINE
// ==================================================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));

// ==================================================
// SESSION
// ==================================================
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60,
    }),

    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  }),
);

// ==================================================
// AUTH & FLASH
// ==================================================
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// ==================================================
// GLOBAL VIEW VARIABLES
// ==================================================
app.use((req, res, next) => {
  res.locals.messages = {
    success: req.flash("success"),
    error: req.flash("error"),
  };

  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.user = req.user || null;

  next();
});

// ==================================================
// ROUTE IMPORTS
// ==================================================
const homeRoutes = require("./routes/homeRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const admissionsRoutes = require("./routes/admissionsRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const financeRoutes = require("./routes/financeRoutes");
const registrationRoutes = require("./routes/registrationRoutes");

const deanRoutes = require("./routes/deanRoutes");
const vcRoutes = require("./routes/vcRoutes");
const registrarRoutes = require("./routes/registrarRoutes");
const deanOfStudentsRoutes = require("./routes/deanOfStudentsRoutes");
const lecturerRoutes = require("./routes/lecturerRoutes");

const directorAcademicRoutes = require("./routes/directorAcademicRoutes");

const skillApplicationRoutes = require("./routes/skillApplicationRoutes");
const skillFinanceRoutes = require("./routes/skillFinanceRoutes");
const skillAdmissionsRoutes = require("./routes/skillAdmissionsRoutes");

const expenseRoutes = require("./routes/expenseRoutes");
const studentRoutes = require("./routes/studentRoutes");

// ==================================================
// ROUTE MOUNTING
// ==================================================

// 🌍 Public & Auth
app.use("/", homeRoutes);
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);

// 🎓 Applications & Registration
app.use("/applications", applicationRoutes);
app.use("/registration", registrationRoutes);

// 🏫 Admissions & Finance
app.use("/admissions", admissionsRoutes);
app.use("/finance", financeRoutes);

// 👨‍🏫 Academic Leadership
app.use("/dean", deanRoutes);
app.use("/vc", vcRoutes);
app.use("/dean-of-students", deanOfStudentsRoutes);
app.use("/director-academic", directorAcademicRoutes);

// 🧾 Registrar
app.use("/registrar", registrarRoutes);

// 🧑‍🏫 Lecturers
app.use("/lecturer", lecturerRoutes);

// 🛠 Skills
app.use("/skills", skillApplicationRoutes);
app.use("/finance/skills", skillFinanceRoutes);
app.use("/admissions/skills", skillAdmissionsRoutes);

// 💰 Expenses
app.use("/finance/expenses", expenseRoutes);

// 🎓 Students
app.use("/student", studentRoutes);

// ==================================================
// TEST ROUTE
// ==================================================
app.get("/registrar/test", (req, res) => {
  res.send("✅ Registrar route is working");
});

// ==================================================
// 404 HANDLER
// ==================================================
app.use((req, res) => {
  res.status(404).render("error/404", {
    title: "Page Not Found",
    user: req.user || null,
  });
});

module.exports = app;
