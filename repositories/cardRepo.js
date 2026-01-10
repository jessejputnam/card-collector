// import Card from "../models/card";
const Card = require("../models/card");
const CardSet = require("../models/set");
const handle = require("../utils/errorHandler");
const errs = require("../utils/errs");

function buildCardDetail(card, set) {
  return {
    _id: card._id,
    name: card.pokemon.name,
    id: card.id,
    oldId: card.oldId,
    userId: card.userId,
    custom: card.custom,
    meta: {
      rarity: card.meta.rarity,
      supertype: card.meta.supertype,
      stage: card.meta.stage,
      setNumber: card.meta.set.number,
      images: card.meta.images
    },
    set: {
      _id: set?._id,
      id: set?.id,
      name: set?.name,
      series: set?.series,
      releaseDate: set?.releaseDate,
      cardCount: set?.cardCount,
      symbolUrl: set?.symbolUrl
    },
    oldSetData: `${card.meta.set.name} [${card.meta.set.series}] - ${card.meta.set.releaseDate}`,
    value: card.value,
    binder: card.binder?.type
  };
}

function buildDashCard(card, sets) {
  const set = sets[card.setId];

  return {
    _id: card._id,
    name: card.pokemon.name,
    id: card.id,
    oldId: card.oldId,
    custom: card.custom,
    rarity: card.meta.rarity,
    setNumber: card.meta.set.number,
    image: card.meta.images.small,
    set: {
      id: set?.id,
      name: set?.name,
      series: set?.series,
      releaseDate: set?.releaseDate,
      cardCount: set?.cardCount,
      symbolUrl: set?.symbolUrl
    },
    value: card.value,
    binder: card.binder?.type
  };
}

// ######################################################
// ######################################################

exports.getCardDetail = async (cardId) => {
  const [errCard, card] = await handle(Card.findById(cardId).exec());
  if (errCard) return [errCard, null];
  if (!card) return next(errs.cardNotFound());

  const [errSet, set] = await handle(
    CardSet.findOne({ id: card.setId }).exec()
  );
  if (errSet) return [errSet, null];

  return [null, buildCardDetail(card, set)];
};

exports.getCard = async (cardId) => {
  const [errCard, card] = await handle(Card.findById(cardId).exec());
  if (errCard) return [errCard, null];
  if (!card) return next(errs.cardNotFound());
  return [null, card];
};

exports.updateCardField = async (cardId, field, newValue) => {
  const update = {};
  if (field === "binder") {
    newValue = newValue == "none" ? null : newValue;
  }
  update[field] = newValue;
  const [errCard, card] = await handle(
    Card.findByIdAndUpdate(cardId, update).exec()
  );
  if (errCard) return [errCard, null];
  if (!card) return next(errs.cardNotFound());
  return [null, card];
};

exports.updateCardFields = async (cardId, update) => {
  const [errCard, card] = await handle(
    Card.findByIdAndUpdate(cardId, update).exec()
  );
  if (errCard) return [errCard, null];
  if (!card) return next(errs.cardNotFound());
  return [null, card];
};

exports.updateCardPriceApi = async (cardId, newId, currentPrice) => {
  const [errOldCard, oldCard] = await handle(Card.findById(cardId).exec());
  if (errOldCard) return [errOldCard, null];
  if (!oldCard) return next(errs.cardNotFound());

  const newDate = new Date().toLocaleDateString("en-US");
  const priceHistory = oldCard.value.priceHistory;
  priceHistory.unshift([newDate, currentPrice]);

  const update = {
    oldId: oldCard.id,
    id: newId,
    "value.market": currentPrice,
    "value.priceHistory": priceHistory
  };

  return await handle(Card.findByIdAndUpdate(cardId, update).exec());
};

exports.getAllUserCards = async (userId) => {
  return await handle(Card.find({ userId }).exec());
};

exports.getDashboardCards = async (userId) => {
  const [err, cards] = await handle(Card.find({ userId }).exec());
  if (err) return [err, null];

  const [errSet, sets] = await handle(CardSet.find().exec());
  if (errSet) return [errSet, null];

  const setsObj = {};
  for (let set of sets) {
    setsObj[set.id] = set;
  }

  const dashCards = cards.map((x) => buildDashCard(x, setsObj));
  return dashCards;
};

// ####### Binder Card Calls ##########

exports.removeDeletedBinder = async (userId, binder) => {
  return handle(Card.updateMany({ userId, binder }, { binder: null }));
};

exports.getBinderCards = async (userId, binder) => {
  return handle(Card.find({ userId: userId, binder: binder }).exec());
};
