"use strict";

// const Card = require("../models/card");
const CardRepo = require("../repositories/cardRepo");
const User = require("../models/user");
const handle = require("../utils/errorHandler");
const sort = require("../utils/sort");
const getConversionRate = require("../utils/getConversionRate");

// Handle display binders on GET
exports.display_binders_get = async (req, res, next) => {
  const binders = req.user.binders;
  const curr = req.user.curr;

  return res.render("binders/binders", {
    title: "Binders",
    binders,
    curr
  });
};

// Handle add binders on POST
exports.add_binders_post = async (req, res, next) => {
  const userId = req.user._id;
  const newBinder = req.body.newBinder;

  const [errUser, user] = await handle(User.findById(userId));
  if (errUser) return next(errUser);

  user.binders.push(newBinder);
  const [errSave, save] = await handle(user.save());
  if (errSave) return next(errSave);
  return res.redirect("/collection/binders");
};

// Handle delete binder
exports.delete_binder_post = async (req, res, next) => {
  const userId = req.user._id;
  const binder = req.body.binder;
  const binders = req.user.binders.filter((b) => b !== binder);
  const [errUser, user] = await handle(
    User.findByIdAndUpdate(userId, { binders })
  );
  if (errUser) return next(errUser);

  // handle(Card.updateMany({ userId, binder }, { binder: null }))
  const [errCards, cards] = await CardRepo.removeDeletedBinder(userId, binder);
  if (errCards) return next(errCards);

  return res.redirect("/collection/binders");
};

// Display binder on GET
exports.display_binder_get = async (req, res, next) => {
  const userId = req.user._id;
  const binder = req.params.id;
  const curr = req.user.curr;

  const [errCards, cards] = await CardRepo.getBinderCards(userId, binder);
  // const [errCards, cards] = await handle(
  //   Card.find({ userId: userId, binder: binder }).exec()
  // );
  if (errCards) return next(errCards);

  const [errConvert, currConvert] = await getConversionRate(curr);
  if (errConvert) return next(errConvert);

  const total =
    cards.reduce(
      (acc, next) => acc + next.value.market * (next.value.count || 1),
      0
    ) * currConvert;

  const cardsSorted = cards.sort(sort.byValueDesc);

  return res.render("binders/binder", {
    title: binder,
    binder,
    curr_convert: currConvert,
    curr,
    cards: cardsSorted,
    total
  });
};
