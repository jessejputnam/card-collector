"use strict";

const pokemon = require("pokemontcgsdk");
pokemon.configure({ apikey: process.env.POKE_API_KEY });

// const Card = require("../models/card");
const CardRepo = require("../repositories/cardRepo");
const Set = require("../models/set");
const handle = require("../utils/errorHandler");
const errs = require("../utils/errs");
const updateMsgs = require("../utils/updateMsgs");
const buildCard = require("../utils/buildCard");
const getPriceType = require("../utils/getPriceType");
const getRarityRating = require("../utils/getRarityRating");
const getConversionRate = require("../utils/getConversionRate");

// Handle display card detail on GET
exports.display_card_get = async (req, res, next) => {
  const cardId = req.params.id;
  const update = req.query.update;
  const curr = req.user.curr;

  const [errCard, card] = await CardRepo.getCardDetail(cardId);
  // const [errCard, card] = await handle(Card.findById(cardId).exec());
  if (errCard) return next(errCard);
  // if (!card) return next(errs.cardNotFound());

  const [errConvert, currConvert] = await getConversionRate(curr);
  if (errConvert) return next(errConvert);
  const msg = !update ? null : updateMsgs[update];

  let sets = null;
  if (!card.set.id) {
    const [errSets, getSets] = await handle(Set.find().exec());
    if (errSets) return next(errSets);
    sets = getSets;
  }

  return res.render("card-detail", {
    title: `${card.name}`,
    card,
    curr_convert: currConvert,
    curr,
    binders: req.user.binders,
    msg,
    sets: card.set.id ? null : sets
  });
};

// ################# Update/Delete Cards ##################

// Handle change price update type
// TODO update to card repo for save
exports.change_update_type = async (req, res, next) => {
  const cardId = req.params.id;
  const isManual = req.body.isManual === "true";
  const [errCard, card] = await CardRepo.getCard(cardId);
  // const [errCard, card] = await handle(Card.findById(cardId).exec());
  if (errCard) return next(errCard);

  card.value.manualUpdate = isManual;
  const [err, _] = await handle(card.save());
  if (err) return next(err);

  return res.redirect(
    `/collection/${card._id}?update=${isManual ? "man" : "auto"}`
  );
};

// Handle update price history
// TODO update to card repo
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

// Handle delete card on GET
// TODO update to card repo
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

// Handle delete card on POST
// TODO update to card repo
exports.delete_card_post = async (req, res, next) => {
  const cardId = req.body.cardId;
  const [errDelCard, delCard] = await handle(
    Card.findByIdAndRemove(cardId).exec()
  );
  if (errDelCard) return next(errDelCard);

  return res.redirect("/collection/home");
};

// Handle select binder on POST
// TODO update to card repo
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
// TODO update to card repo
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
// TODO update to card repo
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

// // Handle update card set on GET
// exports.update_card_set_get = async (req, res, next) => {
//   const cardId = req.params.id;
//   const curr = req.user.curr;

//   const [setsErr, sets] = await handle(
//     CardSet.find({}, "name id releaseDate").sort({ releaseDate: -1 }).exec()
//   );
//   if (setsErr) return next(setsErr);

//   const [errCard, card] = await handle(Card.findById(cardId).exec());
//   if (errCard) return next(errCard);
//   if (!card) return next(errs.cardNotFound());

//   return res.render("update-card-set", {
//     title: `Update Card Set for ${card.pokemon.name}`,
//     card,
//     curr
//   });
// };

// Handle update card ID on GET
// TODO update to card repo
exports.update_card_id_get = async (req, res, next) => {
  const cardId = req.params.id;
  const curr = req.user.curr;

  const [errCard, card] = await handle(Card.findById(cardId).exec());
  if (errCard) return next(errCard);
  if (!card) return next(errs.cardNotFound());

  return res.render("update-card-id", {
    title: `Update Card ID for ${card.pokemon.name}`,
    card,
    curr
  });
};

// Handle update card set on POST
exports.update_card_set_post = async (req, res, next) => {
  const newSetId = req.body.newSetId;
  const cardId = req.body.objId;

  const [errCard, card] = await CardRepo.updateCardField(
    cardId,
    "setId",
    newSetId
  );
  if (errCard) return next(errCard);

  return res.redirect(`/collection/cards/${cardId}?update=set`);
};

// ################## Add Cards ###################
// TODO update to card repo
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
// TODO update to card repo
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
// TODO update to card repo
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
// TODO update to card repo
exports.edit_custom_card_post = async (req, res, next) => {
  const cardId = req.params.id;

  const [errCard, card] = await handle(Card.findById(cardId).exec());
  if (errCard) return next(errCard);

  buildCard.edit(card, req);

  const [err, _] = await handle(card.save());
  if (err) return next(err);

  return res.redirect(`/collection/${card._id}`);
};
