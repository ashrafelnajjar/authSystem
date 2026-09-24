const AppError = require("../utils/AppError");
const USER = require("../models/user");
const bcrypt = require("bcrypt");
const util = require("util"); 
const jwt = require("jsonwebtoken");
const jwtSginPromise = util.promisify(jwt.sign);
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

const signup = async (req, res, next) => {
  const body = req.body;
  const exist = await USER.findOne({ email: body.email });
  if (exist) throw new AppError("email is already exist", 404);
  const user = await USER.create(body);
  res.status(200).json({ message: "success", user });
};
const login = async (req, res, next) => {
  const body = req.body;
  const user = await USER.findOne({ email: body.email });
  if (!user) throw new AppError("email or password is incorrect!", 400);
  const iscorrectpassword = bcrypt.compare(body.password, USER.password);
  if (!iscorrectpassword)
    throw new AppError(" email or password is incorrect!", 400);
  const token = await jwtSginPromise({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.status(200).json({ message: "success", user, token });
};

const forgotPassword = async (req, res) => {
  const body = req.body;
  const user = await USER.findOne({ email: body.email });
  if (!user) throw new AppError("email is not exist", 404);

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `http://localhost:3000/reset-password/${resetToken}`;

  const message = `
      <div style="direction: rtl; text-align: right; font-family: Arial;">
        <h2>طلب إعادة تعيين كلمة السر</h2>
        <p>لقد تلقينا طلباً لإعادة تعيين كلمة السر الخاصة بحسابك.</p>
        <p>يرجى الضغط على الرابط التالي لتحديد كلمة سر جديدة (الرابط صالح لمدة 10 دقائق فقط):</p>
        <a href="${resetURL}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">إعادة تعيين كلمة السر</a>
        <p>إذا لم تطلب هذا التغيير، يمكنك تجاهل هذا الإيميل وسيظل حسابك آمناً.</p>
      </div>
    `;
  try {
    await sendEmail({
      email: user.email,
      subject: "reset password",
      html: message,
    });
    res.status(200).json({
      status: "success",
      message: " password reset link has been sent to your email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      status: "fail",
      message: "حدث خطأ أثناء إرسال البريد الإلكتروني، حاول مرة أخرى لاحقاً",
    });
  }
};

const resetpassword = async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await USER.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new AppError("link is invalid or expired !", 400);

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;  
  await user.save();
  res.status(200).json({
    status: "success",
    message: "تم تغيير كلمة السر بنجاح، يمكنك الآن تسجيل الدخول",
  });
};

module.exports = {
  login,
  signup,
  forgotPassword,
  resetpassword,
};
