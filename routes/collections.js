"use strict";

const express = require("express");
const router = express.Router();

const card_controller = require("../controllers/cardController");

router.post("/change_curr", card_controller.change_curr_post);

// ################# Home Collection ####################

// GET request for home
router.get("/home", card_controller.display_collection_get);
// router.get("/update-sets", system_controller.update_sets); // For updating sets

// GET request for home sorted
router.get("/home/sort", card_controller.display_collection_sorted_get);

// ################# FILTER VIEW ####################

// GET request for filter page
router.get("/filter", card_controller.display_filter_page_get);

module.exports = router;
