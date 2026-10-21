const Joi = require("joi");

const email = Joi.string().trim().lowercase().email().required();

// الباسورد: 8 حروف على الأقل، فيه حرف ورقم، وأقصى 72 (حد bcrypt)
const newPassword = Joi.string()
  .min(8)
  .max(72)
  .pattern(/[A-Za-z]/, "letter")
  .pattern(/\d/, "number")
  .required();

const signupSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email,
    password: newPassword,
  }),
};

const loginSchema = {
  body: Joi.object({
    email,
    password: Joi.string().required(), // مفيش قواعد هنا
  }),
};

const forgotPasswordSchema = {
  body: Joi.object({ email }),
};

const verifyEmailSchema = {
  params: Joi.object({
    token: Joi.string().hex().length(64).required(),
  }),
};

const resetPasswordSchema = {
  params: Joi.object({
    token: Joi.string().hex().required(),
  }),
  body: Joi.object({ password: newPassword }),
};

module.exports = {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyEmailSchema,
  resetPasswordSchema,
};