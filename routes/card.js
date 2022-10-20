"use strict";

const express = require("express");
const router = express.Router();

const card_controller = require("../controllers/cardController");

// GET request for home
router.get("/home", card_controller.display_collection_get);

// POST request for add card
router.post("/add-card", card_controller.add_card_post);

// GET request for card detail
router.get("/:id", card_controller.display_card_get);

// POST request for edit card detail
router.post("/:id/edit", card_controller.edit_card_post);

module.exports = router;
