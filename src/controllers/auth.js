const AppError = require("../utils/AppError");
const USER = require("../models/user");
const bcrypt = require("bcrypt");
const util = require("util");
const jwt = require("jsonwebtoken");
const jwtSginPromise = util.promisify(jwt.sign);
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const redis = require("../config/redis");


const getDeviceId = (req) =>
  crypto
    .createHash("sha256")
    .update(req.headers["user-agent"] || "unknown")
    .digest("hex");

const signup = async (req, res) => {
  const {name, email , password} = req.body;
  let user = await USER.findOne({ email });
  if (user && user.emailVerified) {
    throw new AppError("Email already registered", 409);
  }
  if (user) {
    user.name = name;
    user.password = password;
  } 
  user = await USER.create({name, email , password});
  

  const token = user.createEmailVerifyToken();
  await user.save({ validateBeforeSave: false });
  const verifyURL = `${process.env.APP_URL}/api/v1/auth/verify-email/${token}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Confirm your email",
      html: `
        <div style="font-family: Arial; max-width: 480px;">
          <h2>Welcome, ${user.name}!</h2>
          <p>Please confirm your email to activate your account:</p>
          <p><a href="${verifyURL}">Confirm my email</a></p>
          <p>This link is valid for 24 hours. If you didn't create an account, ignore this email.</p>
        </div>`,
    });
  } catch (err) {
    console.error("Verification email failed:", err.message);
  }

  res.status(201).json({
    status: "success",
    message: "Account created. Please check your email to confirm it.",user
  });
};
const verifiyEmail = async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await USER.findOne({
    emailVerifyToken: hashedToken,
    emailVerifyExpires: { $gt: Date.now() },
  });
  if (!user) throw new AppError("link is invalid or expired !", 400);
  user.emailVerified = true;
  user.emailVerifyToken = undefined;    
  user.emailVerifyExpires = undefined;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: "success",
    message: "confirmed",
  });
};



const login = async (req, res, next) => {
  const body = req.body;
  const user = await USER.findOne({email :body.email }).populate("password knownDevices");
  if (!user.emailVerified)
    throw new AppError("Please confirm your email first", 403);
  if (!user) throw new AppError("email or password is incorrect!", 400);
  const iscorrectpassword = await bcrypt.compare(body.password, user.password);
  if (!iscorrectpassword)
    throw new AppError(" email or password is incorrect!", 400);
  const token = await jwtSginPromise({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const deviceId = getDeviceId(req);
  const knownDevices = user.knownDevices || [];

  if (!knownDevices.includes(deviceId)) {
    const isFirstLogin = knownDevices.length === 0;

    await USER.updateOne(
      { _id: user._id },
      { $push: { knownDevices: { $each: [deviceId], $slice: -10 } } },
    );

    if (!isFirstLogin) {
      const loggedInAt = new Date().toLocaleString("en-GB", {
        timeZone: "Africa/Cairo",
      });

      sendEmail({
        email: user.email,
        subject: "New login from a new device",
        html: `
        <div style="font-family: Arial; max-width: 480px;">
          <h2>New login from a new device</h2>
          <p>Hi ${user.name},</p>
          <p>Your account was accessed from a new device on <b>${loggedInAt}</b> (Cairo time).</p>
          <p>If this was you, no action is needed. If not, reset your password immediately.</p>
        </div>`,
      }).catch((err) => console.error("Login email failed:", err.message));
    }
  }
  res.status(200).json({ message: "success", token, user });
};
const logout = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];  
  const decoded = jwt.decode(token);                      
  const ttl = decoded.exp - Math.floor(Date.now() / 1000); 

  if (ttl > 0) {
    const key = "bl:" + crypto.createHash("sha256").update(token).digest("hex");
    await redis.set(key, "1", "EX", ttl);   
  }

  res.status(200).json({ status: "success", message: "Logged out" });
};

const forgotPassword = async (req, res) => {
  const body = req.body;
  const user = await USER.findOne({ email: body.email });
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const message = `
     <div style="direction: ltr; text-align: left; font-family: Arial;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset the password for your account.</p>
        <p>Please click the link below to set a new password (the link is valid for 10 minutes only):</p>
        <a href="${resetURL}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you didn't request this change, you can ignore this email and your account will remain secure.</p>
      </div>>
    `;
  try {
    await sendEmail({
      to: user.email,
      subject: "reset password",
      html: message,
    });
    res.status(200).json({
      status: "success",
      message: " password reset link has been sent to your email",
    });
  } catch (err) {
    console.log("email error :",err)
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
  verifiyEmail,
  logout
};