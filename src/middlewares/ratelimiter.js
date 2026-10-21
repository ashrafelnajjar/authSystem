const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const redis = require("../config/redis");

const rateLimiter = ({
  windowMs = 60 * 1000,
  limit = 100,
  prefix = "rl:",
  ...options
} = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Too many requests, حاول تاني بعد شوية" },
    passOnStoreError: true,
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix,
    }),
    ...options,
  });

module.exports = rateLimiter;