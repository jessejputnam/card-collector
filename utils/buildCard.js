const Card = require("../models/card");
const getRarityRating = require("../utils/getRarityRating");

/*

prices.market
prices.variants["Holofoil"]
prices.variants["Normal"]
prices.variants["Unlimited Holofoil"]
prices.variants["Unlimited"]
prices.variants["1st Edition"]
prices.variants["1st Edition Holofoil"]
prices.variants["Reverse Holofoil"]



- holofoil
- normal
- unlimitedHolofoil
- unlimited
- 1stEdition
- 1stEditionHolofoil
- reverseHolofoil

 */

exports.convertPricetype = (priceType) => {
  if (priceType == "holofoil") return "Holofoil";
  if (priceType == "Holofoil") return "holofoil";
  if (priceType == "normal") return "Normal";
  if (priceType == "Normal") return "normal";
  if (priceType == "unlimitedHolofoil") return "Unlimited Holofoil";
  if (priceType == "Unlimited Holofoil") return "unlimitedHolofoil";
  if (priceType == "unlimited") return "Unlimited";
  if (priceType == "Unlimited") return "unlimited";
  if (priceType == "1stEdition") return "1st Edition";
  if (priceType == "1st Edition") return "1stEdition";
  if (priceType == "1stEditionHolofoil") return "1st Edition Holofoil";
  if (priceType == "1st Edition Holofoil") return "1stEditionHolofoil";
  if (priceType == "reverseHolofoil") return "Reverse Holofoil";
  if (priceType == "Reverse Holofoil") return "reverseHolofoil";
  return "n/a";
};

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
      priceHistory: [
        [new Date().toLocaleDateString("en-US"), marketVal.toFixed(2)]
      ],
      priceType: priceType
    }
  });
};

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
  };
};

exports.edit = (card, req) => {
  const q = req.body;
  console.log(q);

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
  card.isJapanese = q.isJapanese === "true";
};

/*

prices.market
prices.variants["Holofoil"]
prices.variants["Normal"]
prices.variants["Unlimited Holofoil"]
prices.variants["Unlimited"]
prices.variants["1st Edition"]
prices.variants["1st Edition Holofoil"]
prices.variants["Reverse Holofoil"]



- holofoil
- normal
- unlimitedHolofoil
- unlimited
- 1stEdition
- 1stEditionHolofoil
- reverseHolofoil

 */

exports.convertApiSearch = (card, setReleases) => {
  const newCard = {
    id: card.id,
    tcgPlayerId: card.tcgPlayerId,

    meta: {
      images: {
        small: card.imageUrl,
        large: card.imageUrl
      },
      rarity: {
        type: card.rarity,
        reverseHolo: false
      }
    },

    pokemon: {
      name: card.name
    },

    set: {
      name: card.setName,
      id: card.setId,
      number: card.cardNumber,
      totalPrint: card.totalSetNumber,
      releaseDate: setReleases ? setReleases[card.setId] : null
    },

    value: {
      market: card.prices.market,
      priceType: card.primaryPrinting
    },

    hasReverseHolo: card.prices?.variants?.["Reverse Holofoil"] ? true : false,
    has1stEdition:
      card.prices?.variants?.["1st Edition Holofoil"] ||
      card.prices?.variants?.["1st Edition"]
        ? true
        : false,

    priceVariants: card.prices?.variants
  };

  return newCard;
};
