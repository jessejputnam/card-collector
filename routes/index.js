"use strict";

const express = require("express");
const router = express.Router();

const auth_controller = require("../controllers/authController");

const authCheckTrue = require("../helpers/authCheckTrue");

router.get("/", authCheckTrue, auth_controller.index_get);

router.get("/register", authCheckTrue, auth_controller.signup_get);
router.post("/register", auth_controller.sign_up_post);

router.get("/login", authCheckTrue, auth_controller.login_get);
router.post("/login", auth_controller.login_post);
router.get("/logout", auth_controller.logout_get);

module.exports = router;
