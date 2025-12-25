"use strict";

const Card = require("../models/card");
const User = require("../models/user");
const handle = require("../helpers/errorHandler");
const sort = require("../helpers/sort");
const makeCSV = require("../helpers/makeCSV");
const getConversionRate = require("../helpers/getConversionRate");
const filterQueries = require("../helpers/filtration/filterQueries");
const { sortCardQuery } = require("../helpers/sort");

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

  // Get cards for display
  const sortAsc = req.query.asc;
  const sortType = req.query.by;
  const isAsc = sortAsc === "true" ? true : false;

  const [errCards, cards] = await handle(Card.find({ userId }).exec());
  if (errCards) return next(errCards);

  const [errConvert, currConvert] = await getConversionRate(curr);
  if (errConvert) return next(errConvert);

  const total =
    cards.reduce(
      (acc, next) => acc + next.value.market * (next.value.count || 1),
      0
    ) * currConvert;

  sortCardQuery(cards, sortType, isAsc);

  const csv = makeCSV(cards);

  return res.render("home", {
    title: "My Collection",
    card_list: cards,
    csv,
    total,
    curr_convert: currConvert,
    curr,
    by_field: sortType,
    asc_field: sortAsc
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
    const bySets = filterQueries(collection, savedQuery);

    const sortBy = savedQuery.sortby;
    const sortAsc = savedQuery.asc;

    sortCardQuery(bySets, sortBy, sortAsc);

    results = bySets;
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

// Handle display cards by set on GET
exports.display_filter_by_set_get = async (req, res, next) => {
  const userId = req.user._id;
  const curr = req.user.curr;

  const [errCards, cards] = await handle(Card.find({ userId: userId }));
  if (errCards) return next(errCards);

  // Find which sets exist in collection
  const setOrder = {};
  cards.forEach((card) => {
    const setId = card.meta.set.id;
    if (!(setId in setOrder))
      setOrder[setId] = [card.meta.set.name, card.meta.set.releaseDate];
  });

  // Sort sets by date
  const setArr = [];
  for (const set in setOrder) setArr.push([set, setOrder[set]]);

  setArr.sort(sort.byDateDesc);
  for (let i = 0; i < setArr.length; i++) setOrder[setArr[i][0]] = i;

  // Create array with unique empty arrays
  const orderedSets = Array.from(Array(setArr.length), () => []);

  // Add cards to sets in array
  cards.forEach((card) => {
    const idx = setArr.findIndex((s) => s[0] === card.meta.set.id);
    orderedSets[idx].push(card);
  });

  // Object holding both sets and CSV data
  const list_sets = [];

  // Sort cards within sets
  for (const s of orderedSets) {
    s.sort(sort.byCardNumber);
    const csv = makeCSV(s);
    const set = {
      csv: csv,
      cards: s
    };

    list_sets.push(set);
  }

  const [errConvert, currConvert] = await getConversionRate(curr);
  if (errConvert) return next(errConvert);

  return res.render("sets-collection", {
    title: "Set Collection",
    list_sets,
    curr_convert: currConvert,
    curr
  });
};
