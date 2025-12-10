"use strict";

const pokemon = require("pokemontcgsdk");
pokemon.configure({ apikey: process.env.POKE_API_KEY });

const Card = require("../models/card");
const handle = require("../helpers/errorHandler");
const errs = require("../helpers/errs");
const updateMsgs = require("../helpers/updateMsgs");
const buildCard = require("../helpers/buildCard");
const getPriceType = require("../helpers/getPriceType");
const getRarityRating = require("../helpers/getRarityRating");
const getConversionRate = require("../helpers/getConversionRate");

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
  console.log("Updating price history...");
  const cardId = req.params.id;
  const pokemonId = req.body.cardId;
  const newDate = new Date().toLocaleDateString("en-US");

  const [errCard, card] = await handle(Card.findById(cardId).exec());
  console.log(`Card found in Mongo: ${card}`);
  if (errCard) return next(errCard);
  if (!card) return next(errs.cardNotFound());

  let marketVal;

  if (card.value.manualUpdate) {
    marketVal = +req.body.cardValue;
  } else {
    console.log(`Fetching card from TCGPlayer: ${pokemonId}`);
    const [errTcgCard, tcgCard] = await handle(pokemon.card.find(pokemonId));
    if (errTcgCard) return next(errTcgCard);
    if (!tcgCard) return next(errs.cardNotFound());

    console.log(`TCGPlayer card found: ${tcgCard}`);
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
  console.log(`Updated market value: ${marketVal}`);
  console.log("Saving card to mongo...");
  const [errCardSave, _] = await handle(card.save());
  console.log("Card saved.");
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
