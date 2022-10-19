"use strict";

const { body, validationResult } = require("express-validator");

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
//! Check Subset === Classic Collection / Shiny Vault / Trainer Gallery ------- if set.name includes Classic Collection / Trainer Gallery / Shiny Vault

// ################# Sort Cards ###################

// ################ Filter Cards ##################
