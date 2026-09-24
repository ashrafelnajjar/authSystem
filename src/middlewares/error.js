const AppError = require("../utils/AppError");

const errorHandler = (err, req, res, next) => {
  console.log(err);
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  if (err.code === 11000) {
    const [field] = Object.keys(err.keyPattern);
    return res.status(400).json({ message: `Duplicate ${field}` });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "invalid id type " });
  }
  if (err.name === "JsonWebTokenError")
    return res.status(401).json({ message: "invalid token" });

  if (err.name === "TokenExpiredError")
    return res.status(401).json({ message: "token expired" });

  res.status(500).json({ message: "internal server error" });
};

module.exports = errorHandler;
