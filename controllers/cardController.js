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

// Handle display card detail on GET
exports.display_card_get = (req, res, next) => {
  const cardId = req.params.id;

  Card.findById(cardId).exec((err, result) => {
    if (err) return next(err);

    if (result === null) {
      const err = new Error("Collection card not found");
      err.status = 404;
      return next(err);
    }
    // Successful, so render
    res.render("card-detail", {
      title: `Collection: ${result.pokemon.name}`,
      card: result
    });
  });
};

// Handle edit card detail on POST
exports.edit_card_post = (req, res, next) => {
  const cardId = req.params.id;
  const pokemonId = req.body.cardId;

  Card.findById(cardId).exec((err, result) => {
    if (err) return next(err);
    const card = result;

    if (!card) {
      const err = new Error("Card not found");
      err.status = 404;
      return next(err);
    }

    if (req.body.reverseHolo) {
      pokemon.card.find(pokemonId).then((tcgCard) => {
        const marketValue = tcgCard.tcgplayer.prices.reverseHolofoil.market;

        card.meta.rarity.reverseHolo = true;
        card.value.market = marketValue;
        card.value.priceType = "reverseHolofoil";
        card.value.priceHistory = [
          [new Date().toLocaleDateString("en-US"), marketValue]
        ];
        card.value.count = req.body.count;

        card.save((err) => {
          if (err) return next(err);

          res.redirect(`/collection/${card._id}`);
        });
      });
    } else {
      card.value.count = req.body.count;

      card.save((err) => {
        if (err) return next(err);

        res.redirect(`/collection/${card._id}`);
      });
    }
  });
};

exports.update_price_history_post = (req, res, next) => {
  exports.edit_card_post = (req, res, next) => {
    const cardId = req.params.id;
    const pokemonId = req.body.cardId;

    Card.findById(cardId).exec((err, result) => {
      if (err) return next(err);
      const card = result;

      if (!card) {
        const err = new Error("Card not found");
        err.status = 404;
        return next(err);
      }

      pokemon.card.find(pokemonId).then((tcgCard) => {
        const newDate = new Date().toLocaleDateString("en-US");

        const marketValue =
          tcgCard.tcgplayer.prices[card.value.priceType].market;

        card.value.market = marketValue;

        if (card.value.priceHistory[0][0] === newDate) {
          card.value.priceHistory[0][1] === marketValue;
        } else {
          card.value.priceHistory.unshift([
            new Date().toLocaleDateString("en-US"),
            marketValue
          ]);
        }

        card.save((err) => {
          if (err) return next(err);

          res.redirect(`/collection/${card._id}`);
        });
      });
    });
  };
};

// ################## Add Cards ###################
exports.add_card_post = (req, res, next) => {
  const cardId = req.body.cardId;

  pokemon.card.find(cardId).then((card) => {
    let marketValue;
    let priceType;

    if (!card.tcgplayer) {
      marketValue = 0;
      priceType = null;
    } else if (card.tcgplayer.prices.holofoil) {
      marketValue = card.tcgplayer.prices.holofoil.market;
      priceType = "holofoil";
    } else if (card.tcgplayer.prices.normal) {
      marketValue = card.tcgplayer.prices.normal.market;
      priceType = "normal";
    } else if (card.tcgplayer.prices.unlimited) {
      marketValue = card.tcgplayer.prices.unlimited.market;
      priceType = "unlimited";
    } else if (card.tcgplayer.prices.unlimitedHolofoil) {
      marketValue = card.tcgplayer.prices.unlimitedHolofoil.market;
      priceType = "unlimitedHolofoil";
    } else if (card.tcgplayer.prices["1stEditionHolofoil"]) {
      marketValue = card.tcgplayer.prices["1stEditionHolofoil"].market;
      priceType = "1stEditionHolofoil";
    } else if (card.tcgplayer.prices["1stEdition"]) {
      marketValue = card.tcgplayer.prices["1stEdition"].market;
      priceType = "1stEdition";
    } else if (card.tcgplayer.prices.reverseHolofoil) {
      marketValue = card.tcgplayer.prices.reverseHolofoil.market;
      priceType = "reverseHolofoil";
    } else {
      marketValue = 0;
      priceType = null;
    }

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
        priceHistory: [
          [new Date().toLocaleDateString("en-US"), marketValue.toFixed(2)]
        ],
        priceType: priceType,
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
exports.add_bulk_post = (req, res, next) => {
  const cardId = req.body.cardId;

  pokemon.card.find(cardId).then((card) => {
    let marketValue;
    let priceType;

    if (!card.tcgplayer) {
      marketValue = 0;
      priceType = null;
    } else if (card.tcgplayer.prices.holofoil) {
      marketValue = card.tcgplayer.prices.holofoil.market;
      priceType = "holofoil";
    } else if (card.tcgplayer.prices.normal) {
      marketValue = card.tcgplayer.prices.normal.market;
      priceType = "normal";
    } else if (card.tcgplayer.prices.unlimited) {
      marketValue = card.tcgplayer.prices.unlimited.market;
      priceType = "unlimited";
    } else if (card.tcgplayer.prices.unlimitedHolofoil) {
      marketValue = card.tcgplayer.prices.unlimitedHolofoil.market;
      priceType = "unlimitedHolofoil";
    } else if (card.tcgplayer.prices["1stEditionHolofoil"]) {
      marketValue = card.tcgplayer.prices["1stEditionHolofoil"].market;
      priceType = "1stEditionHolofoil";
    } else if (card.tcgplayer.prices["1stEdition"]) {
      marketValue = card.tcgplayer.prices["1stEdition"].market;
      priceType = "1stEdition";
    } else if (card.tcgplayer.prices.reverseHolofoil) {
      marketValue = card.tcgplayer.prices.reverseHolofoil.market;
      priceType = "reverseHolofoil";
    } else {
      marketValue = 0;
      priceType = null;
    }

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
        priceHistory: [
          [new Date().toLocaleDateString("en-US"), marketValue.toFixed(2)]
        ],
        priceType: priceType,
        count: 1
      }
    });

    newCard.save((err) => {
      if (err) return next(err);

      User.findByIdAndUpdate(
        req.user._id,
        { $push: { bulk: newCard._id } },
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
