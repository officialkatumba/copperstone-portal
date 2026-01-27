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

// const express = require("express");
// const mongoose = require("mongoose");
// const session = require("express-session");
// const flash = require("connect-flash");
// const passport = require("passport");
// const path = require("path");
// const helmet = require("helmet");
// require("dotenv").config();

// const app = express();

// // ==================================================
// // TRUST PROXY (REQUIRED FOR HEROKU SSL)
// // ==================================================
// app.enable("trust proxy");

// // ==================================================
// // FORCE HTTPS + DOMAIN CANONICALIZATION
// // ==================================================
// app.use(helmet());

// app.use((req, res, next) => {
//   const host = req.headers.host;

//   // 🔐 Force HTTPS
//   if (!req.secure) {
//     return res.redirect(301, `https://${host}${req.originalUrl}`);
//   }

//   // 🔁 OPTIONAL: FORCE NON-WWW (recommended for you)
//   if (host === "www.copperstoneuniversity.site") {
//     return res.redirect(
//       301,
//       `https://copperstoneuniversity.site${req.originalUrl}`
//     );
//   }

//   next();
// });

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
// app.use("/auth", authRoutes);
// app.use("/dashboard", dashboardRoutes);

// // 🎓 Applications & Registration
// app.use("/applications", applicationRoutes);
// app.use("/registration", registrationRoutes);

// // 🏫 Admissions & Finance
// app.use("/admissions", admissionsRoutes);
// app.use("/finance", financeRoutes);

// // 👨‍🏫 Academic Leadership
// app.use("/dean", deanRoutes);
// app.use("/vc", vcRoutes);
// app.use("/dean-of-students", deanOfStudentsRoutes);

// // 🧾 Registrar
// app.use("/registrar", registrarRoutes);

// // 🧑‍🏫 Lecturers
// app.use("/lecturer", lecturerRoutes);

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

// const express = require("express");
// const mongoose = require("mongoose");
// const session = require("express-session");
// const flash = require("connect-flash");
// const passport = require("passport");
// const path = require("path");
// const helmet = require("helmet");
// require("dotenv").config();

// const app = express();

// // ==================================================
// // TRUST PROXY (REQUIRED FOR HEROKU, SAFE FOR LOCAL)
// // ==================================================
// app.enable("trust proxy");

// // ==================================================
// // HELMET (FINAL CSP – LOCAL + PRODUCTION SAFE)
// // ==================================================
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],

//         styleSrc: [
//           "'self'",
//           "'unsafe-inline'",
//           "https://cdn.jsdelivr.net",
//           "https://fonts.googleapis.com",
//           "https://cdnjs.cloudflare.com",
//         ],

//         scriptSrc: [
//           "'self'",
//           "'unsafe-inline'",
//           "https://cdn.jsdelivr.net",
//           "https://cdnjs.cloudflare.com",
//         ],

//         fontSrc: [
//           "'self'",
//           "https://fonts.gstatic.com",
//           "https://cdnjs.cloudflare.com",
//         ],

//         imgSrc: [
//           "'self'",
//           "data:",
//           "https://cdn.jsdelivr.net",
//           "https://cdnjs.cloudflare.com",
//           "https://encrypted-tbn0.gstatic.com",
//           "https://images.theconversation.com",
//           "https://media.istockphoto.com",
//         ],

//         connectSrc: ["'self'", "https://wa.me"],

//         frameSrc: ["'self'"],

//         formAction: ["'self'"],
//         baseUri: ["'self'"],
//         objectSrc: ["'none'"],

//         upgradeInsecureRequests: [],
//       },
//     },

//     referrerPolicy: { policy: "strict-origin-when-cross-origin" },

//     // Needed for CDNs
//     crossOriginEmbedderPolicy: false,
//   })
// );

// // ==================================================
// // CRITICAL FIX: HTTPS + NON-WWW (PRODUCTION ONLY)
// // ==================================================
// app.use((req, res, next) => {
//   // 🟢 ALLOW LOCALHOST & DEVELOPMENT - NO REDIRECTS
//   if (process.env.NODE_ENV !== "production") {
//     return next();
//   }

//   const host = req.headers.host;

//   // 🔐 Force HTTPS on Heroku ONLY in production
//   if (!req.secure && host === "copperstoneuniversity.site") {
//     return res.redirect(301, `https://${host}${req.originalUrl}`);
//   }

//   // 🔁 Force NON-WWW in production
//   if (host === "www.copperstoneuniversity.site") {
//     return res.redirect(
//       301,
//       `https://copperstoneuniversity.site${req.originalUrl}`
//     );
//   }

//   next();
// });

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
//     cookie: {
//       secure: process.env.NODE_ENV === "production", // true only in production
//       httpOnly: true,
//       sameSite: "lax",
//     },
//   })
// );

// // ==================================================
// // AUTH & FLASH
// // ==================================================
// app.use(passport.initialize());
// app.use(passport.session());
// app.use(flash());

// // ==================================================
// // GLOBAL VIEW VARIABLES
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
// app.use("/auth", authRoutes);
// app.use("/dashboard", dashboardRoutes);

// // 🎓 Applications & Registration
// app.use("/applications", applicationRoutes);
// app.use("/registration", registrationRoutes);

// // 🏫 Admissions & Finance
// app.use("/admissions", admissionsRoutes);
// app.use("/finance", financeRoutes);

// // 👨‍🏫 Academic Leadership
// app.use("/dean", deanRoutes);
// app.use("/vc", vcRoutes);
// app.use("/dean-of-students", deanOfStudentsRoutes);

// // 🧾 Registrar
// app.use("/registrar", registrarRoutes);

// // 🧑‍🏫 Lecturers
// app.use("/lecturer", lecturerRoutes);

// // 🛠 Skills
// app.use("/skills", skillApplicationRoutes);
// app.use("/finance/skills", skillFinanceRoutes);
// app.use("/admissions/skills", skillAdmissionsRoutes);

// // ==================================================
// // TEST ROUTE
// // ==================================================
// app.get("/registrar/test", (req, res) => {
//   res.send("✅ Registrar route is working");
// });

// // ==================================================
// // 404 HANDLER
// // ==================================================
// app.use((req, res) => {
//   res.status(404).render("error/404", {
//     title: "Page Not Found",
//     user: req.user || null,
//   });
// });

// module.exports = app;

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

// 🟢 ADD THIS DEBUG LOG
console.log("✅ Express app created successfully");
console.log("✅ NODE_ENV:", process.env.NODE_ENV);
console.log("✅ PORT from env:", process.env.PORT);

// ==================================================
// TRUST PROXY (REQUIRED FOR HEROKU, SAFE FOR LOCAL)
// ==================================================
app.enable("trust proxy");

// ==================================================
// HELMET (FINAL CSP – LOCAL + PRODUCTION SAFE)
// ==================================================

// ==================================================
// MINIMAL HELMET CONFIG - WILL FIX YOUR ISSUE
// ==================================================
// app.use(
//   helmet({
//     contentSecurityPolicy: false, // ← This is key!
//   })
// );

// app.use(
//   helmet({
//     contentSecurityPolicy: false,
//     crossOriginEmbedderPolicy: false,
//     crossOriginResourcePolicy: { policy: "cross-origin" },
//   })
// );
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],

//         styleSrc: [
//           "'self'",
//           "'unsafe-inline'",
//           "https://cdn.jsdelivr.net",
//           "https://fonts.googleapis.com",
//           "https://cdnjs.cloudflare.com",
//         ],

//         scriptSrc: [
//           "'self'",
//           "'unsafe-inline'",
//           "'unsafe-eval'", // ← ADD THIS LINE
//           "https://cdn.jsdelivr.net",
//           "https://cdnjs.cloudflare.com",
//         ],

//         fontSrc: [
//           "'self'",
//           "https://fonts.gstatic.com",
//           "https://cdnjs.cloudflare.com",
//         ],

//         imgSrc: [
//           "'self'",
//           "data:",
//           "https://cdn.jsdelivr.net",
//           "https://cdnjs.cloudflare.com",
//           "https://encrypted-tbn0.gstatic.com",
//           "https://images.theconversation.com",
//           "https://media.istockphoto.com",
//         ],

//         connectSrc: ["'self'", "https://wa.me"],

//         frameSrc: ["'self'"],

//         formAction: ["'self'"],
//         baseUri: ["'self'"],
//         objectSrc: ["'none'"],

//         upgradeInsecureRequests: [],
//       },
//     },

//     referrerPolicy: { policy: "strict-origin-when-cross-origin" },

//     // Needed for CDNs
//     crossOriginEmbedderPolicy: false,
//   })
// );

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// ==================================================
// CRITICAL FIX: HTTPS + NON-WWW (PRODUCTION ONLY)
// ==================================================
app.use((req, res, next) => {
  // 🟢 ALLOW LOCALHOST & DEVELOPMENT - NO REDIRECTS
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  const host = req.headers.host;

  // 🔐 Force HTTPS on Heroku ONLY in production
  if (!req.secure && host === "copperstoneuniversity.site") {
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }

  // 🔁 Force NON-WWW in production
  if (host === "www.copperstoneuniversity.site") {
    return res.redirect(
      301,
      `https://copperstoneuniversity.site${req.originalUrl}`,
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
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || "copperstone_secret",
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       secure: process.env.NODE_ENV === "production", // true only in production
//       httpOnly: true,
//       sameSite: "lax",
//     },
//   })
// );

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60, // 14 days
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

// // In your main app.js or server.js
// const directorAcademicRoutes = require("./routes/directorAcademicRoutes");

// // Add this with your other route imports
// app.use("/director-academic", directorAcademicRoutes);

// routes
const directorAcademicRoutes = require("./routes/directorAcademicRoutes");

// mount
app.use("/director-academic", directorAcademicRoutes);

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

// 🛠 Skills
app.use("/skills", skillApplicationRoutes);
app.use("/finance/skills", skillFinanceRoutes);
app.use("/admissions/skills", skillAdmissionsRoutes);

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
