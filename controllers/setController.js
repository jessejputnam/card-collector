const CardSet = require("../models/set");
const CardRepo = require("../repositories/cardRepo");
const { getSets } = require("../api/pokePriceApi");
const handle = require("../utils/errorHandler");
const Card = require("../models/card");

// Handle display cards by set on GET
exports.display_sets_get = async (req, res, next) => {
  const userId = req.user._id;
  const curr = req.user.curr;

  const isAdmin = userId == process.env.ADMIN_USER_ID;

  const fields =
    "id name series tcgPlayerId releaseDate cardCount symbolUrl priceGuideUrl imageUrl isJapanese";

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

// Handle update set logo on POST (admin only)
exports.update_set_logo_post = async (req, res, next) => {
  const isAdmin = req.user._id == process.env.ADMIN_USER_ID;
  if (!isAdmin) {
    const err = new Error("Unauthorized");
    err.status = 401;
    return next(err);
  }

  const setId = req.params.setId;
  const updateData = req.body;

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

// Handle update set series on POST (admin only)
exports.update_set_series_post = async (req, res, next) => {
  const isAdmin = req.user._id == process.env.ADMIN_USER_ID;
  if (!isAdmin) {
    const err = new Error("Unauthorized");
    err.status = 401;
    return next(err);
  }

  const setId = req.params.setId;
  const updateData = req.body;

  const [updateErr, updatedSet] = await handle(
    CardSet.findOneAndUpdate(
      { id: setId },
      { $set: { series: updateData.newSeries } }
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

// // New stupid integer id update for all sets
// exports.update_all_new_stupid_id_change = async (req, res, next) => {
//   // Admin gate
//   const isAdmin = req.user._id == process.env.ADMIN_USER_ID;
//   if (!isAdmin) {
//     const err = new Error("Unauthorized");
//     err.status = 401;
//     return next(err);
//   }

//   // ### SETS UPDATE ###
//   // // API sets retrieval
//   // const [apiSetsEnErr, apiSetsEn] = await handle(getSets("english"));
//   // if (apiSetsEnErr) return next(apiSetsEnErr);

//   // const apiSets = apiSetsEn.data || [];

//   // const ops = apiSets.map((s) => ({
//   //   updateOne: {
//   //     filter: { tcgPlayerId: String(s.tcgPlayerId) },
//   //     update: { $set: { tcgPlayerNumericId: Number(s.tcgPlayerNumericId) } },
//   //     upsert: false
//   //   }
//   // }));

//   // const [resultErr, result] = await handle(
//   //   CardSet.bulkWrite(ops, { ordered: false })
//   // );
//   // if (resultErr) return next(resultErr);
//   // const matchedCount = result.matchedCount;
//   // const modifiedCount = result.modifiedCount;

//   // console.log(
//   //   `##########\n\nMatched: ${matchedCount}\nModified: ${modifiedCount}\n\n############`
//   // );
//   // return res.redirect("/sets");

//   // ### CARDS UPDATE ###
//   const [mySetsErr, mySets] = await handle(
//     CardSet.find({}, "id tcgPlayerNumericId").exec()
//   );
//   if (mySetsErr) return next(mySetsErr);

//   const ops = mySets.map((s) => ({
//     updateMany: {
//       filter: { setId: s.id },
//       update: { $set: { setTcgPlayerNumericId: s.tcgPlayerNumericId } },
//       upsert: false
//     }
//   }));

//   const [resultErr, result] = await handle(
//     Card.bulkWrite(ops, { ordered: false })
//   );
//   if (resultErr) return next(resultErr);
//   const matchedCount = result.matchedCount;
//   const modifiedCount = result.modifiedCount;

//   console.log(
//     `##########\n\nMatched: ${matchedCount}\nModified: ${modifiedCount}\n\n############`
//   );
//   return res.redirect("/sets");
// };
