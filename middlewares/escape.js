const { body } = require("express-validator");

exports.add_binder = [body("newBinder").trim().escape()];
