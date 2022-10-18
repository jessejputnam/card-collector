"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// USER MODEL
const CardSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    supertype: { type: String, required: true },
    subtypes: [{ type: String }],
    level: { type: String, default: null },
    set: {
      name: { type: String, required: true },
      series: { type: String, default: null },
      totalPrint: { type: Number, required: true }
    },
    number: { type: String, required: true },
    rarity: { type: String, required: true },
    images: {
      small: { type: String, required: true },
      large: { type: String, required: true }
    },
    marketValue: { type: Number, required: true }
    // count: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", CardSchema);
