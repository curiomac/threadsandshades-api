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

  try {
    const info = await transporter.sendMail(message);
    console.log("Email sent: ", info);
    return info; // Return the info object if email is sent successfully
  } catch (error) {
    console.error("Error sending email: ", error);
    throw error; // Throw the error if there's an issue sending the email
  }
};

module.exports = sendEmail;

