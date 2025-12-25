"use strict";

export const authCheckFalse = (req, res, next) => {
  if (!req.user) {
    res.redirect("/");
  } else {
    next();
  }
};

export const authCheckTrue = (req, res, next) => {
  if (req.user) {
    res.redirect("/collection/home");
  } else {
    next();
  }
};
