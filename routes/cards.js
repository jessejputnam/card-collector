"use strict";

const express = require("express");
const router = express.Router();

const card_controller = require("../controllers/cardController");

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
