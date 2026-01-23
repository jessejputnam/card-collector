"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// USER MODEL
const CardSchema = new Schema(
  {
    id: { type: String, required: true }, // id field from TCGPlayer API
    apiId: { type: String }, // id field from external API
    oldId: { type: String }, // old, deprecated id field from external API

    userId: { type: Schema.Types.ObjectId, ref: "User" },

    custom: Boolean,
    isJapanese: Boolean,

    binder: {
      type: String
    },

    setId: { type: String }, // Set.id NOT Set._id

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
      stage: { type: String },
      subtypes: [{ type: String }],
      setNumber: { type: String },
      // DEPRECATED FIELDS
      set: {
        symbol: String,
        logo: String,
        name: { type: String },
        id: { type: String, default: null },
        series: { type: String },
        number: { type: String },
        totalPrint: { type: Number },
        releaseDate: { type: String }
      }
    },

    pokemon: {
      name: { type: String, required: true }
    },

    value: {
      manualUpdate: Boolean,
      market: { type: Number, required: true },
      priceType: { type: String, required: true },
      priceHistory: [[String, Number]], // Price History: [Date, Amt]-- i.e. [08/22/2022, 6.39]
      count: Number
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", CardSchema);
