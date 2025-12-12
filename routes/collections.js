"use strict";

const express = require("express");
const router = express.Router();

const collection_controller = require("../controllers/collectionController");

router.post("/change_curr", collection_controller.change_curr_post);

// ################# Home Collection ####################

// GET request for home
router.get("/home", collection_controller.display_collection_get);
// router.get("/update-sets", system_controller.update_sets); // For updating sets

// GET request for home sorted
// router.get("/home/sort", collection_controller.display_collection_sorted_get);

// ################# FILTER VIEW ####################

// GET request for filter page
router.get("/filter", collection_controller.display_filter_page_get);

// ################# SETS VIEW ####################

// GET request for collection by set
router.get("/sets", collection_controller.display_filter_by_set_get);

module.exports = router;
