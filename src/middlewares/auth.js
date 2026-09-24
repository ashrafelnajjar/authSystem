const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");
const util = require("util");
const User = require("../models/users")
const jwtVerifyPromise = util.promisify(jwt.verify);

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new AppError("no token provided", 401);
  const payload = await jwtVerifyPromise(token, process.env.JWT_SECRET);
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError("user not found", 404);
  req.user = user;
  next();
};
module.exports = auth;
