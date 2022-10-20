"use strict";

const authCheckTrue = (req, res, next) => {
  if (req.user) {
    res.redirect("/collection/home");
  } else {
    next();
  }
};

module.exports = authCheckTrue;
