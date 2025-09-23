// config/passportConfig.js
const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/User");

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await User.findOne({ email });
          if (!user)
            return done(null, false, { message: "Email not registered" });

          const isMatch = await user.isValidPassword(password);
          if (!isMatch)
            return done(null, false, { message: "Incorrect password" });

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) =>
    User.findById(id)
      .then((u) => done(null, u))
      .catch(done)
  );
};
