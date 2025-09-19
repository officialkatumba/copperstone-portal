// app.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

// ----- Database Connection -----
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected to copperstone_portal"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ----- Middleware -----
app.use(express.urlencoded({ extended: true })); // for form submissions
app.use(express.json()); // for JSON APIs

// ----- View Engine -----
app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views")); // views/home.ejs
app.set("views", path.join(__dirname, "../frontend/views"));

// ----- Static Files -----
// Serve public assets (CSS, JS, images)
app.use(express.static(path.join(__dirname, "../public")));

// ----- Routes -----
const homeRoute = require("./routes/homeRoutes");
app.use("/", homeRoute);

module.exports = app;
