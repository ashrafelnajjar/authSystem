// src/utils/sendEmail.js
// Same signature everywhere: sendEmail({ to, subject, html })
//
// - BREVO_API_KEY set  -> sends through Brevo's HTTPS API (works on Railway, SMTP ports are blocked there)
// - otherwise          -> sends through Gmail SMTP with nodemailer (works on your own machine)

const nodemailer = require("nodemailer");

const sendViaBrevo = async ({ to, subject, html }) => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Auth System", email: process.env.EMAIL_USER },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Brevo error ${res.status}: ${await res.text()}`);
  }
};

// One transporter for the whole app (reuses the connection)
let transporter;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  return transporter;
};

const sendViaGmail = async ({ to, subject, html }) => {
  await getTransporter().sendMail({
    from: `"Auth System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

const sendEmail = async (options) => {
  if (process.env.BREVO_API_KEY) return sendViaBrevo(options);
  return sendViaGmail(options);
};

module.exports = sendEmail;