const randomstring = require('randomstring')

const otpGenerator = () => {
  return randomstring.generate({
    length: 6,
    charset: "numeric",
  });
};

module.exports = otpGenerator;