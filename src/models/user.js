const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 3, maxlength: 30 },
    password: { type: String, required: true, minlength: 6, maxlength: 50 },
    email: {
      type: String,
      required: true,
      validate: /\S+@\S+\.\S+/,
      unique: true,
    },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
    passwordResetToken: String,
    passwordResetExpires: Date,
    roles: {
      type: String,
      enum: ["Costumer", "Admin"],
      default: "Costumer",
    },
    knownDevices: { type: [String], default: [], select: false },
    phones: { type: String },
    addresses: [
      {
        city: String,
        street: String,
        building: String,
        details: String,
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.createdAt = ret.createdAt.toLocaleString("en-EG", {
          timeZone: "Africa/Cairo",
        });
        ret.updatedAt = ret.updatedAt.toLocaleString("en-EG", {
          timeZone: "Africa/Cairo",
        });
        return ret;
      },
    },
  },
);
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
});
userSchema.methods.createEmailVerifyToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerifyToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.emailVerifyExpires = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
userSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 24 * 60 * 60, partialFilterExpression: { emailVerified: false } },
);

const user = mongoose.model("user", userSchema);
module.exports = user;
