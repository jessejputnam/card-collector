"use strict";

const pokemon = require("pokemontcgsdk");
pokemon.configure({ apikey: process.env.POKE_API_KEY });

const Card = require("../models/card");
const User = require("../models/user");
const getRarityRating = require("../helpers/getRarityRating");

// Handle display all cards on GET
exports.display_collection_get = (req, res, next) => {
  User.findById(req.user._id)
    .populate("cards")
    .exec(function (err, user) {
      res.render("home", {
        title: "My Collection",
        card_list: user.cards.sort((a, b) => b.value.market - a.value.market)
      });
    });
};

// Handle display card detail on GET
exports.display_card_get = (req, res, next) => {
  const cardId = req.params.id;

  Card.findById(cardId).exec((err, result) => {
    if (err) return next(err);

    if (result === null) {
      const err = new Error("Collection card not found");
      err.status = 404;
      return next(err);
    }
    // Successful, so render
    res.render("card-detail", {
      title: `Collection: ${result.pokemon.name}`,
      card: result
    });
  });
};

// ################# Update/Delete Cards ##################

// Handle edit card detail on POST
exports.edit_card_post = (req, res, next) => {
  const cardId = req.params.id;
  const pokemonId = req.body.cardId;

  Card.findById(cardId).exec((err, result) => {
    if (err) return next(err);
    const card = result;

    if (!card) {
      const err = new Error("Card not found");
      err.status = 404;
      return next(err);
    }

    if (req.body.reverseHolo) {
      pokemon.card.find(pokemonId).then((tcgCard) => {
        const marketValue = tcgCard.tcgplayer.prices.reverseHolofoil.market;

        card.meta.rarity.reverseHolo = true;
        card.value.market = marketValue;
        card.value.priceType = "reverseHolofoil";
        card.value.priceHistory = [
          [new Date().toLocaleDateString("en-US"), marketValue]
        ];
        card.value.count = req.body.count;

        card.save((err) => {
          if (err) return next(err);

          res.redirect(`/collection/${card._id}`);
        });
      });
    } else {
      card.value.count = req.body.count;

      card.save((err) => {
        if (err) return next(err);

        res.redirect(`/collection/${card._id}`);
      });
    }
  });
};

exports.update_price_history_post = (req, res, next) => {
  const cardId = req.params.id;
  const pokemonId = req.body.cardId;

  Card.findById(cardId).exec((err, result) => {
    if (err) return next(err);
    const card = result;

    if (!card) {
      const err = new Error("Card not found");
      err.status = 404;
      return next(err);
    }

    pokemon.card.find(pokemonId).then((tcgCard) => {
      const newDate = new Date().toLocaleDateString("en-US");

      const marketValue = tcgCard.tcgplayer.prices[card.value.priceType].market;

      card.value.market = marketValue;

      if (card.value.priceHistory[0][0] === newDate) {
        card.value.priceHistory[0][1] === marketValue;
      } else {
        card.value.priceHistory.unshift([
          new Date().toLocaleDateString("en-US"),
          marketValue
        ]);
      }

      card.save((err) => {
        if (err) return next(err);

        res.redirect(`/collection/${card._id}`);
      });
    });
  });
};

exports.delete_card_get = (req, res, next) => {
  Card.findById(req.params.id).exec((err, result) => {
    if (err) return next(err);
    const card = result;

    if (!card) {
      const err = new Error("Card not found");
      err.status = 404;
      return next(err);
    }

    res.render("card-delete", {
      title: `Delete ${card.pokemon.name}`,
      cardId: card._id,
      cardName: card.pokemon.name
    });
  });
};

exports.delete_card_post = (req, res, next) => {
  const userId = req.user._id;
  const cardId = req.body.cardId;

  User.findById(userId, (err, result) => {
    if (err) return next(err);
    const user = result;
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      return next(err);
    }

    const newCollection = user.cards.filter((card) => String(card) !== cardId);
    const newBulk = user.bulk.length
      ? user.bulk.filter((card) => String(card) !== cardId)
      : [];

    user.cards = newCollection;
    user.bulk = newBulk;

    user.save((err) => {
      if (err) return next(err);

      Card.findByIdAndRemove(cardId, (err) => {
        if (err) return next(err);

        res.redirect("/collection/home");
      });
    });
  });
};

// ################## Add Cards ###################
exports.add_card_post = (req, res, next) => {
  const cardId = req.body.cardId;

  pokemon.card.find(cardId).then((card) => {
    let marketValue;
    let priceType;

    if (!card.tcgplayer) {
      marketValue = 0;
      priceType = null;
    } else if (card.tcgplayer.prices.holofoil) {
      marketValue =
        card.tcgplayer.prices.holofoil.market ||
        card.tcgplayer.prices.holofoil.mid;
      priceType = "holofoil";
    } else if (card.tcgplayer.prices.normal) {
      marketValue = card.tcgplayer.prices.normal.market;
      priceType = "normal";
    } else if (card.tcgplayer.prices.unlimited) {
      marketValue = card.tcgplayer.prices.unlimited.market;
      priceType = "unlimited";
    } else if (card.tcgplayer.prices.unlimitedHolofoil) {
      marketValue = card.tcgplayer.prices.unlimitedHolofoil.market;
      priceType = "unlimitedHolofoil";
    } else if (card.tcgplayer.prices["1stEditionHolofoil"]) {
      marketValue = card.tcgplayer.prices["1stEditionHolofoil"].market;
      priceType = "1stEditionHolofoil";
    } else if (card.tcgplayer.prices["1stEdition"]) {
      marketValue = card.tcgplayer.prices["1stEdition"].market;
      priceType = "1stEdition";
    } else if (card.tcgplayer.prices.reverseHolofoil) {
      marketValue = card.tcgplayer.prices.reverseHolofoil.market;
      priceType = "reverseHolofoil";
    } else {
      marketValue = 0;
      priceType = null;
    }

    const newCard = new Card({
      id: card.id,

      meta: {
        images: {
          small: card.images.small,
          large: card.images.large
        },
        rarity: {
          type: card.rarity,
          grade: getRarityRating[card.rarity]
        },
        supertype: card.supertype,
        subtypes: card.subtypes,
        set: {
          symbol: card.set.images.symbol,
          logo: card.set.images.logo,
          name: card.set.name,
          id: card.set.id,
          series: card.set.series,
          number: card.number,
          totalPrint: card.set.printedTotal,
          releaseDate: card.set.releaseDate
        }
      },

      pokemon: {
        name: card.name,
        natDex: card.nationalPokedexNumbers[0]
      },

      value: {
        market: marketValue,
        priceHistory: [
          [new Date().toLocaleDateString("en-US"), marketValue.toFixed(2)]
        ],
        priceType: priceType,
        count: 1
      }
    });

    newCard.save((err) => {
      if (err) return next(err);

      User.findByIdAndUpdate(
        req.user._id,
        { $push: { cards: newCard._id } },
        (err) => {
          if (err) return next(err);

          res.redirect("/collection/home");
        }
      );
    });
  });
};

exports.add_bulk_post = (req, res, next) => {
  Card.findOne({ id: req.body.cardId }, function (err, result) {
    if (err) return next(err);
    const card_id = result._id;
    const card = result;
    console.log("CARD", card);
    console.log("CARDID", card.id);
    console.log("CARD-ID", card_id);
    console.log("CARD._ID", card._id);

    if (!card) {
      const err = new Error("Card not found");
      err.status = 404;
      return next(err);
    }

    User.findById(req.user._id, (err, result) => {
      if (err) return next(err);
      const user = result;
      if (!user) {
        const err = new Error("User not found");
        err.status = 404;
        return next(err);
      }
      user.bulk.push(card_id);

      user.save((err) => {
        if (err) return next(err);

        res.redirect("/collection/home");
      });
    });
  });
};

// ################# Sort Cards ###################

// ################ Filter Cards ##################
// Handle display cards by set on GET
exports.display_filter_by_set_get = (req, res, next) => {
  // Finf User
  User.findById(req.user._id)
    .populate("cards")
    .exec((err, result) => {
      if (err) return next(err);
      const user = result;

      if (!user) {
        const err = new Error("User not found");
        err.status = 404;
        return next(err);
      }

      // Find which sets exist in collection
      let setOrderLength = 0;
      const setOrder = {};
      user.cards.forEach((card) => {
        const setId = card.meta.set.id;

        if (!(setId in setOrder)) {
          setOrder[setId] = true;
          setOrderLength++;
        }
      });

      pokemon.set
        .all()
        .then((sets) => {
          let n = 0;

          // Search through all sets and get the order of collection sets
          sets.forEach((set) => {
            if (set.id in setOrder) {
              setOrder[set.id] = n;
              n++;
            }
          });

          // Organize the cards into the sets by date
          const orderedSets = new Array(setOrderLength);
          user.cards.forEach((card) => {
            const setId = card.meta.set.id;
            if (!orderedSets[setOrder[setId]]) {
              orderedSets[setOrder[setId]] = [];
            }
            orderedSets[setOrder[setId]].push(card);
          });

          orderedSets.reverse();
          const orderedSetsByNum = [];
          orderedSets.forEach((set) => {
            set.sort((a, b) => {
              const numA = Number(
                a.meta.set.number
                  .split("")
                  .filter((x) => !!+x || x === "0")
                  .join("")
              );
              const numB = Number(
                b.meta.set.number
                  .split("")
                  .filter((x) => !!+x || x === "0")
                  .join("")
              );
              return numA - numB;
            });

            orderedSetsByNum.push(set);
          });

          res.render("sets-collection", {
            title: "Set Collection",
            list_sets: orderedSetsByNum
          });
        })
        .catch((err) => {
          return next(err);
        });
    });
};

// [
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532cbb68cf091d46bc60d0"),
//       id: 'bw9-27',
//       __v: 0
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532c3668cf091d46bc6079"),
//       id: 'sm9-118',
//       __v: 0
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532c4d68cf091d46bc6084"),
//       id: 'sm115-13',
//       __v: 1
//     }
//   ],
//   <1 empty item>,
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63530d1f7ee6ec5a7932dced"),
//       id: 'sm12-237',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532b6368cf091d46bc6015"),
//       id: 'sm12-62',
//       __v: 1
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532bf468cf091d46bc6056"),
//       id: 'sm12-56',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532c0968cf091d46bc6061"),
//       id: 'sm12-52',
//       __v: 1
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63530e047ee6ec5a7932dd3e"),
//       id: 'swshp-SWSH087',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532324a786e93d17230d67"),
//       id: 'swshp-SWSH229',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532375a786e93d17230d96"),
//       id: 'swshp-SWSH105',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635327dd68cf091d46bc5eb3"),
//       id: 'swshp-SWSH144',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635327f168cf091d46bc5ec9"),
//       id: 'swshp-SWSH136',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353281068cf091d46bc5edf"),
//       id: 'swshp-SWSH137',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635328cd68cf091d46bc5f21"),
//       id: 'swshp-SWSH138',
//       __v: 0
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532beb68cf091d46bc604b"),
//       id: 'swsh2-91',
//       __v: 0
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353283868cf091d46bc5f00"),
//       id: 'swsh3-53',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353285f68cf091d46bc5f16"),
//       id: 'swsh3-111',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532bcd68cf091d46bc6039"),
//       id: 'swsh3-133',
//       __v: 1
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635339dfcfb3c41ed6bbeaee"),
//       id: 'swsh3-127',
//       __v: 0
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353295468cf091d46bc5f42"),
//       id: 'swsh4-15',
//       __v: 0
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63530df07ee6ec5a7932dd28"),
//       id: 'swsh45-10',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63530dfa7ee6ec5a7932dd33"),
//       id: 'swsh45-55',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635323e3a786e93d17230dcd"),
//       id: 'swsh45-18',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353299b68cf091d46bc5f84"),
//       id: 'swsh45-48',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532aec68cf091d46bc5fbd"),
//       id: 'swsh45-33',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532c8c68cf091d46bc60ab"),
//       id: 'swsh45-30',
//       __v: 1
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63530dd17ee6ec5a7932dd12"),
//       id: 'swsh45sv-SV113',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353233ea786e93d17230d72"),
//       id: 'swsh45sv-SV120',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353277a68cf091d46bc5e7c"),
//       id: 'swsh45sv-SV034',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353278568cf091d46bc5e87"),
//       id: 'swsh45sv-SV038',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635327cc68cf091d46bc5e9d"),
//       id: 'swsh45sv-SV059',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635327d468cf091d46bc5ea8"),
//       id: 'swsh45sv-SV028',
//       __v: 0
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63530dc77ee6ec5a7932dd07"),
//       id: 'swsh5-86',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353284d68cf091d46bc5f0b"),
//       id: 'swsh5-33',
//       __v: 0
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532380a786e93d17230da1"),
//       id: 'swsh7-7',
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532400a786e93d17230de6"),
//       id: 'swsh7-91',
//       createdAt: 2022-10-21T22:58:08.200Z,
//       updatedAt: 2022-10-21T22:58:08.200Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353281f68cf091d46bc5eea"),
//       id: 'swsh7-93',
//       createdAt: 2022-10-21T23:15:43.414Z,
//       updatedAt: 2022-10-21T23:15:43.414Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635328d868cf091d46bc5f2c"),
//       id: 'swsh7-82',
//       createdAt: 2022-10-21T23:18:48.167Z,
//       updatedAt: 2022-10-21T23:18:48.167Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353294568cf091d46bc5f37"),
//       id: 'swsh7-63',
//       createdAt: 2022-10-21T23:20:37.576Z,
//       updatedAt: 2022-10-21T23:20:37.576Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635386d7cfb3c41ed6bbeb50"),
//       id: 'swsh7-131',
//       createdAt: 2022-10-22T05:59:51.532Z,
//       updatedAt: 2022-10-22T06:00:04.122Z,
//       __v: 1
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63530de57ee6ec5a7932dd1d"),
//       id: 'cel25-7',
//       createdAt: 2022-10-21T21:23:49.901Z,
//       updatedAt: 2022-10-21T21:23:49.901Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532352a786e93d17230d80"),
//       id: 'cel25-5',
//       createdAt: 2022-10-21T22:55:14.345Z,
//       updatedAt: 2022-10-21T22:55:14.345Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635323bea786e93d17230dac"),
//       id: 'cel25-8',
//       createdAt: 2022-10-21T22:57:02.582Z,
//       updatedAt: 2022-10-21T22:57:02.582Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635323c8a786e93d17230db7"),
//       id: 'cel25-6',
//       createdAt: 2022-10-21T22:57:12.405Z,
//       updatedAt: 2022-10-21T22:57:12.405Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353298468cf091d46bc5f6e"),
//       id: 'cel25-3',
//       createdAt: 2022-10-21T23:21:40.787Z,
//       updatedAt: 2022-10-21T23:21:40.787Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353299068cf091d46bc5f79"),
//       id: 'cel25-2',
//       createdAt: 2022-10-21T23:21:52.286Z,
//       updatedAt: 2022-10-21T23:21:52.286Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532acb68cf091d46bc5fa4"),
//       id: 'cel25-1',
//       createdAt: 2022-10-21T23:27:07.643Z,
//       updatedAt: 2022-10-21T23:27:07.643Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532ad768cf091d46bc5faf"),
//       id: 'cel25-21',
//       createdAt: 2022-10-21T23:27:19.343Z,
//       updatedAt: 2022-10-21T23:27:19.343Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532b0668cf091d46bc5fd3"),
//       id: 'cel25-17',
//       createdAt: 2022-10-21T23:28:06.860Z,
//       updatedAt: 2022-10-21T23:28:06.860Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532b2d68cf091d46bc5fe9"),
//       id: 'cel25-10',
//       createdAt: 2022-10-21T23:28:45.363Z,
//       updatedAt: 2022-10-21T23:28:45.363Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532b3668cf091d46bc5ff4"),
//       id: 'cel25-4',
//       createdAt: 2022-10-21T23:28:54.514Z,
//       updatedAt: 2022-10-21T23:28:54.514Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532b4068cf091d46bc5fff"),
//       id: 'cel25-20',
//       createdAt: 2022-10-21T23:29:04.643Z,
//       updatedAt: 2022-10-21T23:29:04.643Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532b4868cf091d46bc600a"),
//       id: 'cel25-12',
//       createdAt: 2022-10-21T23:29:12.404Z,
//       updatedAt: 2022-10-21T23:29:12.404Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63533b06cfb3c41ed6bbeb06"),
//       id: 'cel25-18',
//       createdAt: 2022-10-22T00:36:22.449Z,
//       updatedAt: 2022-10-22T00:36:22.449Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63533b6acfb3c41ed6bbeb11"),
//       id: 'cel25-15',
//       createdAt: 2022-10-22T00:38:02.986Z,
//       updatedAt: 2022-10-22T00:38:02.986Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635346ddcfb3c41ed6bbeb1c"),
//       id: 'cel25-19',
//       createdAt: 2022-10-22T01:26:53.999Z,
//       updatedAt: 2022-10-22T01:26:53.999Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635346fecfb3c41ed6bbeb27"),
//       id: 'cel25-22',
//       createdAt: 2022-10-22T01:27:26.213Z,
//       updatedAt: 2022-10-22T01:27:26.213Z,
//       __v: 0
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353277268cf091d46bc5e71"),
//       id: 'cel25c-2_A',
//       createdAt: 2022-10-21T23:12:50.617Z,
//       updatedAt: 2022-10-21T23:12:50.617Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635327e768cf091d46bc5ebe"),
//       id: 'cel25c-8_A',
//       createdAt: 2022-10-21T23:14:47.113Z,
//       updatedAt: 2022-10-21T23:14:47.113Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353296068cf091d46bc5f4d"),
//       id: 'cel25c-15_A4',
//       createdAt: 2022-10-21T23:21:04.059Z,
//       updatedAt: 2022-10-21T23:21:04.059Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63533ae8cfb3c41ed6bbeafb"),
//       id: 'cel25c-107_A',
//       createdAt: 2022-10-22T00:35:52.038Z,
//       updatedAt: 2022-10-22T00:35:52.038Z,
//       __v: 0
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635337c2cfb3c41ed6bbeac6"),
//       id: 'swsh8-197',
//       createdAt: 2022-10-22T00:22:27.000Z,
//       updatedAt: 2022-10-22T00:22:38.550Z,
//       __v: 1
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353384ecfb3c41ed6bbeada"),
//       id: 'swsh8-120',
//       createdAt: 2022-10-22T00:24:46.868Z,
//       updatedAt: 2022-10-22T00:24:46.868Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63538482cfb3c41ed6bbeb39"),
//       id: 'swsh8-67',
//       createdAt: 2022-10-22T05:49:54.233Z,
//       updatedAt: 2022-10-22T05:49:54.233Z,
//       __v: 0
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353280568cf091d46bc5ed4"),
//       id: 'swsh9-121',
//       createdAt: 2022-10-21T23:15:17.902Z,
//       updatedAt: 2022-10-21T23:15:17.902Z,
//       __v: 0
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63530d2a7ee6ec5a7932dcf8"),
//       id: 'swsh9tg-TG18',
//       createdAt: 2022-10-21T21:20:42.531Z,
//       updatedAt: 2022-10-21T21:20:42.531Z,
//       __v: 0
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532364a786e93d17230d8b"),
//       id: 'swsh10-18',
//       createdAt: 2022-10-21T22:55:32.095Z,
//       updatedAt: 2022-10-21T22:55:32.095Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635323d7a786e93d17230dc2"),
//       id: 'swsh10-17',
//       createdAt: 2022-10-21T22:57:27.163Z,
//       updatedAt: 2022-10-21T22:57:27.163Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635327c268cf091d46bc5e92"),
//       id: 'swsh10-68',
//       createdAt: 2022-10-21T23:14:10.328Z,
//       updatedAt: 2022-10-21T23:14:10.328Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353296c68cf091d46bc5f58"),
//       id: 'swsh10-82',
//       createdAt: 2022-10-21T23:21:16.572Z,
//       updatedAt: 2022-10-21T23:21:16.572Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353297c68cf091d46bc5f63"),
//       id: 'swsh10-57',
//       createdAt: 2022-10-21T23:21:32.015Z,
//       updatedAt: 2022-10-21T23:21:32.015Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532bac68cf091d46bc6027"),
//       id: 'swsh10-130',
//       createdAt: 2022-10-21T23:30:52.815Z,
//       updatedAt: 2022-10-21T23:31:07.434Z,
//       __v: 1
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532ca368cf091d46bc60bd"),
//       id: 'swsh10-66',
//       createdAt: 2022-10-21T23:34:59.107Z,
//       updatedAt: 2022-10-21T23:35:06.529Z,
//       __v: 1
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532cdd68cf091d46bc60ed"),
//       id: 'swsh10-118',
//       createdAt: 2022-10-21T23:35:57.250Z,
//       updatedAt: 2022-10-21T23:35:57.250Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532cff68cf091d46bc610a"),
//       id: 'swsh10-75',
//       createdAt: 2022-10-21T23:36:31.586Z,
//       updatedAt: 2022-10-21T23:36:31.586Z,
//       __v: 0
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353240ea786e93d17230df1"),
//       id: 'pgo-47',
//       createdAt: 2022-10-21T22:58:22.036Z,
//       updatedAt: 2022-10-21T22:58:22.036Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532af668cf091d46bc5fc8"),
//       id: 'pgo-12',
//       createdAt: 2022-10-21T23:27:50.620Z,
//       updatedAt: 2022-10-21T23:27:50.620Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532b2168cf091d46bc5fde"),
//       id: 'pgo-22',
//       createdAt: 2022-10-21T23:28:33.184Z,
//       updatedAt: 2022-10-21T23:28:33.184Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353364fcfb3c41ed6bbeab7"),
//       id: 'pgo-23',
//       createdAt: 2022-10-22T00:16:15.357Z,
//       updatedAt: 2022-10-22T00:16:15.357Z,
//       __v: 0
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("635323f3a786e93d17230ddb"),
//       id: 'swsh11-27',
//       createdAt: 2022-10-21T22:57:55.873Z,
//       updatedAt: 2022-10-21T22:57:55.873Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("6353282c68cf091d46bc5ef5"),
//       id: 'swsh11-76',
//       createdAt: 2022-10-21T23:15:56.647Z,
//       updatedAt: 2022-10-21T23:15:56.647Z,
//       __v: 0
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532c6c68cf091d46bc6099"),
//       id: 'swsh11-62',
//       createdAt: 2022-10-21T23:34:04.527Z,
//       updatedAt: 2022-10-21T23:34:10.966Z,
//       __v: 1
//     },
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63532cc768cf091d46bc60db"),
//       id: 'swsh11-4',
//       createdAt: 2022-10-21T23:35:35.397Z,
//       updatedAt: 2022-10-21T23:35:41.889Z,
//       __v: 1
//     }
//   ],
//   [
//     {
//       meta: [Object],
//       pokemon: [Object],
//       value: [Object],
//       _id: new ObjectId("63530d127ee6ec5a7932dce2"),
//       id: 'swsh11tg-TG03',
//       createdAt: 2022-10-21T21:20:18.850Z,
//       updatedAt: 2022-10-21T21:20:18.850Z,
//       __v: 0
//     }
//   ]
// ]
