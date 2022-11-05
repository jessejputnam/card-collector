"use strict";

const passport = require("passport");
const { body, validationResult } = require("express-validator");

const User = require("../models/user");

// Display correct page on index GET
exports.index_get = (req, res, next) => {
  const images = [
    {
      src: "https://images.saymedia-content.com/.image/c_limit%2Ccs_srgb%2Cq_auto:eco%2Cw_620/MTgzNzMyNzQyNzI5NTA4MzU2/so-you-discovered-your-old-pokmon-card-collection-how-to-know-if-you-struck-gold-or-struck-out.webp",
      alt: "Collection of cards"
    },
    {
      src: "https://i.ebayimg.com/images/g/iVoAAOSwS49hzfyC/s-l500.jpg",
      alt: "Neat collection of cards"
    },
    {
      src: "https://ichef.bbci.co.uk/news/976/cpsprodpb/D08F/production/_117619335_21f28cd1-f1fa-4ff2-9d4f-3cf2b1a8a0f8.jpg",
      alt: "Shiny Charizard"
    },
    {
      src: "https://www.wargamer.com/wp-content/sites/wargamer/2021/05/classic-pokemon-cards-and-pokeball-thimo-pedersen-unsplash.jpg",
      alt: "Pokeball and cards"
    }
  ];

  res.render("index", {
    title: "Card Collector",
    images: images
  });
};

// Display sign up on GET
exports.signup_get = (req, res, next) => {
  res.render("form-sign-up", { title: "Register" });
};

// Handle sign up on POST
exports.sign_up_post = [
  // Validate and sanitize fields
  body("username", "Must be a valid email address")
    .trim()
    .isLength({ min: 1 })
    .isEmail()
    .normalizeEmail()
    .escape(),
  body("password", "Password required").trim().isLength({ min: 1 }),
  body("passConfirm", "Password confirmation must match password")
    .trim()
    .isLength({ min: 1 })
    .custom((value, { req }) => value === req.body.password),

  // Process request after validation/sanitization
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors, rerender
      res.render("form-sign-up", {
        title: "Register",
        errors: errors.array()
      });
    }

    try {
      // Check if user exists
      const found_user = await User.find({ username: req.body.username });
      if (found_user.length > 0) {
        return res.render("form-sign-up", {
          title: "Register",
          error: "Email is already in use"
        });
      }

      // Continue registration
      const user = new User({
        creator: null,
        username: req.body.username,
        password: req.body.password
      });

      user.save((err) => {
        if (err) {
          return next(err);
        }

        // Successful, redirect to login
        res.redirect("/login");
      });
    } catch (err) {
      return next(err);
    }
  }
];

// Handle login on GET
exports.login_get = (req, res, next) => {
  res.render("form-log-in", {
    title: "Log In",
    errors: req.flash("error")
  });
};

// Handle login on POST
exports.login_post = passport.authenticate("local", {
  successRedirect: "/collection/home",
  failureRedirect: "/login",
  failureFlash: true
});

// Handle logout on POST
exports.logout_get = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
};
