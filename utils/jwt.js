const sendToken = (user, statusCode, res, message, code) => {
  const token = user.getJwtToken();

  //setting cookies
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIES_EXPIRES_TIME * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: "None",
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
    message,
    user,
  });
};

module.exports = sendToken;
