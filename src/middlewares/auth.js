const crypto = require("crypto");
const util = require("util");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const User = require("../models/user");
const redis = require("../config/redis");

const jwtVerifyPromise = util.promisify(jwt.verify);

const auth = async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) throw new AppError("no token provided", 401);

  const payload = await jwtVerifyPromise(token, process.env.JWT_SECRET);
  const key = "bl:" + crypto.createHash("sha256").update(token).digest("hex");
  if (await redis.exists(key)) throw new AppError("Please log in again", 401);

  const user = await User.findById(payload.sub);
  if (!user) throw new AppError("The user no longer exists", 401);

  req.user = user;
  next();
};

module.exports = auth;