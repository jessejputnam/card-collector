"use strict";

const handle = require("../helpers/errorHandler.js");

const pokemon = require("pokemontcgsdk");
pokemon.configure({ apikey: process.env.POKE_API_KEY });

const User = require("../models/user");
const Card = require("../models/card");

// Display search form on GET
exports.search_get = async (req, res, next) => {
  const [err, reversedSets] = await handle(pokemon.set.all({orderBy: "-releaseDate"}))
  if (err) return next(err);
  
  return res.render("search-form", {
    title: "Search for a Card",
    sets: reversedSets
  })
}

// Display results on GET
exports.search_results_get = async (req, res, next) => {
  const pokeName = req.query.pokeName.trim().toLowerCase();
  const pokeSet = req.query.pokeSet.trim().toLowerCase();

  // If more than one word, search for exact name; else search for name contains
  const exact = pokeName.split(" ").length > 1;
  const searchName = exact ? `"${pokeName}"` : pokeName;

  // If pokeSet, search only within the set
  const searchQuery = `name:${searchName}${!pokeSet.length ? "" : " set.id:" + pokeSet}`;

  const [searchErr, results] = await handle(pokemon.card.where({ q: searchQuery, orderBy: "-set.releaseDate" }));
  if (searchErr) return next(searchErr);

  const [userErr, user] = await handle(User.findById(req.user._id).populate("cards").exec());
  if (userErr) return next(userErr);

  // Save whether user has either regular or reverse holo of card
  const reverseHoloSet = new Set(), cardSet = new Set();

  user.cards.forEach(card => {
    if (!card.meta.rarity.reverseHolo) cardSet.add(card.id);
    else reverseHoloSet.add(card.id);
  })

  return res.render("search-results", {
    title: "Results",
    card_list: results.data,
    user_cards: cardSet,
    user_reverse_cards: reverseHoloSet
  })
}