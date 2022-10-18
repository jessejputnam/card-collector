"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// USER MODEL
const CardSchema = new Schema(
  {
    type: {
      type: String,
      required: true
    },
    name: { type: String, required: true },
    nameAlt: { type: String },
    rarity: {
      type: String,
      required: true,
      enum: [
        "promo",
        "secret rare",
        "ultra rare",
        "holo rare",
        "rare",
        "uncommon",
        "common"
      ]
    },
    art: { type: String },
    number: { type: String, required: true },
    set: { type: String, required: true },
    subset: { type: String },
    notes: { type: String },
    marketValue: { type: Number }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", CardSchema);
