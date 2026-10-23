const AppError = require("../utils/AppError");

const joivalidation = (schema) => (req, res, next) => {
  for (const target of ["params", "body", "query"]) {
    if (!schema[target]) continue;

    const { error, value } = schema[target].validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join(", ");
      return next(new AppError(message, 400));
    }

    if (target === "query") Object.assign(req.query, value);
    else req[target] = value;
  }
  next();
};

module.exports = joivalidation;