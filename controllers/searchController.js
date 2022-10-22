"use strict";

const pokemon = require("pokemontcgsdk");
pokemon.configure({ apikey: process.env.POKE_API_KEY });

const User = require("../models/user");

// Display search form on GET
exports.search_get = (req, res, next) => {
  pokemon.set
    .all()
    .then((sets) => {
      const reversedSets = sets.reverse();

      res.render("search-form", {
        title: "Search for a Card",
        sets: reversedSets
      });
    })
    .catch((err) => {
      return next(err);
    });
};

// Display results on GET
exports.search_results_get = (req, res, next) => {
  const pokeName = req.query.pokeName.trim().toLowerCase();
  const pokeSet = req.query.pokeSet.trim().toLowerCase();

  const exact = pokeName.split(" ").length > 1;
  const searchName = exact ? `"${pokeName}"` : pokeName;

  let searchQuery;

  if (!pokeSet.length) {
    searchQuery = `name:${searchName}`;
  } else {
    searchQuery = `name:${searchName} set.id:${pokeSet}`;
  }

  pokemon.card
    .where({ q: searchQuery, orderBy: "-set.releaseDate" })
    .then((result) => {
      User.findById(req.user._id)
        .populate("cards")
        .populate("bulk")
        .exec((err, user) => {
          if (err) return next(err);

          const cardSet = new Set();
          const bulkSet = new Set();
          user.cards.forEach((card) => cardSet.add(card.id));
          user.bulk.forEach((card) => bulkSet.add(card.id));

          res.render("search-results", {
            title: "Results",
            card_list: result.data,
            user_cards: cardSet,
            bulk_cards: bulkSet
          });
        });
    })
    .catch((err) => {
      return next(err);
    });
};
