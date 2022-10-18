"use strict";

const express = require("express");
const router = express.Router();

const card_controller = require("../controllers/cardController");

// GET request for home
router.get("/home", (req, res) => {
  res.render("home");
});

module.exports = router;
