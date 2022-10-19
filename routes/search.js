"use strict";

const express = require("express");
const router = express.Router();

const search_controller = require("../controllers/searchController");

// Display search form on GET
router.get("/", search_controller.search_get);

// Display search results on GET
router.get("/results", search_controller.search_results_get);

module.exports = router;
