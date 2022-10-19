"use strict";

const { body, validationResult } = require("express-validator");

const Card = require("../models/card");

// Handle display all cards on GET
exports.display_collection_get = (req, res, next) => {
  Card.find()
    .sort({ marketValue: "desc" })
    .exec(function (err, list_cards) {
      if (err) return next(err);

      // Successful, so render
      res.render("home", {
        title: "My Collection",
        card_list: list_cards
      });
    });
};

// ################## Add Cards ###################
//! Check rarity == i.e. Classic Collection rarity === rare holo

// ################# Sort Cards ###################

// ################ Filter Cards ##################
