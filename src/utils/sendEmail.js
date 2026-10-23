const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html }) => {
  let transporter;

  if (process.env.NODE_ENV === "production") {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    });
  } else {
    // وضع التطوير: حساب Ethereal مؤقت
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }

  const info = await transporter.sendMail({
    from: '"Booking System" <no-reply@booking.com>',
    to,
    subject,
    html,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("📧 Preview:", nodemailer.getTestMessageUrl(info));
  }
};

module.exports = sendEmail;