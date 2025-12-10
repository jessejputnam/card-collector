const Card = require("../models/card");
const handle = require("../helpers/errorHandler");
const sort = require("../helpers/sort");
const makeCSV = require("../helpers/makeCSV");
const getConversionRate = require("../helpers/getConversionRate");

// Handle display cards by set on GET
exports.display_filter_by_set_get = async (req, res, next) => {
  const userId = req.user._id;
  const curr = req.user.curr;

  const [errCards, cards] = await handle(Card.find({ userId: userId }));
  if (errCards) return next(errCards);

  // Find which sets exist in collection
  const setOrder = {};
  cards.forEach((card) => {
    const setId = card.meta.set.id;
    if (!(setId in setOrder))
      setOrder[setId] = [card.meta.set.name, card.meta.set.releaseDate];
  });

  // Sort sets by date
  const setArr = [];
  for (const set in setOrder) setArr.push([set, setOrder[set]]);

  setArr.sort(sort.byDateDesc);
  for (let i = 0; i < setArr.length; i++) setOrder[setArr[i][0]] = i;

  // Create array with unique empty arrays
  const orderedSets = Array.from(Array(setArr.length), () => []);

  // Add cards to sets in array
  cards.forEach((card) => {
    const idx = setArr.findIndex((s) => s[0] === card.meta.set.id);
    orderedSets[idx].push(card);
  });

  // Object holding both sets and CSV data
  const list_sets = [];

  // Sort cards within sets
  for (const s of orderedSets) {
    s.sort(sort.byCardNumber);
    const csv = makeCSV(s);
    const set = {
      csv: csv,
      cards: s
    };

    list_sets.push(set);
  }

  const [errConvert, currConvert] = await getConversionRate(curr);
  if (errConvert) return next(errConvert);

  return res.render("sets-collection", {
    title: "Set Collection",
    list_sets,
    curr_convert: currConvert,
    curr
  });
};
