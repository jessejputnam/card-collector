"use strict";

const Card = require("../models/card");
const CardRepo = require("../repositories/cardRepo");
const User = require("../models/user");
const handle = require("../utils/errorHandler");
const sort = require("../utils/sort");
const makeCSV = require("../utils/makeCSV");
const getConversionRate = require("../utils/getConversionRate");
const filterQueries = require("../utils/filtration/filterQueries");
const { sortCardQuery } = require("../utils/sort");

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

  return res.render("collection/home", {
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

  return res.render("collection/filter-collection", page_data);
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

  return res.render("collection/sets-collection", {
    title: "Set Collection",
    list_sets,
    curr_convert: currConvert,
    curr
  });
};

// ############ Dashboard ###########
// Handle display dashboard on GET
exports.display_dashboard_get = async (req, res, next) => {
  const userId = req.user._id;
  const curr = req.user.curr;

  const [errCards, cards] = await handle(CardRepo.getDashboardCards(userId));
  if (errCards) return next(errCards);

  const [errConvert, currConvert] = await getConversionRate(curr);
  if (errConvert) return next(errConvert);

  // TOP BAND
  const totalValue =
    cards.reduce(
      (acc, next) => acc + next.value.market * (next.value.count || 1),
      0
    ) * currConvert;

  const totalCards = cards.reduce(
    (acc, next) => acc + (next.value.count || 1),
    0
  );

  const totalUniqueCards = cards.length;

  const totalDuplicates = cards.reduce(
    (acc, next) => acc + ((next.value.count || 1) - 1),
    0
  );

  // MIDDLE BAND

  sortCardQuery(cards, "value", false);
  const mostValuableCards = cards.slice(0, 5);

  const notUpdated = {
    count: 0,
    firstFive: []
  };

  for (let card of cards) {
    if (!card.set.id) {
      notUpdated.count++;
      if (notUpdated.firstFive.length < 5) notUpdated.firstFive.push(card);
    }
  }

  // BOTTOM BAND

  /*

  ##############
  
  Top band:
  Total value · Total cards · Unique cards · Duplicates

  Middle band (visual):
  Most valuable cards · Cards not updated

  Bottom band (context):
  Value by set (and top cards) · Binder breakdown · Recent activity 

  #############

  Total collection value (USD, converted client-side)
  Sum of value.market * value.count. This is the emotional hook. Pokémon collectors care about this number more than they admit.

  Bonus: show a tiny delta next to it
  “+ $42.13 since last update” or “−2.1% last 7 days” based on priceHistory deltas.

  Total cards owned
  Sum of value.count, not document count. This is “physical reality,” which collectors track instinctively.

  Unique cards
  Document count. This gives a clean “completion vs duplication” contrast.

  Duplicate count
  sum(value.count) − documentCount. This becomes surprisingly sticky UX-wise; people like knowing how much redundancy they’re sitting on.

  ##############

  Biggest movers (24h / 7d)
  Top 3 gainers and losers by percentage or absolute value:
    •	(latest − previous) * count
  This subtly nudges users to update prices more often without you nagging them.

  Most valuable cards
  Top 5 by value.market * value.count.
  Always include images. Humans like shiny rectangles.

  Collection volatility (simple version)
  You don’t need stats jargon. Something like:
  “7 cards changed by more than ±5% in the last update.”

  ################

  Value by set (top 3)
  Aggregate sum per set.name.
  Collectors think in sets. This feels “right” cognitively.

  Completion hint per set (soft, not authoritative)
  If you know set.cardCount:
    •	ownedUnique / set.cardCount
  Even if it’s imperfect (variants, promos, etc.), users love progress bars. Just label it clearly: “Base set coverage”.

  ##################

  Cards in binders vs unassigned
  Document count split:
    •	In a binder
    •	Not in any binder

  This mirrors the physical-world anxiety of “stuff not put away.”

  Top binder by value
  Aggregate value.market * count grouped by binder name.
  People name binders emotionally (“Favorites”, “Trade Bait”). This reinforces that.

  ################

  Last price update
  A simple timestamp:
  “Last price refresh: Aug 15, 2025”

  This contextualizes every other number on the page.

  Recently added cards
  Last 3–5 cards added. Not for metrics—this is memory reinforcement.

  Top 3 Stalest price / Top 3 newest update


  */

  // sortCardQuery(cards, sortType, isAsc);

  return res.render("collection/dashboard", {
    title: "Dashboard",
    totalValue,
    totalCards,
    totalUniqueCards,
    totalDuplicates,
    mostValuableCards,
    notUpdated,
    curr_convert: currConvert,
    curr
  });
};
