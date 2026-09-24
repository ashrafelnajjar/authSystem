const AppError = require("../utils/AppError");
//high order function
const joivalidation = (schema) => {
  return (req, res, next) => {
    const body = req.body;
    const { error, value } = schema.validate(body, {
      abortEarly: false,
    });
    if 
    (error)
      throw new AppError(
        error.details.map((err) => err.message).join(", "),
        400,
      );
    next();
  };
};
module.exports = joivalidation;

