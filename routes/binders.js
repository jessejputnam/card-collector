"use strict";

const express = require("express");
const router = express.Router();

const binder_controller = require("../controllers/binderController");

// ################# BINDERS ####################

// GET request for Binders view
router.get("/", binder_controller.display_binders_get);

// POST request for adding new Binder
router.post("/add", binder_controller.add_binders_post);

// GET request for displaying binder
router.get("/display/:id", binder_controller.display_binder_get);

// POST request for deleting binder
router.post("/remove", binder_controller.delete_binder_post);

module.exports = router;
