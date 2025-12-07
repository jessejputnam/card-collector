const LocalStrategy = require("passport-local");
const User = require("../models/user");

exports.passportSetup = (passport) => {
  // -------------- Start Passport ------------------ //
  passport.use(
    new LocalStrategy((username, password, done) => {
      User.findOne({ username: username }, (err, user) => {
        if (err) return done(err);

        // Username not found
        if (!user) return done(null, false, { message: "Incorrect username" });

        if (user.comparePassword(password)) return done(null, user);
        else return done(null, false, { message: "Incorrect password" });
      });
    })
  );

  // User object is serialized and added to req.session.passport object
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      const data = {
        _id: user._id,
        binders: user.binders,
        curr: user.curr
      };
      done(err, data);
    });
  });
};
