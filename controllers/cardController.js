"use strict";

const { body, validationResult } = require("express-validator");

const pokemon = require("pokemontcgsdk");
pokemon.configure({ apikey: process.env.POKE_API_KEY });

const Card = require("../models/card");
const User = require("../models/user");
const getRarityRating = require("../helpers/getRarityRating");

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
exports.add_card_post = (req, res, next) => {
  const cardId = req.body.cardId;

  pokemon.card.find(cardId).then((card) => {
    const newCard = new Card({
      id: card.id,

      meta: {
        images: {
          small: card.images.small,
          large: card.images.large
        },
        rarity: {
          type: card.rarity,
          grade: getRarityRating[card.rarity]
        },
        supertype: card.supertype,
        subtypes: card.subtypes,
        set: {
          symbol: card.set.images.symbol,
          logo: card.set.images.logo,
          name: card.set.name,
          id: card.set.id,
          series: card.set.series,
          number: card.number,
          totalPrint: card.set.printedTotal,
          releaseDate: card.set.releaseDate
        }
      },

      pokemon: {
        name: card.name,
        natDex: card.nationalPokedexNumbers[0]
      },

      value: {
        prices: card.tcgplayer.prices,
        count: 1
      }
    });

    newCard.save((err) => {
      if (err) return next(err);

      User.findByIdAndUpdate(
        req.user._id,
        { $push: { cards: newCard._id } },
        (err) => {
          if (err) return next(err);

          res.redirect("/collection/home");
        }
      );
    });
  });
};

// ################# Sort Cards ###################

// ################ Filter Cards ##################
