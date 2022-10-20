"use strict";

const pokemon = require("pokemontcgsdk");
pokemon.configure({ apikey: process.env.POKE_API_KEY });

const Card = require("../models/card");
const User = require("../models/user");
const getRarityRating = require("../helpers/getRarityRating");

// Handle display all cards on GET
exports.display_collection_get = (req, res, next) => {
  User.findById(req.user._id)
    .populate("cards")
    .exec(function (err, user) {
      res.render("home", {
        title: "My Collection",
        card_list: user.cards.sort((a, b) => b.value.market - a.value.market)
      });
    });
};

// ################## Add Cards ###################
exports.add_card_post = (req, res, next) => {
  const cardId = req.body.cardId;

  pokemon.card.find(cardId).then((card) => {
    const marketValue = card.tcgplayer.prices.holofoil
      ? card.tcgplayer.prices.holofoil.market
      : card.tcgplayer.prices.normal.market;

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
        market: marketValue,
        priceHistory: [[new Date().toLocaleDateString("en-US"), marketValue]],
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
