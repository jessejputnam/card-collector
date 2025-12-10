"use strict";

const Card = require("../models/card");
const User = require("../models/user");
const handle = require("../helpers/errorHandler");
const sort = require("../helpers/sort");
const makeCSV = require("../helpers/makeCSV");
const getConversionRate = require("../helpers/getConversionRate");

exports.change_curr_post = async (req, res, next) => {
  const userId = req.user._id;
  const newCurr = req.body.curr;

  const [errUser, user] = await handle(
    User.findByIdAndUpdate(userId, { curr: newCurr })
  );
  if (errUser) return next(errUser);

  const referrer = req.headers.referer || "/";

  return res.redirect(referrer);
};

// ################# View Cards ##################

// Handle display collection on GET
exports.display_collection_get = async (req, res, next) => {
  const userId = req.user._id;
  const curr = req.user.curr;

  if (!req.user.binders) {
    const newBinders = ["elite", "prize"];
    const [errUser, user] = await handle(
      User.findByIdAndUpdate(userId, { binders: newBinders })
    );
    if (errUser) return next(errUser);
  }

  // Get cards for display
  const sortAsc = req.query.asc;
  const sortType = req.query.by;
  const asc = sortAsc === "true" ? true : false;

  const [errCards, cards] = await handle(Card.find({ userId }).exec());
  if (errCards) return next(errCards);

  const [errConvert, currConvert] = await getConversionRate(curr);
  if (errConvert) return next(errConvert);

  const total =
    cards.reduce(
      (acc, next) => acc + next.value.market * (next.value.count || 1),
      0
    ) * currConvert;

  let card_list;

  if (!sortType || sortType === "value")
    card_list = !asc
      ? cards.sort(sort.byValueDesc)
      : cards.sort(sort.byValueAsc);
  else if (sortType === "rarity")
    card_list = !asc
      ? cards.sort(sort.byRarityDesc)
      : cards.sort(sort.byRarityAsc);
  else if (sortType === "name")
    card_list = !asc ? cards.sort(sort.byNameDesc) : cards.sort(sort.byNameAsc);
  else if (sortType === "set")
    card_list = !asc ? cards.sort(sort.bySetDesc) : cards.sort(sort.bySetAsc);
  else if (sortType === "supertype")
    card_list = !asc
      ? cards.sort(sort.bySupertypeDesc)
      : cards.sort(sort.bySupertypeAsc);
  else return redirect("/collection/home");

  const csv = makeCSV(card_list);

  return res.render("home", {
    title: "My Collection",
    card_list,
    csv,
    total,
    curr_convert: currConvert,
    curr,
    by_field: sortType,
    asc_field: sortAsc
  });
};

// Handle display collection sorted on GET
exports.display_collection_sorted_get = async (req, res, next) => {
  const ascStr = req.query.asc;
  const userId = req.user._id;
  const curr = req.user.curr;
  const sortBy = req.query.by;
  const sortAsc = ascStr === "true" ? true : false;

  const [errCards, cards] = await handle(Card.find({ userId: userId }));
  if (errCards) return next(errCards);

  const [errConvert, currConvert] = await getConversionRate(curr);
  if (errConvert) return next(errConvert);

  const total =
    cards.reduce((acc, next) => acc + next.value.market, 0) * currConvert;

  let sorted;

  if (sortBy === "value")
    sorted = !sortAsc
      ? cards.sort(sort.byValueDesc)
      : cards.sort(sort.byValueAsc);
  else if (sortBy === "rarity")
    sorted = !sortAsc
      ? cards.sort(sort.byRarityDesc)
      : cards.sort(sort.byRarityAsc);
  else if (sortBy === "name")
    sorted = !sortAsc
      ? cards.sort(sort.byNameDesc)
      : cards.sort(sort.byNameAsc);
  else if (sortBy === "set")
    sorted = !sortAsc ? cards.sort(sort.bySetDesc) : cards.sort(sort.bySetAsc);
  else if (sortBy === "supertype")
    sorted = !sortAsc
      ? cards.sort(sort.bySupertypeDesc)
      : cards.sort(sort.bySupertypeAsc);
  else return redirect("/collection/home");

  return res.render("home-sort", {
    title: "My Collection",
    card_list: sorted,
    total: total,
    by_field: sortBy,
    asc_field: ascStr,
    curr_convert: currConvert,
    curr
  });
};

// ################ Filter Cards ##################
// Handle get filter page
exports.display_filter_page_get = async (req, res, next) => {
  const userId = req.user._id;
  const curr = req.user.curr;
  let results = [];

  const [errCards, cards] = await handle(Card.find({ userId: userId }));
  if (errCards) return next(errCards);

  // Populate form data
  const collection = cards;
  const setsSet = new Set();
  const subtypesSet = new Set();
  const raritiesSet = new Set();

  collection.forEach((card) => {
    setsSet.add(
      `${card.meta.set.releaseDate}||${card.meta.set.id}||${card.meta.set.name}`
    );

    card.meta.subtypes.forEach((subtype) => subtypesSet.add(subtype));

    raritiesSet.add(card.meta.rarity.type);
  });

  const sets = Array.from(setsSet)
    .map((set) => set.split("||"))
    .sort((a, b) => {
      if (a[0] < b[0]) return 1;
      if (a[0] > b[0]) return -1;
      return 0;
    });

  const subtypes = Array.from(subtypesSet).sort();
  const rarities = Array.from(raritiesSet).sort();

  let savedQuery = {};

  // Filter data if filter request
  if (req.query.asc) {
    savedQuery = {
      value: req.query.value,
      reverseholo: req.query.reverseholo,
      compareValue: req.query.compareValue,
      name: req.query.name,
      rarities: req.query.rarities,
      supertypes: req.query.supertypes,
      subtypes: req.query.subtypes,
      sets: req.query.setid,
      sortby: req.query.sortby,
      asc: req.query.asc === "true" ? true : false
    };

    // Run through queries
    const byReverse = !savedQuery.reverseholo
      ? collection
      : collection.filter((card) => card.meta.rarity.reverseHolo);

    const byVal = byReverse.filter((card) => {
      if (savedQuery.compareValue === ">=")
        return card.value.market >= Number(savedQuery.value);
      else return card.value.market <= Number(savedQuery.value);
    });

    const byName = byVal.filter((card) => {
      return card.pokemon.name
        .toLowerCase()
        .includes(savedQuery.name.toLowerCase());
    });

    const byRare = !savedQuery.rarities
      ? byName
      : byName.filter((card) => {
          if (!Array.isArray(savedQuery.rarities))
            savedQuery.rarities = [savedQuery.rarities];
          return savedQuery.rarities.includes(card.meta.rarity.type);
        });

    const bySupertypes = !savedQuery.supertypes
      ? byRare
      : byRare.filter((card) => {
          if (!Array.isArray(savedQuery.supertypes))
            savedQuery.supertypes = [savedQuery.supertypes];
          return savedQuery.supertypes.includes(card.meta.supertype);
        });

    const bySubtypes = !savedQuery.subtypes
      ? bySupertypes
      : bySupertypes.filter((card) => {
          let check = 0;
          if (!Array.isArray(savedQuery.subtypes))
            savedQuery.subtypes = [savedQuery.subtypes];

          card.meta.subtypes.forEach((subtype) => {
            if (savedQuery.subtypes.includes(subtype)) check++;
          });
          return check > 0;
        });

    const bySets = !savedQuery.sets
      ? bySubtypes
      : bySubtypes.filter((card) => {
          if (!Array.isArray(savedQuery.sets))
            savedQuery.sets = [savedQuery.sets];
          return savedQuery.sets.includes(card.meta.set.id);
        });

    const sortBy = savedQuery.sortby;
    const sortAsc = savedQuery.asc;

    let cards;

    if (sortBy === "value")
      cards = !sortAsc
        ? bySets.sort(sort.byValueDesc)
        : (cards = bySets.sort(sort.byValueAsc));
    else if (sortBy === "rarity")
      cards = !sortAsc
        ? bySets.sort(sort.byRarityDesc)
        : (cards = bySets.sort(sort.byRarityAsc));
    else if (sortBy === "name")
      cards = !sortAsc
        ? bySets.sort(sort.byNameDesc)
        : bySets.sort(sort.byNameAsc);
    else if (sortBy === "set")
      cards = !sortAsc
        ? bySets.sort(sort.bySetDesc)
        : (cards = bySets.sort(sort.bySetAsc));
    else if (sortBy === "supertype")
      cards = !sortAsc
        ? bySets.sort(sort.bySupertypeDesc)
        : (cards = bySets.sort(sort.bySupertypeAsc));
    results = cards;
  }

  const csv = makeCSV(results);

  const [errConvert, currConvert] = await getConversionRate(curr);
  if (errConvert) return next(errConvert);

  const page_data = {
    title: "Filter Collection",
    sets,
    subtypes,
    rarities,
    savedQuery,
    results,
    curr_convert: currConvert,
    curr,
    csv
  };

  return res.render("filter-collection", page_data);
};
