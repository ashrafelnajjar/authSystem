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
  logout,
} = require("../controllers/auth");
const auth = require("../middlewares/auth")
router.post("/signup", joivalidation(signupSchema), signup);
router.post("/login", joivalidation(loginSchema), login);

router.post(
  "/forgotpassword",
  joivalidation(forgotPasswordSchema),
  forgotPassword,
);
router.post("/logout", auth ,logout)


router.patch(
  "/resetpassword/:token",
  joivalidation(resetPasswordSchema),
  resetpassword,
);
router.get(
  "/verify-email/:token",
  joivalidation(verifyEmailSchema),
  verifiyEmail,
);

module.exports = router;
