const Card = require("../models/card");
const User = require("../models/user");
const Set = require("../models/set");
const handle = require("../helpers/errorHandler");
const apiCall = require("../api/pokePriceApi");
const { stack } = require("../routes/cards");

// ############## System Update ################
exports.update_cards_new_system = async (req, res, next) => {
  const userId = req.user._id;
  const cards = req.user.cards;

  if (cards.length) {
    const elite = req.user.elite;
    const prize = req.user.prize;

    const [errUserUpdate, userUpdate] = await handle(
      Card.updateMany({ _id: { $in: cards } }, { userId, binder: null })
    );
    if (errUserUpdate) return next(errUserUpdate);

    const [errEliteUpdate, eliteUpdate] = await handle(
      Card.updateMany({ _id: { $in: elite } }, { binder: "elite" })
    );
    if (errEliteUpdate) return next(errEliteUpdate);

    const [errPrizeUpdate, prizeUpdate] = await handle(
      Card.updateMany({ _id: { $in: prize } }, { binder: "prize" })
    );
    if (errPrizeUpdate) return next(errPrizeUpdate);

    const update = {
      elite: null,
      prize: null,
      cards: null,
      bulk: null
    };

    const [errUser, user] = await handle(
      User.findByIdAndUpdate(userId, update)
    );
    if (errUser) return next(errUser);
  }

  return res.redirect("/collection/home");
};

exports.update_sets = async (req, res, next) => {
  const [setErr, setResponse] = await handle(apiCall.getSets());
  if (setErr) return next(setErr);
  const data = setResponse.data;
  const [delErr, delResponse] = await handle(Set.deleteMany({}));
  if (delErr) return next(delErr);
  const [insertErr, insertResponse] = await handle(
    Set.insertMany(data, { ordered: false })
  );
  if (insertErr) return next(insertErr);
  return res.render("error", {
    message: "Successfully updated sets!",
    error: { status: "", stack: "" }
  });
};
