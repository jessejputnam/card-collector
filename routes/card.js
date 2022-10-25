"use strict";

const express = require("express");
const router = express.Router();

const card_controller = require("../controllers/cardController");

// GET request for home
router.get("/home", card_controller.display_collection_get);

// GET request for home sorted
router.get("/home/sort", card_controller.display_collection_sorted_get);

// GET request for prize binder
router.get("/prize", card_controller.display_prize_get);

// GET request for collection by set
router.get("/sets", card_controller.display_filter_by_set_get);

// POST request for add card
router.post("/add-card", card_controller.add_card_post);

// POST request for add bulk
router.post("/add-bulk", card_controller.add_bulk_post);

// GET request for display Bulk
router.get("/bulk", card_controller.display_bulk_get);

// GET request for display card detail
router.get("/:id", card_controller.display_card_get);

// POST request for edit card detail
router.post("/:id/edit", card_controller.edit_card_post);

// GET request for delete card
router.get("/:id/delete", card_controller.delete_card_get);

// POST request for delete card
router.post("/:id/delete", card_controller.delete_card_post);

// POST request for update price history
router.post("/:id/update-value", card_controller.update_price_history_post);

// POST request for add to prize binder
router.post("/:id/select-binder", card_controller.select_binder_post);

// POST request for edit rarity
router.post("/:id/edit-rarity", card_controller.edit_card_rarity);

module.exports = router;
