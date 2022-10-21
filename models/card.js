"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// USER MODEL
const CardSchema = new Schema(
  {
    id: { type: String, required: true },

    meta: {
      images: {
        small: { type: String, required: true },
        large: { type: String, required: true }
      },
      rarity: {
        type: { type: String, required: true },
        reverseHolo: { type: Boolean, default: false, required: true },
        grade: { type: Number, required: true }
      },
      supertype: { type: String, required: true },
      subtypes: [{ type: String }],
      set: {
        symbol: String,
        logo: String,
        name: { type: String, required: true },
        id: { type: String, default: null },
        series: { type: String },
        number: { type: String, required: true },
        totalPrint: { type: Number, required: true },
        releaseDate: { type: String, required: true }
      }
    },

    pokemon: {
      name: { type: String, required: true },
      region: {
        name: { type: String, default: null },
        order: { type: Number, default: null }
      }
    },

    value: {
      market: { type: Number, required: true },
      priceType: { type: String, required: true },
      // Price History: [Date, Amt]-- i.e. [08/22/2022, 6.39]
      priceHistory: [[String, Number]],
      count: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", CardSchema);
