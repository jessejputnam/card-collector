"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SetSchema = new Schema(
  {
    id: { type: String, required: true }, // Used for FK in Cards
    tcgPlayerId: { type: String, required: true },
    pokemonSetId: { type: String }, // from old API
    name: { type: String, required: true },
    series: { type: String, required: true },
    releaseDate: { type: Date, required: true },
    cardCount: { type: Number, required: true },
    priceGuideUrl: { type: String },
    hasPriceGuide: { type: Boolean, required: true },
    noPriceGuideReason: { type: String },
    symbolUrl: { type: String },
    imageCdnUrl: { type: String },
    imageCdnUrl200: { type: String },
    imageCdnUrl400: { type: String },
    imageCdnUrl800: { type: String },
    imageUrl: { type: String },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Set", SetSchema);
