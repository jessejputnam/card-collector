"use strict";

const passport = require("passport");
const { body, validationResult } = require("express-validator");

const Card = require("../models/card");

// Handle display all cards on GET
exports.display_collection_get = (req, res, next) => {
  Card.find().sort({ marketValue: "desc" }).exec();
};
