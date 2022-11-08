"use strict";

require("dotenv").config();

const createError = require("http-errors");
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const authCheckFalse = require("./helpers/authCheckFalse");

// Database Connection
const mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const indexRouter = require("./routes/index");
const cardRouter = require("./routes/card");
const searchRouter = require("./routes/search");

const User = require("./models/user");

const app = express();
const sessionStore = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: "mySessions",
  databaseName: "test"
});
sessionStore.on(
  "error",
  console.error.bind(console, "MongoDB Session Storage connection error")
);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

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
    done(err, user);
  });
});

app.use(
  session({
    name: "session",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: true
    },
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    name: "session-id",
    resave: false,
    saveUninitialized: true
  })
);

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
// -------------- End Passport --------------------- //

// Get access to currentUser variable in all views
app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

app.use(express.urlencoded({ extended: false }));

app.use("/", indexRouter);
app.use("/collection", authCheckFalse, cardRouter);
app.use("/search", authCheckFalse, searchRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
