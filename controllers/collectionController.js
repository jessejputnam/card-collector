const Card = require("../models/card");
const CardRepo = require("../repositories/cardRepo");
const User = require("../models/user");
const handle = require("../utils/errorHandler");
const sort = require("../utils/sort");
const makeCSV = require("../utils/makeCSV");
const getConversionRate = require("../utils/getConversionRate");
const filterQueries = require("../utils/filtration/filterQueries");
const { sortCardQuery } = require("../utils/sort");
const {
  updateRecentUpdates,
  updateStaleUpdates
} = require("../utils/collectionControllerlib");

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
  const formatMoney = (n) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(n);
  };
  const formatNum = (n) => {
    return new Intl.NumberFormat("en-US").format(n);
  };

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

  const manualUpdateCards = [];

  const cardsBySet = {};
  const cardSets = [];
  let recentUpdates = [];
  let staleUpdates = [];

  for (let card of cards) {
    // Updated Dates
    recentUpdates = updateRecentUpdates(recentUpdates, card);
    staleUpdates = updateStaleUpdates(staleUpdates, card);

    // Sets
    if (card.set.id) {
      if (!(card.set.name in cardsBySet)) {
        cardsBySet[card.set.name] = {
          setTotal: card.set.cardCount,
          symbolUrl: card.set.symbolUrl,
          ownedCards: 0,
          ownedValue: 0
        };
      }
      cardsBySet[card.set.name].ownedCards++;
      cardsBySet[card.set.name].ownedValue += card.value.market;
    }

    // Manual value updates
    if (card.value.manualUpdate) {
      manualUpdateCards.push(card);
    } else {
      // Not updated to new API yet
      if (!card.oldId) {
        notUpdated.count++;
        if (notUpdated.firstFive.length < 5) notUpdated.firstFive.push(card);
      }
    }
  }

  // Helper function fr set ordering
  const addSet = (arr, cur) => {
    for (let i = 0; i < arr.length; i++) {
      if (cur.ownedCards > arr[i].ownedCards) {
        arr.splice(i, 0, cur);
        return;
      }
    }
    arr.push(cur);
  };

  // Set ordering
  const keys = Object.keys(cardsBySet);
  for (let i = 0; i < keys.length; i++) {
    cardsBySet[keys[i]].name = keys[i];
    if (i == 0) cardSets.push(cardsBySet[keys[0]]);
    else addSet(cardSets, cardsBySet[keys[i]]);
  }
  /*

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

  ##################

  Cards in binders vs unassigned
  Document count split:
    •	In a binder
    •	Not in any binder

  This mirrors the physical-world anxiety of “stuff not put away.”

  Top binder by value
  Aggregate value.market * count grouped by binder name.
  People name binders emotionally (“Favorites”, “Trade Bait”). This reinforces that.

  */

  // sortCardQuery(cards, sortType, isAsc);
  const payload = {
    title: "Collection Overview",
    totalValue,
    totalCards,
    totalUniqueCards,
    totalDuplicates,
    mostValuableCards,
    manualUpdateCards,
    cardSets,
    notUpdated,
    recentUpdates,
    staleUpdates,
    curr_convert: currConvert,
    curr,
    formatMoney,
    formatNum
  };

  return res.render("collection/dashboard", payload);
};
