"use strict";

const express = require("express");
const router = express.Router();

const set_controller = require("../controllers/setController");

// ################# SETS ####################

// GET request for collection by set
router.get("/", set_controller.display_sets_get);

module.exports = router;
