const Card = require("../models/card");
const CardSet = require("../models/set");
const handle = require("../helpers/errorHandler");
const sort = require("../helpers/sort");
const makeCSV = require("../helpers/makeCSV");
const getConversionRate = require("../helpers/getConversionRate");

// Handle display cards by set on GET
exports.display_sets_get = async (req, res, next) => {
  const userId = req.user._id;
  const curr = req.user.curr;

  const [setsErr, sets] = await handle(
    CardSet.find({}, "name tcgPlayerId releaseDate cardCount")
      .sort({ releaseDate: -1 })
      .exec()
  );
  if (setsErr) return next(setsErr);

  return res.render("sets", {
    title: "Card Sets",
    setList: sets,
    curr
  });
};
