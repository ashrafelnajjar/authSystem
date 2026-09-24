const Joi = require("joi");

const signupSchema = new Joi.object({
  name: Joi.string().required().max(30),
  email: Joi.string().email().required(),
  password: Joi.string().email().required().max(30),
});

const loginSchema = new Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().email().required().max(30),
});

module.exports = {
    loginSchema,
    signupSchema
}
