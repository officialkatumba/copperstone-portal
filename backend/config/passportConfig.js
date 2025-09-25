// config/passportConfig.js
const User = require("../models/User");

module.exports = function (passport) {
  // Use passport-local-mongoose's built-in strategy
  passport.use(User.createStrategy());

  // Serialize & deserialize
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
};
