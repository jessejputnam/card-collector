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
 * Build a card from custom info
 * @param {*} card 
 * @returns Card
 */
exports.custom = (card, userId) => {
  return new Card({
    id: card.id,
    userId,
    binder: null,
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
      subtypes: null,
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