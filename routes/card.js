"use strict";

const express = require("express");
const router = express.Router();

const card_controller = require("../controllers/cardController");
const system_controller = require("../controllers/systemController");

router.post("/change_curr", card_controller.change_curr_post);

// ################# Home Collection ####################

// GET request for home
router.get("/home", card_controller.display_collection_get);

// GET request for home sorted
router.get("/home/sort", card_controller.display_collection_sorted_get);

// ################# BINDERS ####################

// GET request for Binders view
router.get("/binders", card_controller.display_binders_get);

// POST request for adding new Binder
router.post("/binders/add", card_controller.add_binders_post);

// GET request for displaying binder
router.get("/binders/display/:id", card_controller.display_binder_get);

// POST request for deleting binder
router.post("/binders/remove", card_controller.delete_binder_post);

// ################# SETS ####################

// GET request for collection by set
router.get("/sets", card_controller.display_filter_by_set_get);

// ################# ADDING CARDS ####################

// POST request for add card
router.post("/add-card", card_controller.add_card_post);

// ################# CUSTOM CARDS ####################

// GET request for add custom card form
router.get("/add-custom-card", card_controller.add_custom_card_get);

// POST request for add custom card
router.post("/add-custom-card", card_controller.add_custom_card_post);

// GET request for edit custom card form
router.get("/:id/edit", card_controller.edit_custom_card_get);

// POST request for edit custom card
router.post("/:id/edit", card_controller.edit_custom_card_post);

// ################# FILTER VIEW ####################

// GET request for filter page
router.get("/filter", card_controller.display_filter_page_get);

// ################# CARD DETAIL VIEW ####################

// GET request for display card detail
router.get("/:id", card_controller.display_card_get);

// GET request for delete card
router.get("/:id/delete", card_controller.delete_card_get);

// POST request for delete card
router.post("/:id/delete", card_controller.delete_card_post);

// POST request for change price update auto/manual
router.post("/:id/change-update-value", card_controller.change_update_type);

// POST request for update price history
router.post("/:id/update-value", card_controller.update_price_history_post);

// POST request for add to prize binder
router.post("/:id/select-binder", card_controller.select_binder_post);

// POST request for edit rarity
router.post("/:id/edit-rarity", card_controller.edit_card_rarity);

// POST request for edit count
router.post("/:id/update-count", card_controller.edit_card_count);

module.exports = router;
