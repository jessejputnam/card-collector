"use strict";

const pokemon = require("pokemontcgsdk");
pokemon.configure({ apikey: process.env.POKE_API_KEY });

const Card = require("../models/card");
const User = require("../models/user");
const getRarityRating = require("../helpers/getRarityRating");

/* 

  TABLE OF CONTENTS
    - View Cards
    - Update/Delete Cards
    - Add Cards
    - Sort Cards
    - Filter Cards

*/

// ################# View Cards ##################

// Handle display collection on GET
exports.display_collection_get = (req, res, next) => {
  User.findById(req.user._id)
    .populate("cards")
    .exec(function (err, user) {
      if (err) return next(err);

      const pokemonCards = user.cards.filter(
        (card) => card.meta.supertype === "Pokémon" || card.value.market > 1
      );

      const cards = pokemonCards.sort(
        (a, b) => b.value.market - a.value.market
      );

      const total = cards.reduce((acc, next) => {
        return acc + next.value.market;
      }, 0);

      res.render("home", {
        title: "My Collection",
        card_list: cards,
        total: total
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

// Handle display prize binder on GET
exports.display_prize_get = (req, res, next) => {
  const userId = req.user._id;

  User.findById(userId)
    .populate("prize")
    .exec((err, result) => {
      if (err) return next(err);

      if (!result) {
        const err = new Error("Could not find user");
        err.status = 404;
        return next(err);
      }

      const user = result;

      const ultraRare = user.prize.filter((card) => {
        return card.meta.rarity.grade < 2;
      });
      const rare = user.prize.filter((card) => {
        return card.meta.rarity.grade > 1;
      });

      ultraRare.sort((a, b) => {
        return b.value.market - a.value.market;
      });
      rare.sort((a, b) => {
        return b.value.market - a.value.market;
      });

      res.render("binder-prize", {
        title: "Prize Binder",
        cards_ultra: ultraRare,
        cards_rare: rare
      });
    });
};

// Handle display bulk on GET
exports.display_bulk_get = (req, res, next) => {
  User.findById(req.user._id)
    .populate("bulk")
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
      user.bulk.forEach((card) => {
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
          user.bulk.forEach((card) => {
            const setId = card.meta.set.id;
            if (!orderedSets[setOrder[setId]]) {
              orderedSets[setOrder[setId]] = [];
            }
            orderedSets[setOrder[setId]].push(card);
          });

          // reverse to most recent first
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

          res.render("bulk", {
            title: "Bulk Inventory",
            list_sets: orderedSetsByNum
          });
        })
        .catch((err) => {
          return next(err);
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

    if (req.body.reverseHolo === "true") {
      pokemon.card
        .find(pokemonId)
        .then((tcgCard) => {
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
        })
        .catch((err) => {
          return next(err);
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

// Handle update price history
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

    pokemon.card
      .find(pokemonId)
      .then((tcgCard) => {
        const newDate = new Date().toLocaleDateString("en-US");

        const marketValue =
          tcgCard.tcgplayer.prices[card.value.priceType].market;

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
      })
      .catch((err) => {
        return next(err);
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

// Handle select binder on POST
exports.select_binder_post = (req, res, next) => {
  User.findById(req.user._id, (err, result) => {
    if (err) return next(err);

    const binder = req.body.binder;
    const cardId = req.body.objId;

    const user = result;
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      return next(err);
    }

    let prizeBinder = user.prize.filter((card) => String(card) !== cardId);
    let eliteBinder = user.elite.filter((card) => String(card) !== cardId);

    if (binder === "prize") {
      prizeBinder.push(cardId);
    }

    if (binder === "elite") {
      eliteBinder.push(cardId);
    }

    user.prize = prizeBinder;
    user.elite = eliteBinder;

    user.save((err) => {
      if (err) return next(err);

      res.redirect(`/collection/${cardId}`);
    });
  });
};

// Handle edit rarity on POST
exports.edit_card_rarity = (req, res, next) => {
  const cardId = req.body.objId;
  const newRarityRating = req.body.rarity;

  Card.findByIdAndUpdate(
    cardId,
    { "meta.rarity.grade": newRarityRating },
    (err, card) => {
      if (err) return next(err);

      res.redirect(`/collection/${cardId}`);
    }
  );
};

// ################## Add Cards ###################
exports.add_card_post = (req, res, next) => {
  const cardId = req.body.cardId;

  pokemon.card
    .find(cardId)
    .then((card) => {
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
        marketValue =
          card.tcgplayer.prices.normal.market ||
          card.tcgplayer.prices.normal.mid;
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
          name: card.name
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
    })
    .catch((err) => {
      return next(err);
    });
};

exports.add_bulk_post = (req, res, next) => {
  Card.findOne({ id: req.body.cardId }, function (err, result) {
    if (err) return next(err);
    const card_id = result._id;
    const card = result;

    if (!card) {
      const err = new Error("Card not found");
      err.status = 404;
      return next(err);
    }

    card.value.count = card.value.count + 1;

    card.save((err) => {
      if (err) return next(err);

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
  });
};

// ################# Sort Cards ###################
// Handle display collection sorted on GET
exports.display_collection_sorted_get = (req, res, next) => {
  User.findById(req.user._id)
    .populate("cards")
    .exec(function (err, user) {
      if (err) return next(err);

      const total = user.cards.reduce((acc, next) => {
        return acc + next.value.market;
      }, 0);

      const sortBy = req.query.by;
      const sortAsc = req.query.asc;

      let cards;

      if (sortBy === "value") {
        !sortAsc
          ? (cards = user.cards.sort((a, b) => a.value.market - b.value.market))
          : (cards = user.cards.sort(
              (a, b) => b.value.market - a.value.market
            ));
      } else if (sortBy === "rarity") {
        !sortAsc
          ? (cards = user.cards.sort(
              (a, b) => b.meta.rarity.grade - a.meta.rarity.grade
            ))
          : (cards = user.cards.sort(
              (a, b) => a.meta.rarity.grade - b.meta.rarity.grade
            ));
      } else if (sortBy === "name") {
        !sortAsc
          ? (cards = user.cards.sort((a, b) => {
              const nameA = a.pokemon.name.toLowerCase();
              const nameB = b.pokemon.name.toLowerCase();

              if (nameA < nameB) return -1;
              if (nameA > nameB) return 1;
              return 0;
            }))
          : (cards = user.cards.sort((a, b) => {
              const nameA = a.pokemon.name.toLowerCase();
              const nameB = b.pokemon.name.toLowerCase();

              if (nameA < nameB) return 1;
              if (nameA > nameB) return -1;
              return 0;
            }));
      } else if (sortBy === "set") {
        !sortAsc
          ? (cards = user.cards.sort((a, b) => {
              const nameA = a.meta.set.releaseDate;
              const nameB = b.meta.set.releaseDate;

              if (nameA < nameB) return -1;
              if (nameA > nameB) return 1;
              return 0;
            }))
          : (cards = user.cards.sort((a, b) => {
              const nameA = a.meta.set.releaseDate;
              const nameB = b.meta.set.releaseDate;

              if (nameA < nameB) return 1;
              if (nameA > nameB) return -1;
              return 0;
            }));
      } else if (sortBy === "supertype") {
        !sortAsc
          ? (cards = user.cards.sort((a, b) => {
              const nameA = a.meta.supertype.toLowerCase();
              const nameB = b.meta.supertype.toLowerCase();

              if (nameA < nameB) return -1;
              if (nameA > nameB) return 1;
              return 0;
            }))
          : (cards = user.cards.sort((a, b) => {
              const nameA = a.meta.supertype.toLowerCase();
              const nameB = b.meta.supertype.toLowerCase();

              if (nameA < nameB) return 1;
              if (nameA > nameB) return -1;
              return 0;
            }));
      } else {
        res.redirect("/collection/home");
      }

      res.render("home", {
        title: "My Collection",
        card_list: cards,
        total: total
      });
    });
};

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

// Handle get filter page
exports.display_filter_page_get = (req, res, next) => {
  const user_id = req.user._id;
  let results = [];

  User.findById(user_id)
    .populate("cards")
    .exec((err, result) => {
      if (err) return next(err);

      // Populate form data
      const collection = result.cards;

      const sets_set = new Set();
      const subtypes_set = new Set();
      const rarities_set = new Set();

      collection.forEach((card) => {
        sets_set.add(
          `${card.meta.set.releaseDate}||${card.meta.set.id}||${card.meta.set.name}`
        );

        card.meta.subtypes.forEach((subtype) => subtypes_set.add(subtype));

        rarities_set.add(card.meta.rarity.type);
      });

      const sets = Array.from(sets_set)
        .map((set) => {
          return set.split("||");
        })
        .sort((a, b) => {
          if (a[0] < b[0]) return 1;
          if (a[0] > b[0]) return -1;
          return 0;
        });

      const subtypes = Array.from(subtypes_set).sort();

      const rarities = Array.from(rarities_set).sort();

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

        console.log(savedQuery);

        // Run through queries
        const filteredByReverse = !savedQuery.reverseholo
          ? collection
          : collection.filter((card) => {
              return card.meta.rarity.reverseHolo;
            });

        const filteredByVal = filteredByReverse.filter((card) => {
          if (savedQuery.compareValue === ">=") {
            return card.value.market >= Number(savedQuery.value);
          } else {
            return card.value.market <= Number(savedQuery.value);
          }
        });

        const filteredByName = filteredByVal.filter((card) => {
          return card.pokemon.name
            .toLowerCase()
            .includes(savedQuery.name.toLowerCase());
        });

        const filteredByRare = !savedQuery.rarities
          ? filteredByName
          : filteredByName.filter((card) => {
              if (!Array.isArray(savedQuery.rarities))
                savedQuery.rarities = [savedQuery.rarities];
              return savedQuery.rarities.includes(card.meta.rarity.type);
            });

        const filteredBySupertypes = !savedQuery.supertypes
          ? filteredByRare
          : filteredByRare.filter((card) => {
              if (!Array.isArray(savedQuery.supertypes))
                savedQuery.supertypes = [savedQuery.supertypes];
              return savedQuery.supertypes.includes(card.meta.supertype);
            });

        const filteredBySubtypes = !savedQuery.subtypes
          ? filteredBySupertypes
          : filteredBySupertypes.filter((card) => {
              let check = 0;
              if (!Array.isArray(savedQuery.subtypes))
                savedQuery.subtypes = [savedQuery.subtypes];

              card.meta.subtypes.forEach((subtype) => {
                if (savedQuery.subtypes.includes(subtype)) check++;
              });

              return check > 0;
            });

        const filteredBySets = !savedQuery.sets
          ? filteredBySubtypes
          : filteredBySubtypes.filter((card) => {
              if (!Array.isArray(savedQuery.sets))
                savedQuery.sets = [savedQuery.sets];
              return savedQuery.sets.includes(card.meta.set.id);
            });

        const sortBy = savedQuery.sortby;
        const sortAsc = savedQuery.asc;

        let cards;

        if (sortBy === "value") {
          !sortAsc
            ? (cards = filteredBySets.sort(
                (a, b) => b.value.market - a.value.market
              ))
            : (cards = filteredBySets.sort(
                (a, b) => a.value.market - b.value.market
              ));
        } else if (sortBy === "rarity") {
          !sortAsc
            ? (cards = filteredBySets.sort(
                (a, b) => a.meta.rarity.grade - b.meta.rarity.grade
              ))
            : (cards = filteredBySets.sort(
                (a, b) => b.meta.rarity.grade - a.meta.rarity.grade
              ));
        } else if (sortBy === "name") {
          !sortAsc
            ? (cards = filteredBySets.sort((a, b) => {
                const nameA = a.pokemon.name.toLowerCase();
                const nameB = b.pokemon.name.toLowerCase();

                if (nameA > nameB) return -1;
                if (nameA < nameB) return 1;
                return 0;
              }))
            : (cards = filteredBySets.sort((a, b) => {
                const nameA = a.pokemon.name.toLowerCase();
                const nameB = b.pokemon.name.toLowerCase();

                if (nameA > nameB) return 1;
                if (nameA < nameB) return -1;
                return 0;
              }));
        } else if (sortBy === "set") {
          !sortAsc
            ? (cards = filteredBySets.sort((a, b) => {
                const nameA = a.meta.set.releaseDate;
                const nameB = b.meta.set.releaseDate;

                if (nameA > nameB) return -1;
                if (nameA < nameB) return 1;
                return 0;
              }))
            : (cards = filteredBySets.sort((a, b) => {
                const nameA = a.meta.set.releaseDate;
                const nameB = b.meta.set.releaseDate;

                if (nameA > nameB) return 1;
                if (nameA < nameB) return -1;
                return 0;
              }));
        } else if (sortBy === "supertype") {
          !sortAsc
            ? (cards = filteredBySets.sort((a, b) => {
                const nameA = a.meta.supertype.toLowerCase();
                const nameB = b.meta.supertype.toLowerCase();

                if (nameA > nameB) return -1;
                if (nameA < nameB) return 1;
                return 0;
              }))
            : (cards = filteredBySets.sort((a, b) => {
                const nameA = a.meta.supertype.toLowerCase();
                const nameB = b.meta.supertype.toLowerCase();

                if (nameA > nameB) return 1;
                if (nameA < nameB) return -1;
                return 0;
              }));
        }
        results = cards;
      }

      const page_data = {
        title: "Filter Collection",
        sets,
        subtypes,
        rarities,
        savedQuery,
        results
      };

      res.render("filter-collection", page_data);
    });
};
