const express = require("express");
const { loginLimiter } = require("../middlewares/rateLimit.middleware"); 

const { register, login, logout } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/signup", register);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);

module.exports = router;