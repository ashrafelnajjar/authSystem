const express = require("express");
const router = express.Router();
const joivalidation = require("../middlewares/joi-validation");
const { loginSchema, signupSchema } = require("../validators/auth");
const {
  login,
  signup,
  forgotPassword,
  resetpassword,
} = require("../controllers/auth");

router.post("/signup", joivalidation(signupSchema), signup);
router.post("/login", joivalidation(loginSchema), login);
router.post("/forgot password",forgotPassword);
router.patch("/reset password؟/:token",resetpassword)



module.exports = router;