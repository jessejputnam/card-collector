// import Card from "../models/card";
const Card = require("../models/card");
const CardSet = require("../models/set");
const handle = require("../utils/errorHandler");
const errs = require("../utils/errs");
const { buildCardDetail, buildDashCard } = require("../utils/repoHelpers");

// #################### Get Cards ############################

exports.getCardDetail = async (cardId, userId) => {
  const [errCard, card] = await handle(Card.findById(cardId).exec());
  if (errCard) return [errCard, null];
  if (!card) return [errs.cardNotFound(), null];
  if (!card.userId.equals(userId)) return [errs.invalidUserId(), null];

  const [errSet, set] = await handle(
    CardSet.findOne({ id: card.setId }).exec()
  );
  if (errSet) return [errSet, null];

  return [null, buildCardDetail(card, set)];
};

exports.getCard = async (cardId, userId) => {
  const [errCard, card] = await handle(Card.findById(cardId).exec());
  if (errCard) return [errCard, null];
  if (!card) return [errs.cardNotFound(), null];
  if (!card.userId.equals(userId)) return [errs.invalidUserId(), null];
  return [null, card];
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
    setsObj[set.tcgPlayerNumericId] = set;
  }
  const dashCards = cards.map((x) => buildDashCard(x, setsObj));
  return [null, dashCards];
};

// exports.getAllCardsInSet = async (userId, setId) => {
//   const [err, cards] = await handle(Card.find({ userId, setId }).exec());
// };

exports.getAllCardsInSetNotUpdatedApi = async (userId, setId) => {
  if (!setId || !userId) return [new Error("Missing required values"), null];
  const [err, cards] = await handle(
    Card.find({
      userId,
      setTcgPlayerNumericId: setId,
      oldId: { $exists: false }
    }).exec()
  );
  if (err) return [err, null];

  return [null, cards.map((card) => buildCardDetail(card))];
};

// #################### Update Cards ############################

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
  if (!card) return [errs.cardNotFound(), null];
  return [null, card];
};

exports.updateCardFields = async (cardId, update) => {
  const [errCard, card] = await handle(
    Card.findByIdAndUpdate(cardId, update).exec()
  );
  if (errCard) return [errCard, null];
  if (!card) return [errs.cardNotFound(), null];
  return [null, card];
};

exports.updateCardPriceApi = async (cardId, newId, currentPrice) => {
  const [errOldCard, oldCard] = await handle(Card.findById(cardId).exec());
  if (errOldCard) return [errOldCard, null];
  if (!oldCard) return [errs.cardNotFound(), null];

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

exports.updateCardPriceApiIdOnly = async (cardId, newId) => {
  const [errOldCard, oldCard] = await handle(Card.findById(cardId).exec());
  if (errOldCard) return [errOldCard, null];
  if (!oldCard) return [errs.cardNotFound(), null];

  const update = { oldId: oldCard.id, id: newId };

  return await handle(Card.findByIdAndUpdate(cardId, update).exec());
};

exports.deleteCard = async (cardId) => {
  return handle(Card.findByIdAndRemove(cardId).exec());
};

// #################### Update Binder Cards ############################

exports.updateCardBinder = async (cardId, newBinder, userId) => {
  if (!userId) return [errs.invalidUserId(), null];
  const binder = newBinder == "none" ? null : newBinder;
  const updated = await Card.findOneAndUpdate(
    {
      _id: cardId,
      userId: userId
    },
    {
      $set: { binder: binder }
    },
    {
      new: true
    }
  );

  const err = updated ? null : errs.invalidUserId();
  const result = updated;

  return [err, result];
  // return handle(Card.findByIdAndUpdate(cardId, { binder }).exec());
};

exports.removeDeletedBinder = async (userId, binder) => {
  return handle(Card.updateMany({ userId, binder }, { binder: null }));
};

exports.getBinderCards = async (userId, binder) => {
  return handle(Card.find({ userId: userId, binder: binder }).exec());
};

// #################### Add Cards ############################

/**
 * Build a card from custom info
 * @param {*} card
 * @returns Card
 */
exports.addCustomCard = async (cardData, userId) => {
  const card = new Card({
    id: cardData.id,
    userId,
    binder: null,
    custom: true,
    meta: {
      images: {
        small: cardData.img || "/images/missingno.png",
        large: cardData.img || "/images/missingno.png"
      },
      rarity: {
        type: cardData.rarity,
        grade: getRarityRating[cardData.rarity],
        reverseHolo: cardData.revHolo
      },
      supertype: cardData.supertype,
      subtypes: [],
      set: {
        symbol: cardData.set_symbol,
        name: cardData.set_name,
        id: cardData.set_id,
        series: cardData.set_series,
        number: cardData.set_number,
        totalPrint: cardData.set_printedTotal,
        releaseDate: cardData.set_releaseDate
      }
    },
    pokemon: { name: cardData.name },
    value: {
      manualUpdate: true,
      market: cardData.market,
      priceHistory: [
        [new Date().toLocaleDateString("en-US"), cardData.market.toFixed(2)]
      ],
      priceType: cardData.priceType
    }
  });

  return handle(card.save());
};
