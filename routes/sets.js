"use strict";

const express = require("express");
const router = express.Router();

const card_controller = require("../controllers/cardController");

// ################# SETS ####################

// GET request for collection by set
router.get("/", card_controller.display_filter_by_set_get);

module.exports = router;
