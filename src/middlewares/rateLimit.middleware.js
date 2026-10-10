const rateLimit = require("express-rate-limit"); 

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "test" ? 5 : 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res, next) => {
        next(
          res.status(429).json({message: "Too many requests"}));
    }
}); 

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res, next) => {
      next(
        res.status(429).json({message: "Too many requests"}));
  }
}); 

module.exports = { loginLimiter, apiLimiter }; 