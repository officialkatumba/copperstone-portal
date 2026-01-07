// const express = require("express");
// const mongoose = require("mongoose");
// const session = require("express-session");
// const flash = require("connect-flash");
// const passport = require("passport");
// const path = require("path");
// require("dotenv").config();

// const app = express();

// // ----- Database -----
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch((err) => console.error("❌ MongoDB Error:", err));

// // ----- Passport Config -----
// require("./config/passportConfig")(passport);

// // ----- Middleware -----
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // ----- Static Files -----
// app.use(express.static(path.join(__dirname, "../public")));
// app.use(express.static(path.join(__dirname, "../frontend/public")));

// // ----- View Engine -----
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "../frontend/views"));

// // ----- Session -----
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "copperstone_secret",
//     resave: false,
//     saveUninitialized: false,
//   })
// );

// // ----- Passport -----
// app.use(passport.initialize());
// app.use(passport.session());
// app.use(flash());

// // ----- Flash Vars -----
// app.use((req, res, next) => {
//   res.locals.success_msg = req.flash("success_msg");
//   res.locals.error_msg = req.flash("error_msg");
//   res.locals.error = req.flash("error");
//   res.locals.user = req.user || null;
//   next();
// });

// // ----------------------------------------------------
// // ---------------------- ROUTES -----------------------
// // ----------------------------------------------------
// const homeRoute = require("./routes/homeRoutes");
// const authRoute = require("./routes/authRoutes");
// const dashboardRoute = require("./routes/dashboardRoutes");
// const admissionsRoutes = require("./routes/admissionsRoutes");
// const applicationRoutes = require("./routes/applicationRoutes");
// const financeRoutes = require("./routes/financeRoutes");
// const registrationRoutes = require("./routes/registrationRoutes");
// const deanRoutes = require("./routes/deanRoutes");
// const vcRoutes = require("./routes/vcRoutes");

// // Skills
// const skillApplicationRoutes = require("./routes/skillApplicationRoutes");
// const skillFinanceRoutes = require("./routes/skillFinanceRoutes");
// const skillAdmissionsRoutes = require("./routes/skillAdmissionsRoutes");

// // Add this with other imports at the top
// const deanOfStudentsRoutes = require("./routes/deanOfStudentsRoutes");

// // Add registrar routes
// const registrarRoutes = require("./routes/registrarRoutes");
// app.use("/registrar", registrarRoutes);

// // ----- Public Routes -----
// app.use("/", homeRoute);
// app.use("/", authRoute);
// app.use("/", dashboardRoute);

// // ----- Applications (Degree/Diploma) -----
// // Existing mount
// app.use("/programs", applicationRoutes);

// // ✅ IMPORTANT FIX — REQUIRED FOR RECEIPTS
// // app.use("/", applicationRoutes);

// // ----- Admissions -----
// app.use("/admissions", admissionsRoutes);

// // ----- Finance -----
// app.use("/finance", financeRoutes);

// // ----- Registration -----
// app.use("/", registrationRoutes);

// // ----- Dean -----
// app.use("/", deanRoutes);

// // ----- VC -----
// app.use("/vc", vcRoutes);

// // ----- SKILLS -----
// // Student
// app.use("/skills", skillApplicationRoutes);

// // Finance
// app.use("/finance/skills", skillFinanceRoutes);

// // Admissions
// app.use("/admissions/skills", skillAdmissionsRoutes);

// // Add this after your other route imports
// const lecturerRoutes = require("./routes/lecturer");
// app.use("/", lecturerRoutes);

// // Test route - add this in app.js
// app.get("/registrar/test", (req, res) => {
//   res.send("Registrar test route works!");
// });

// // After other routes
// app.use("/dean-of-students", deanOfStudentsRoutes);

// module.exports = app;

// const express = require("express");
// const mongoose = require("mongoose");
// const session = require("express-session");
// const flash = require("connect-flash");
// const passport = require("passport");
// const path = require("path");
// require("dotenv").config();

// const app = express();

// // ==================================================
// // DATABASE
// // ==================================================
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB Connected"))
//   .catch((err) => console.error("❌ MongoDB Error:", err));

// // ==================================================
// // PASSPORT CONFIG
// // ==================================================
// require("./config/passportConfig")(passport);

// // ==================================================
// // CORE MIDDLEWARE
// // ==================================================
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // ==================================================
// // STATIC FILES
// // ==================================================
// app.use(express.static(path.join(__dirname, "../public")));
// app.use(express.static(path.join(__dirname, "../frontend/public")));

// // ==================================================
// // VIEW ENGINE
// // ==================================================
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "../frontend/views"));

// // ==================================================
// // SESSION
// // ==================================================
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "copperstone_secret",
//     resave: false,
//     saveUninitialized: false,
//   })
// );

// // ==================================================
// // AUTH & FLASH
// // ==================================================
// app.use(passport.initialize());
// app.use(passport.session());
// app.use(flash());

// // ==================================================
// // GLOBAL VIEW VARIABLES (FIXES `messages` BUG)
// // ==================================================
// app.use((req, res, next) => {
//   res.locals.messages = {
//     success: req.flash("success"),
//     error: req.flash("error"),
//   };

//   res.locals.success_msg = req.flash("success_msg");
//   res.locals.error_msg = req.flash("error_msg");
//   res.locals.user = req.user || null;
//   next();
// });

// // ==================================================
// // ROUTE IMPORTS
// // ==================================================
// const homeRoutes = require("./routes/homeRoutes");
// const authRoutes = require("./routes/authRoutes");
// const dashboardRoutes = require("./routes/dashboardRoutes");

// const admissionsRoutes = require("./routes/admissionsRoutes");
// const applicationRoutes = require("./routes/applicationRoutes");
// const financeRoutes = require("./routes/financeRoutes");
// const registrationRoutes = require("./routes/registrationRoutes");

// const deanRoutes = require("./routes/deanRoutes");
// const vcRoutes = require("./routes/vcRoutes");
// const registrarRoutes = require("./routes/registrarRoutes");
// const deanOfStudentsRoutes = require("./routes/deanOfStudentsRoutes");
// const lecturerRoutes = require("./routes/lecturerRoutes");

// // Skills
// const skillApplicationRoutes = require("./routes/skillApplicationRoutes");
// const skillFinanceRoutes = require("./routes/skillFinanceRoutes");
// const skillAdmissionsRoutes = require("./routes/skillAdmissionsRoutes");

// // ==================================================
// // ROUTE MOUNTING (STRICT NAMESPACING)
// // ==================================================

// // 🌍 Public & Auth
// app.use("/", homeRoutes);
// app.use("/auth", authRoutes); // 🔧 CHANGED (was "/") FIXED
// app.use("/dashboard", dashboardRoutes); // 🔧 CHANGED (was "/") FIXED

// // 🎓 Applications & Registration
// app.use("/applications", applicationRoutes); // 🔧 CHANGED (was /programs)
// app.use("/registration", registrationRoutes); // 🔧 CHANGED   FIXED

// // 🏫 Admissions & Finance
// app.use("/admissions", admissionsRoutes);
// app.use("/finance", financeRoutes);

// // 👨‍🏫 Academic Leadership
// app.use("/dean", deanRoutes); // 🔧 CHANGED  FIXED
// app.use("/vc", vcRoutes);
// app.use("/dean-of-students", deanOfStudentsRoutes);

// // 🧾 Registrar (CORRECT & ISOLATED)
// app.use("/registrar", registrarRoutes);

// // 🧑‍🏫 Lecturers
// app.use("/lecturer", lecturerRoutes); // 🔧 CHANGED  FIXED

// // 🛠 Skills Module
// app.use("/skills", skillApplicationRoutes);
// app.use("/finance/skills", skillFinanceRoutes);
// app.use("/admissions/skills", skillAdmissionsRoutes);

// // ==================================================
// // TEST ROUTE
// // ==================================================
// app.get("/registrar/test", (req, res) => {
//   res.send("✅ Registrar route is working");
// });

// module.exports = app;

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const path = require("path");
const helmet = require("helmet");
require("dotenv").config();

const app = express();

// ==================================================
// TRUST PROXY (REQUIRED FOR HEROKU SSL)
// ==================================================
app.enable("trust proxy");

// ==================================================
// FORCE HTTPS + DOMAIN CANONICALIZATION
// ==================================================
app.use(helmet());

app.use((req, res, next) => {
  const host = req.headers.host;

  // 🔐 Force HTTPS
  if (!req.secure) {
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }

  // 🔁 OPTIONAL: FORCE NON-WWW (recommended for you)
  if (host === "www.copperstoneuniversity.site") {
    return res.redirect(
      301,
      `https://copperstoneuniversity.site${req.originalUrl}`
    );
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
    secret: process.env.SESSION_SECRET || "copperstone_secret",
    resave: false,
    saveUninitialized: false,
  })
);

// ==================================================
// AUTH & FLASH
// ==================================================
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// ==================================================
// GLOBAL VIEW VARIABLES (FIXES `messages` BUG)
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

// Skills
const skillApplicationRoutes = require("./routes/skillApplicationRoutes");
const skillFinanceRoutes = require("./routes/skillFinanceRoutes");
const skillAdmissionsRoutes = require("./routes/skillAdmissionsRoutes");

// ==================================================
// ROUTE MOUNTING (STRICT NAMESPACING)
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

// 🧾 Registrar
app.use("/registrar", registrarRoutes);

// 🧑‍🏫 Lecturers
app.use("/lecturer", lecturerRoutes);

// 🛠 Skills Module
app.use("/skills", skillApplicationRoutes);
app.use("/finance/skills", skillFinanceRoutes);
app.use("/admissions/skills", skillAdmissionsRoutes);

// ==================================================
// TEST ROUTE
// ==================================================
app.get("/registrar/test", (req, res) => {
  res.send("✅ Registrar route is working");
});

module.exports = app;
