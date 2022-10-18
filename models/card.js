"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// USER MODEL
const CardSchema = new Schema(
  {
    id: String,
    count: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", CardSchema);
