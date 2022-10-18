"use strict";

const express = require("express");
const router = express.Router();

const auth_controller = require("../controllers/authController");
const card_controller = require("../controllers/cardController");

router.get("/", (req, res) => {
  res.render("index", { title: "Card Collector" });
});

router.get("/register", auth_controller.signup_get);
router.post("/register", auth_controller.sign_up_post);

router.get("/login", auth_controller.login_get);
router.post("/login", auth_controller.login_post);
router.get("/logout", auth_controller.logout_get);

module.exports = router;
