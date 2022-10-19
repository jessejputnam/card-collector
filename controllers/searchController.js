"use strict";

const pokemon = require("pokemontcgsdk");

const Card = require("../models/card");

pokemon.configure({ apikey: process.env.POKE_API_KEY });
