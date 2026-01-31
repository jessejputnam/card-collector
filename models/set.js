"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SetSchema = new Schema(
  {
    id: { type: String, required: true }, // Used for FK in Cards
    tcgPlayerId: { type: String, required: true },
    tcgPlayerNumericId: { type: Number },
    pokemonSetId: { type: String },
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
    isJapanese: { type: Boolean },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true }
  },
  { timestamps: true }
);

SetSchema.index({ tcgPlayerId: 1 }, { unique: true });

module.exports = mongoose.model("Set", SetSchema);
