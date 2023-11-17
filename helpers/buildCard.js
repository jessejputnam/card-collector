const Card = require("../models/card");
const getRarityRating = require("../helpers/getRarityRating");

/**
 * Build TCG card from search
 * @param {object} tcgCard 
 * @param {string} userId 
 * @param {boolean} revHolo 
 * @param {number} marketVal 
 * @param {string} priceType 
 * @returns {Card}
 */
exports.searched = (tcgCard, userId, revHolo, marketVal, priceType) => {
  return new Card({
    id: tcgCard.id,
    userId,
    binder: null,
    custom: false,
    meta: {
      images: {
        small: tcgCard.images.small,
        large: tcgCard.images.large
      },
      rarity: {
        type: tcgCard.rarity || "Unknown",
        grade: getRarityRating[tcgCard.rarity || "Unknown"],
        reverseHolo: revHolo
      },
      supertype: tcgCard.supertype,
      subtypes: tcgCard.subtypes,
      set: {
        symbol: tcgCard.set.images.symbol,
        logo: tcgCard.set.images.logo,
        name: tcgCard.set.name,
        id: tcgCard.set.id,
        series: tcgCard.set.series,
        number: tcgCard.number,
        totalPrint: tcgCard.set.printedTotal,
        releaseDate: tcgCard.set.releaseDate
      }
    },
    pokemon: { name: tcgCard.name },
    value: {
      manualUpdate: false,
      market: marketVal,
      priceHistory: [[new Date().toLocaleDateString("en-US"), marketVal.toFixed(2)]],
      priceType: priceType,
    }
  })
}

/**
 * Return necessary info for custom card from req body
 * @param {*} body 
 * @returns 
 */
exports.info = (req) => {
  const q = req.body;

  return {
    id: `${q.set_id}-${q.set_number}`,
    name: q.name,
    supertype: q.supertype,
    market: +q.market,
    priceType: q.priceType,
    revHolo: q.priceType === "reverseHolofoil",
    img: q.img,
    rarity: q.rarity,
    set_name: q.set_name,
    set_symbol: q.set_symbol,
    set_series: q.set_series,
    set_id: q.set_id,
    set_releaseDate: q.set_releaseDate,
    set_number: q.set_number,
    set_printedTotal: q.set_printedTotal
  }
}

/**
 * Build a card from custom info
 * @param {*} card 
 * @returns Card
 */
exports.custom = (card, userId) => {
  return new Card({
    id: card.id,
    userId,
    binder: null,
    custom: true,
    meta: {
      images: {
        small: card.img || "/images/missingno.png",
        large: card.img || "/images/missingno.png"
      },
      rarity: {
        type: card.rarity,
        grade: getRarityRating[card.rarity],
        reverseHolo: card.revHolo
      },
      supertype: card.supertype,
      subtypes: [],
      set: {
        symbol: card.set_symbol,
        name: card.set_name,
        id: card.set_id,
        series: card.set_series,
        number: card.set_number,
        totalPrint: card.set_printedTotal,
        releaseDate: card.set_releaseDate
      }
    },
    pokemon: { name: card.name },
    value: {
      manualUpdate: true,
      market: card.market,
      priceHistory: [[new Date().toLocaleDateString("en-US"), card.market.toFixed(2)]],
      priceType: card.priceType
    }
  });
}

exports.edit = (card, req) => {
  const q = req.body;

  card.id = `${q.set_id}-${q.set_number}`;
  card.pokemon.name = q.name;
  card.meta.supertype = q.supertype;
  card.value.priceType = q.priceType;
  card.meta.rarity.reverseHolo = q.priceType === "reverseHolofoil";
  card.meta.images.small = q.img;
  card.meta.images.large = q.img;
  card.meta.rarity.type = q.rarity;
  card.meta.rarity.grade = getRarityRating[q.rarity];
  card.meta.set.name = q.set_name;
  card.meta.set.symbol = q.set_symbol;
  card.meta.set.series = q.set_series;
  card.meta.set.id = q.set_id;
  card.meta.set.releaseDate = q.set_releaseDate;
  card.meta.set.number = q.set_number;
  card.meta.set.totalPrint = q.set_printedTotal;
}