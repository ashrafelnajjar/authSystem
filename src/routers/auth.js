const express = require("express");
const router = express.Router();
const joivalidation = require("../middlewares/joi-validation");
const {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyEmailSchema,
  resetPasswordSchema,
} = require("../validators/auth");
const {
  login,
  signup,
  forgotPassword,
  resetpassword,
  verifiyEmail,
} = require("../controllers/auth");

router.post("/signup", joivalidation(signupSchema), signup);
router.post("/login", joivalidation(loginSchema), login);
router.post(
  "/forgot password",
  joivalidation(forgotPasswordSchema),
  forgotPassword,
);
router.patch(
  "/reset password/:token",
  joivalidation(resetPasswordSchema),
  resetpassword,
);
router.patch(
  "/verify-email/:token",
  joivalidation(verifyEmailSchema),
  verifiyEmail,
);

module.exports = router;
