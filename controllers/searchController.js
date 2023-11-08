"use strict";

const handle = require("../helpers/errorHandler.js");

const pokemon = require("pokemontcgsdk");
pokemon.configure({ apikey: process.env.POKE_API_KEY });

const Card = require("../models/card.js");

// Display search form on GET
exports.search_get = async (req, res, next) => {
  const [err, reversedSets] = await handle(
    pokemon.set.all({orderBy: "-releaseDate"})
  );
  if (err) return next(err);
  
  return res.render("search-form", {
    title: "Search for a Card",
    sets: reversedSets
  })
}

// Display results on GET
exports.search_results_get = async (req, res, next) => {
  const userId = req.user._id;
  const pokeName = req.query.pokeName.trim().toLowerCase();
  const pokeSet = req.query.pokeSet.trim().toLowerCase();

  // If pokeSet, search only within the set
  const searchQuery = `name:"*${pokeName}*"${!pokeSet.length ? "" : " set.id:" + pokeSet}`;
  console.log("########## searchquery " + searchQuery)

  const [searchErr, results] = await handle(
    pokemon.card.where({ q: searchQuery, orderBy: "-set.releaseDate" })
  );
  if (searchErr) return next(searchErr);

  // Add reverse holo && 1st edition check to cards
  for (let i = 0; i < results.data.length; i++) {
    const prices = results.data[i].tcgplayer?.prices;
    results.data[i].hasReverseHolo = prices && prices.reverseHolofoil ? true : false;
    results.data[i].has1stEdition = prices && (prices["1stEditionHolo"] || prices["1stEdition"]) ? true : false;
  }

  const [errCards, cards] = await handle(
    Card.find({ userId }).exec()
  );
  if (errCards) return next(errCards);

  // Save whether user has either regular or reverse holo of card
  const reverseHoloSet = new Set(), cardSet = new Set(), firstEdSet = new Set();

  cards.forEach(card => {
    const firstEdCheck = card.value.priceType === "1stEditionHolofoil" || card.value.priceType === "1stEdition";

    if (firstEdCheck) firstEdSet.add(card.id);
    else if (card.meta.rarity.reverseHolo) reverseHoloSet.add(card.id);
    else cardSet.add(card.id);
    // if (!card.meta.rarity.reverseHolo) cardSet.add(card.id);
    // else reverseHoloSet.add(card.id);
  })

  return res.render("search-results", {
    title: "Results",
    card_list: results.data,
    user_cards: cardSet,
    user_reverse_cards: reverseHoloSet,
    user_1sted_cards: firstEdSet
  })
}