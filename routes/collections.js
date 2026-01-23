"use strict";

const express = require("express");
const router = express.Router();

const collection_controller = require("../controllers/collectionController");

router.post("/change_curr", collection_controller.change_curr_post);

// ################# Home Collection ####################

// GET request for home
router.get("/home", collection_controller.display_collection_get);
// router.get("/update-sets", system_controller.update_sets); // For updating sets

// GET request for dash
router.get("/dashboard", collection_controller.display_dashboard_get);

// ################# FILTER VIEW ####################

// GET request for filter page
router.get("/filter", collection_controller.display_filter_page_get);

// ################# SETS VIEW ####################

// GET request for collection by set
router.get("/sets", collection_controller.display_filter_by_set_get);

// GET request for syncing all non-synced cards to new API in set
router.get(
  "/sets/:setId/update-many-to-new-api",
  collection_controller.update_price_api_all_cards_in_set_get
);

// POST request for syncing all non-synced cards to new API in set
// router.post(
//   "/sets/:setId/update-many-to-new-api",
//   collection_controller.update_price_api_all_cards_in_set_post
// );

module.exports = router;
