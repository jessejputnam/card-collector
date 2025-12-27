// import Card from "../models/card";
const Card = require("../models/card");
const Set = require("../models/set");
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
      setNumber: card.meta.setNumber,
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

// ######################################################
// ######################################################

exports.getCardDetail = async (cardId) => {
  const [errCard, card] = await handle(Card.findById(cardId).exec());
  if (errCard) return [errCard, null];
  if (!card) return next(errs.cardNotFound());

  const [errSet, set] = await handle(Set.findOne({ id: card.setId }).exec());
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

exports.updateCardId = async (cardId, newId) => {
  const [errOldCard, oldCard] = await handle(Card.findById(cardId).exec());
  if (errOldCard) return [errOldCard, null];
  if (!oldCard) return next(errs.cardNotFound());

  const update = { oldId: oldCard.id, id: newId };

  return await handle(Card.findByIdAndUpdate(cardId, update).exec());
};

exports.getAllUserCards = async (userId) => {
  return await handle(Card.find({ userId }).exec());
};

// ####### Binder Card Calls ##########

exports.removeDeletedBinder = async (userId, binder) => {
  return handle(Card.updateMany({ userId, binder }, { binder: null }));
};

exports.getBinderCards = async (userId, binder) => {
  return handle(Card.find({ userId: userId, binder: binder }).exec());
};
