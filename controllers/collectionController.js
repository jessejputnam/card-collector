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
  updateStaleUpdates,
  addSetOrdered,
  initCardSet
} = require("../utils/collectionControllerlib");
const { convertApiSearch, convertPricetype } = require("../utils/buildCard.js");
const apiCall = require("../api/pokePriceApi");
const { formatMoney, formatNum } = require("../utils/format");

/* 

- System Update
- Collection
- Filter
- By Set
- Dashboard

*/

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

// ################# COLLECTION ##################

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

// ################ FILTER ##################
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

// ######################### By Set #########################

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
    const newSetId = card.setId;
    if (!(setId in setOrder)) {
      setOrder[setId] = [card.meta.set.name, card.meta.set.releaseDate];
      setOrder[""];
    }
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

exports.update_price_api_all_cards_in_set_get = async (req, res, next) => {
  const curr = req.user.curr; // currency
  const userId = req.user._id;
  const setId = req.params.setId;

  if (!setId) return next(Error("Set ID is missing"));

  const [errCards, myCards] = await CardRepo.getAllCardsInSetNotUpdatedApi(
    userId,
    setId
  );
  if (errCards) return next(errCards);

  const myCardsWithApiResults = [];
  for (let myCard of myCards) {
    const cardName = myCard.name.trim().toLowerCase();
    const cardSetId = myCard.set.id;
    const priceType = myCard.value.priceType;
    const lang = myCard.lang;

    if (!cardSetId) continue;

    // API prices search
    const [searchErr, results] = await handle(
      apiCall.getCardsBySearch(cardName, cardSetId, lang)
    );
    if (searchErr) return next(searchErr);

    const data = results.data || [];

    const formattedResults = data
      .map((tcgCard) => {
        return {
          id: tcgCard.id,
          tcgPlayerId: tcgCard.tcgPlayerId,
          name: tcgCard.name,
          set: tcgCard.setName,
          priceVariants: tcgCard.prices?.variants
        };
      })
      .filter((card) =>
        card.priceVariants
          ? convertPricetype(priceType) in card.priceVariants
          : true
      );

    if (formattedResults.length === 1) {
      myCard.apiResult = formattedResults[0];
      myCardsWithApiResults.push(myCard);
    }
  }

  const [errConvert, currConvert] = await getConversionRate(curr);
  if (errConvert) return next(errConvert);

  return res.render("collection/update-set-price-api", {
    title: "Select cards to update",
    my_cards: myCardsWithApiResults
  });
};

// ####################### Dashboard ###########################

// Handle display dashboard on GET
exports.display_dashboard_get = async (req, res, next) => {
  const userId = req.user._id;
  const curr = req.user.curr;

  const [errCards, cards] = await CardRepo.getDashboardCards(userId);
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

  // Sets number of cards to display on dashboard rows
  const sampleSize = 7;

  // MIDDLE BAND

  sortCardQuery(cards, "value", false);
  const mostValuableCards = cards.slice(0, sampleSize);

  const notUpdated = {
    count: 0,
    sample: []
  };

  const manualUpdateCards = [];

  const cardsBySet = {};
  const cardSets = [];
  let recentUpdates = [];
  let staleUpdates = [];

  for (let card of cards) {
    // Updated Dates
    recentUpdates = updateRecentUpdates(recentUpdates, card, sampleSize);
    staleUpdates = updateStaleUpdates(staleUpdates, card, sampleSize);

    // Sets
    if (card.set.id) {
      if (!(card.set.name in cardsBySet)) initCardSet(cardsBySet, card);
      cardsBySet[card.set.name].ownedCards++;
      cardsBySet[card.set.name].ownedValue += card.value.market;
      cardsBySet[card.set.name].uniqueCards.add(card.setNumber);
      if (card.rarity.reverseHolo) cardsBySet[card.set.name].reverseHoloCards++;
    }

    // Manual value updates
    if (card.value.manualUpdate) {
      manualUpdateCards.push(card);
    } else {
      // Not updated to new API yet
      if (!card.oldId) {
        notUpdated.count++;
        if (notUpdated.sample.length < sampleSize) notUpdated.sample.push(card);
      }
    }
  }

  // Set ordering
  const keys = Object.keys(cardsBySet);
  for (let i = 0; i < keys.length; i++) {
    cardsBySet[keys[i]].name = keys[i];
    cardsBySet[keys[i]].uniqueCards = cardsBySet[keys[i]].uniqueCards.size;
    if (i == 0) cardSets.push(cardsBySet[keys[0]]);
    else addSetOrdered(cardSets, cardsBySet[keys[i]]);
  }

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
    formatNum,
    sampleSize
  };

  return res.render("collection/dashboard", payload);
};
