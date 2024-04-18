"use strict";

const pokemon = require("pokemontcgsdk");
pokemon.configure({ apikey: process.env.POKE_API_KEY });

const Card = require("../models/card");
const User = require("../models/user");
const handle = require("../helpers/errorHandler");
const errs = require("../helpers/errs");
const sort = require("../helpers/sort");
const filterElite = require("../helpers/filterElite");
const updateMsgs = require("../helpers/updateMsgs");
const buildCard = require("../helpers/buildCard");
const getPriceType = require("../helpers/getPriceType");
const getRarityRating = require("../helpers/getRarityRating");
const makeCSV = require("../helpers/makeCSV");
const getConversionRate = require("../helpers/getConversionRate");

/* 

  TABLE OF CONTENTS
    - View Cards
    - Update/Delete Cards
    - Add Cards
    - Sort Cards
    - Filter Cards
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

// Handle display card detail on GET
exports.display_card_get = async (req, res, next) => {
  const cardId = req.params.id;
  const update = req.query.update;
  const curr = req.user.curr;

  const [errCard, card] = await handle(Card.findById(cardId).exec());
  if (errCard) return next(errCard);
  if (!card) return next(errs.cardNotFound());

  const [errConvert, currConvert] = await getConversionRate(curr);
  if (errConvert) return next(errConvert);
  const msg = !update ? null : updateMsgs[update];

  return res.render("card-detail", {
    title: `${card.pokemon.name}`,
    card,
    curr_convert: currConvert,
    curr,
    binders: req.user.binders,
    msg
  });
};

// Handle display binders on GET
exports.display_binders_get = async (req, res, next) => {
  const binders = req.user.binders;
  const curr = req.user.curr;

  return res.render("binders", {
    title: "Binders",
    binders,
    curr
  });
};

// Handle add binders on POST
exports.add_binders_post = async (req, res, next) => {
  const userId = req.user._id;
  const newBinder = req.body.newBinder;

  const [errUser, user] = await handle(User.findById(userId));
  if (errUser) return next(errUser);

  user.binders.push(newBinder);
  const [errSave, save] = await handle(user.save());
  if (errSave) return next(errSave);
  return res.redirect("/collection/binders");
};

// Handle delete binder
exports.delete_binder_post = async (req, res, next) => {
  const userId = req.user._id;
  const binder = req.body.binder;
  const binders = req.user.binders.filter((b) => b !== binder);
  const [errUser, user] = await handle(
    User.findByIdAndUpdate(userId, { binders })
  );
  if (errUser) return next(errUser);

  const [errCards, cards] = await handle(
    Card.updateMany({ userId, binder }, { binder: null })
  );
  if (errCards) return next(errCards);

  return res.redirect("/collection/binders");
};

// Display binder on GET
exports.display_binder_get = async (req, res, next) => {
  const userId = req.user._id;
  const binder = req.params.id;
  const curr = req.user.curr;

  const [errCards, cards] = await handle(
    Card.find({ userId: userId, binder: binder }).exec()
  );
  if (errCards) return next(errCards);

  const [errConvert, currConvert] = await getConversionRate(curr);
  if (errConvert) return next(errConvert);

  const total =
    cards.reduce(
      (acc, next) => acc + next.value.market * (next.value.count || 1),
      0
    ) * currConvert;

  const cardsSorted = cards.sort(sort.byValueDesc);

  return res.render("binder", {
    title: binder,
    binder,
    curr_convert: currConvert,
    curr,
    cards: cardsSorted,
    total
  });
};

// ################# Update/Delete Cards ##################

// Handle change price update type
exports.change_update_type = async (req, res, next) => {
  const cardId = req.params.id;
  const isManual = req.body.isManual === "true";
  const [errCard, card] = await handle(Card.findById(cardId).exec());
  if (errCard) return next(errCard);

  card.value.manualUpdate = isManual;
  const [err, _] = await handle(card.save());
  if (err) return next(err);

  return res.redirect(
    `/collection/${card._id}?update=${isManual ? "man" : "auto"}`
  );
};

// Handle update price history
exports.update_price_history_post = async (req, res, next) => {
  const cardId = req.params.id;
  const pokemonId = req.body.cardId;
  const newDate = new Date().toLocaleDateString("en-US");

  const [errCard, card] = await handle(Card.findById(cardId).exec());
  if (errCard) return next(errCard);
  if (!card) return next(errs.cardNotFound());

  let marketVal;

  if (card.value.manualUpdate) {
    marketVal = +req.body.cardValue;
  } else {
    const [errTcgCard, tcgCard] = await handle(pokemon.card.find(pokemonId));
    if (errTcgCard) return next(errTcgCard);
    if (!tcgCard) return next(errs.cardNotFound());

    marketVal = tcgCard.tcgplayer.prices[card.value.priceType].market;
    if (!marketVal) return next(errs.priceNotFound);
  }

  card.value.market = marketVal;

  const mostRecentDate = card.value.priceHistory[0][0];

  let msg = "pricex";

  if (mostRecentDate !== newDate) {
    msg = "price";
    card.value.priceHistory.unshift([newDate, marketVal]);
  }

  const [errCardSave, _] = await handle(card.save());
  if (errCardSave) return next(errCardSave);

  return res.redirect(`/collection/${card._id}?update=${msg}`);
};

exports.delete_card_get = async (req, res, next) => {
  const cardId = req.params.id;
  const curr = req.user.curr;

  const [errCard, card] = await handle(Card.findById(cardId).exec());
  if (errCard) return next(errCard);
  if (!card) return next(errs.cardNotFound());

  return res.render("card-delete", {
    title: `Delete ${card.pokemon.name}`,
    cardId: card._id,
    curr,
    cardName: card.pokemon.name
  });
};

exports.delete_card_post = async (req, res, next) => {
  const cardId = req.body.cardId;
  const [errDelCard, delCard] = await handle(
    Card.findByIdAndRemove(cardId).exec()
  );
  if (errDelCard) return next(errDelCard);

  return res.redirect("/collection/home");
};

// Handle select binder on POST
exports.select_binder_post = async (req, res, next) => {
  const newBinder = req.body.binder;
  const cardId = req.body.objId;

  const [errCard, card] = await handle(
    Card.findByIdAndUpdate(cardId, {
      binder: newBinder == "none" ? null : newBinder
    }).exec()
  );
  if (errCard) return next(errCard);

  return res.redirect(`/collection/${cardId}?update=${newBinder}`);
};

// Handle edit rarity on POST
exports.edit_card_rarity = async (req, res, next) => {
  const cardId = req.body.objId;
  const newRarityRating = req.body.rarity;

  const [errCard, card] = await handle(
    Card.findByIdAndUpdate(cardId, {
      "meta.rarity.grade": newRarityRating
    }).exec()
  );

  if (errCard) return next(errCard);
  if (!card) return next(errs.cardNotFound());

  return res.redirect(`/collection/${cardId}?update=rarity`);
};

// Handle edit count on POST
exports.edit_card_count = async (req, res, next) => {
  const cardId = req.body.cardId;
  const newCount = req.body.count;

  const [errCard, card] = await handle(
    Card.findByIdAndUpdate(cardId, { "value.count": +newCount }).exec()
  );

  if (errCard) return next(errCard);
  if (!card) return next(errs.cardNotFound());

  return res.redirect(`/collection/${cardId}?update=count`);
};

// ################## Add Cards ###################

exports.add_card_post = async (req, res, next) => {
  const userId = req.user._id;
  const cardId = req.body.cardId;
  const revHolo = req.body.reverseHoloCheck === "true" ? true : false;
  const firstEd = req.body.firstEdCheck === "true" ? true : false;

  const [errTcgCard, tcgCard] = await handle(pokemon.card.find(cardId));
  if (errTcgCard) return next(errTcgCard);
  if (!tcgCard) return next(errs.cardNotFound());

  const prices = tcgCard?.tcgplayer?.prices;
  if (!prices) return errs.noTcgPrice();
  const priceType = getPriceType(revHolo, firstEd, prices);
  const marketVal = prices[priceType].market || prices[priceType].mid;

  const card = buildCard.searched(
    tcgCard,
    userId,
    revHolo,
    marketVal,
    priceType
  );

  const [errSave, _] = await handle(card.save());
  if (errSave) return next(errSave);

  return res.redirect(`/collection/sets#${card.meta.set.id}`);
};

// Handle display add custom card form on GET
exports.add_custom_card_get = (req, res, next) => {
  const rarities = Object.keys(getRarityRating);
  const curr = req.user.curr;

  return res.render("add-custom-card", {
    title: "Add New Card",
    rarities,
    curr
  });
};

// Handle add custom card on POST
exports.add_custom_card_post = async (req, res, next) => {
  const userId = req.user._id;

  const info = buildCard.info(req);
  const card = buildCard.custom(info, userId);

  const [err, _] = await handle(card.save());
  if (err) return next(err);

  return res.redirect(`/collection/${card._id}`);
};

// Handle display edit custom card form on GET
exports.edit_custom_card_get = async (req, res, next) => {
  const cardId = req.params.id;
  const rarities = Object.keys(getRarityRating);
  const curr = req.user.curr;

  const [err, card] = await handle(Card.findById(cardId).exec());
  if (err) return next(err);

  if (!card.custom) return next(new Error("Cannot edit non-custom cards"));

  return res.render("edit-custom-card", {
    title: `Edit ${card.pokemon.name}`,
    card,
    rarities,
    curr
  });
};

// Handle edit custom card on POST
exports.edit_custom_card_post = async (req, res, next) => {
  const cardId = req.params.id;

  const [errCard, card] = await handle(Card.findById(cardId).exec());
  if (errCard) return next(errCard);

  buildCard.edit(card, req);

  const [err, _] = await handle(card.save());
  if (err) return next(err);

  return res.redirect(`/collection/${card._id}`);
};

// ################# Sort Cards ###################

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
