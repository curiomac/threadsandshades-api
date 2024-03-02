const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transport = {
    service: "gmail",
    auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  };

  const transporter = nodemailer.createTransport(transport);
  const message = {
    from: process.env.EMAIL_ID,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };
  await transporter.sendMail(message);
};

module.exports = sendEmail;
