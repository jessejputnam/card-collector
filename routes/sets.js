"use strict";

const express = require("express");
const router = express.Router();

const set_controller = require("../controllers/setController");

// ################# SETS ####################

// GET request for collection by set
router.get("/", set_controller.display_sets_get);

// // One time (hopefully) update to the new integer id system
// router.get(
//   "/update-all-new-stupid-id-change",
//   set_controller.update_all_new_stupid_id_change
// );

// GET request for individual set detail
router.get("/:setId", set_controller.display_set_detail_get);

// POST request to update set (admin only)
router.post("/:setId/update-logo", set_controller.update_set_logo_post);

// POST to update set series admi only
router.post("/:setId/update-series", set_controller.update_set_series_post);

//

// ###########################################

module.exports = router;
