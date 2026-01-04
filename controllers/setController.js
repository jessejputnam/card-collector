const CardSet = require("../models/set");
const handle = require("../utils/errorHandler");

// Handle display cards by set on GET
exports.display_sets_get = async (req, res, next) => {
  const userId = req.user._id;
  const curr = req.user.curr;

  const isAdmin = userId == process.env.ADMIN_USER_ID;

  const fields =
    "id name series tcgPlayerId releaseDate cardCount symbolUrl priceGuideUrl imageUrl";

  const [setsErr, sets] = await handle(
    CardSet.find({}, fields).sort({ releaseDate: -1 }).exec()
  );
  if (setsErr) return next(setsErr);

  return res.render("card_sets/sets", {
    title: "Card Sets",
    setList: sets,
    isAdmin,
    curr
  });
};

// Handle display individual set detail on GET
exports.display_set_detail_get = async (req, res, next) => {
  const userId = req.user._id;
  const curr = req.user.curr;

  const isAdmin = userId == process.env.ADMIN_USER_ID;

  const setId = req.params.setId;

  const fields =
    "id name series tcgPlayerId releaseDate cardCount symbolUrl priceGuideUrl imageUrl";

  const [setErr, set] = await handle(
    CardSet.findOne({ id: setId }, fields).exec()
  );
  if (setErr) return next(setErr);
  if (!set) {
    const err = new Error("Set not found");
    err.status = 404;
    return next(err);
  }

  return res.render("card_sets/set-detail", {
    title: `Set Detail`,
    set,
    isAdmin,
    curr
  });
};

// Handle update set on POST (admin only)
exports.update_set_post = async (req, res, next) => {
  const curr = req.user.curr;
  const isAdmin = req.user._id == process.env.ADMIN_USER_ID;
  if (!isAdmin) {
    const err = new Error("Unauthorized");
    err.status = 401;
    return next(err);
  }

  const setId = req.params.setId;
  const updateData = req.body;
  console.log(updateData);

  const [updateErr, updatedSet] = await handle(
    CardSet.findOneAndUpdate(
      { id: setId },
      { $set: { symbolUrl: updateData.symbolUrl } }
    ).exec()
  );
  if (updateErr) return next(updateErr);
  if (!updatedSet) {
    const err = new Error("Set not found");
    err.status = 404;
    return next(err);
  }

  return res.redirect(`/sets/${setId}`);
};
