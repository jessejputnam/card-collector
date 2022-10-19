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
        reverseHolo: { type: Boolean, required: true },
        grade: { type: Number, required: true }
      },
      supertype: { type: String, required: true },
      subtypes: [{ type: String }],
      set: {
        symbol: String,
        name: { type: String, required: true },
        subset: { type: String, default: null },
        series: { type: String },
        number: { type: Number, required: true },
        totalPrint: { type: Number, required: true },
        releaseDate: { type: Number, required: true }
      }
    },

    pokemon: {
      name: { type: String, required: true },
      level: { type: String, default: null },
      natDex: Number,
      region: {
        name: { type: String, required: true },
        generation: { type: Number, required: true }
      }
    },

    value: {
      marketValue: { type: Number, required: true },
      // Price History: Date, Amt -- i.e. 08/22, 6.39
      priceHistory: [[String, Number]],
      count: Number,
      prizeBinder: { type: Boolean, required: true }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", CardSchema);
