// // app.js
// require("dotenv").config();
// const express = require("express");
// const path = require("path");
// const mongoose = require("mongoose");

// const app = express();

// // ----- Database Connection -----
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("✅ MongoDB connected to copperstone_portal"))
//   .catch((err) => console.error("❌ MongoDB connection error:", err));

// // ----- Middleware -----
// app.use(express.urlencoded({ extended: true })); // for form submissions
// app.use(express.json()); // for JSON APIs

// // ----- View Engine -----
// app.set("view engine", "ejs");
// // app.set("views", path.join(__dirname, "views")); // views/home.ejs
// app.set("views", path.join(__dirname, "../frontend/views"));

// // ----- Static Files -----
// // Serve public assets (CSS, JS, images)
// app.use(express.static(path.join(__dirname, "../public")));

// // ----- Routes -----
// const homeRoute = require("./routes/homeRoutes");
// app.use("/", homeRoute);

// module.exports = app;

// app.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");

const app = express();

// ----- Database Connection -----
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected to copperstone_portal"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ----- Passport Config -----
require("./config/passportConfig")(passport);

// ----- Middleware -----
app.use(express.urlencoded({ extended: true })); // for form submissions
app.use(express.json()); // for JSON APIs

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

// ----- Flash variables for views -----
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error"); // passport error
  res.locals.user = req.user || null;
  next();
});

// ----- View Engine -----
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend/views"));

// ----- Static Files -----
// Serve public assets (CSS, JS, images)
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../frontend/public")));

// ----- Routes -----
const homeRoute = require("./routes/homeRoutes");
const authRoute = require("./routes/authRoutes");
app.use("/", homeRoute);
app.use("/", authRoute);

module.exports = app;
