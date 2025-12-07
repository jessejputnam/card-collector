"use strict";

const express = require("express");
const router = express.Router();

const card_controller = require("../controllers/cardController");

// ################# BINDERS ####################

// GET request for Binders view
router.get("/", card_controller.display_binders_get);

// POST request for adding new Binder
router.post("/add", card_controller.add_binders_post);

// GET request for displaying binder
router.get("/display/:id", card_controller.display_binder_get);

// POST request for deleting binder
router.post("/remove", card_controller.delete_binder_post);

module.exports = router;
