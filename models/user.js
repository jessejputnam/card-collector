"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// USER MODEL
const UserSchema = new Schema(
  {
    username: {
      type: String,
      lowercase: true,
      required: [true, "Email cannot be empty"],
      match: [/\S+@\S+\.\S+/, "Must be valid email"]
    },
    password: { type: String, required: true },
    binders: { type: [String], default: undefined }
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = function (input) {
  return input === this.password;
};

module.exports = mongoose.model("User", UserSchema);
