const catchAsyncError = require("../middlewares/catchAsyncError");
const OTP = require("../models/otpModel");
const User = require("../models/userModel");
const sendEmail = require("../utils/email");
const ErrorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/jwt");
const otpGenerator = require("../utils/otpGenerator");
const crypto = require("crypto");
const readHTMLTemplate = require("../utils/readHTMLTemplate");
const path = require("path");

// send otp - /api/v1/otp/send
exports.sendOTP = catchAsyncError(async (req, res, next) => {
  const { email, isAuth, reSendOTP } = req.body;
  await OTP.deleteMany({ expiration_time: { $lt: new Date() } });
  if (!email) {
    return next(new ErrorHandler("Please enter an email", 400));
  }
  const user = await User.findOne({ email });
  if (!user && isAuth === "Login") {
    return next(new ErrorHandler("Email id not found", 404));
  }
  if (user && isAuth === "Register") {
    return next(new ErrorHandler("Email already registered", 400));
  }
  if (reSendOTP) {
    await OTP.deleteOne({ email });
  }
  const data = await OTP.findOne({ email });
  console.log("log: ", data?.expiration_time < new Date());
  if (data) {
    return next(new ErrorHandler("OTP already sent", 400));
  }
  const otp = otpGenerator();
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 5);
  const verification_data = {
    email,
    temporary_otp: otp,
    expiration_time: new Date(expirationTime),
  };
  await OTP.create(verification_data);

  const htmlTemplate = readHTMLTemplate(
    path.join(__dirname, "..", "ui/html/otp_email_template.html"),
    {
      greet:
        isAuth === "Login"
          ? "Great to see you again! Welcome back to Threads & Shades."
          : isAuth === "Register" &&
            "We’re excited you’ve joined Threads & Shades",
      otp: otp,
    }
  );
  sendEmail({
    email,
    subject: "Email verification",
    message: htmlTemplate,
  });
  res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    code: "proceed-otp",
    expires_on: expirationTime,
  });
});
// register user - /api/v1/register
exports.registerUser = catchAsyncError(async (req, res, next) => {
  const { email, otp } = req.body;
  const data = await OTP.findOne({ email });
  if (!data || data.temporary_otp !== otp) {
    return next(new ErrorHandler("Invalid OTP", 400));
  }
  const currentTime = new Date();
  const expirationTime = new Date(data.expiration_time);
  if (expirationTime < currentTime) {
    await OTP.deleteOne({ email });
    return next(new ErrorHandler("OTP has expired", 400));
  }
  const user = await User.create({ email });
  await OTP.deleteOne({ email });
  res.status(200).json({
    success: true,
    message: "Registered successfully",
    code: "proceed-verify-success",
    user,
  });
});

//login user - /api/v1/login
exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email) {
    return next(new ErrorHandler("Please enter an email", 400));
  }
  const data = await OTP.findOne({ email });
  const currentTime = new Date();
  const expirationTime = new Date(data.expiration_time);
  if (expirationTime < currentTime) {
    await OTP.deleteOne({ email });
    return next(new ErrorHandler("OTP has expired", 400));
  }
  if (!data || data.temporary_otp !== otp) {
    return next(new ErrorHandler("Invalid OTP", 400));
  }
  const user = await User.findOne({ email });
  if (!user) {
    return next(new ErrorHandler("User not found", 401));
  }
  await OTP.deleteOne({ email });
  res.status(200).json({
    success: true,
    message: "Logged In successfully",
    code: "proceed-verify-success",
    user,
  });
});

// logout - /api/v1/logout
exports.logoutUser = (req, res, next) => {
  res
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .status(200)
    .json({
      success: true,
      message: "Logged out successfully",
    });
};

// forgot password - /api/v1/password/forgot
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User not found with this email", 404));
  }
  const resetToken = user.getResetToken();
  await user.save({ validateBeforeSave: false });
  //Create reset url
  const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  const message = `Your password reset url is as follows \n\n
    ${resetUrl}\n\n If you have not requested this email, then ignore it.`;
  try {
    sendEmail({
      email: user.email,
      subject: "Mycart password Recovery",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message), 500);
  }
});

// reset password - /api/v1/password/reset/:token
exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordTokenExpire: {
      $gt: Date.now(),
    },
  });
  if (!user) {
    return next(new ErrorHandler("password reset token is invalid or expired"));
  }
  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Password does not match"));
  }
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpire = undefined;
  await user.save({ validateBeforeSave: false });
  sendToken(user, 201, res, "Password updated successfully!");
});

// Get User Profile - /api/v1/profile/get/:id

exports.getUserProfile = catchAsyncError(async (req, res, next) => {
  const user_id = req.params.id
  const user = await User.findById(user_id);
  res.status(200).json({
    success: true,
    user,
  });
});
// Get User Profile Image - /api/v1/profile/image/get/:id

exports.getUserProfileImage = catchAsyncError(async (req, res, next) => {
  const user_id = req.params.id
  const user = await User.findById(user_id);
  res.status(200).json({
    success: true,
    avatar: user?.avatar,
  });
});

// Change password - /api/v1/password/change

exports.changePassword = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  //check old password
  if (!(await user.isValidPassword(req.body.old_password))) {
    return next(new ErrorHandler("Old password is incorrect", 400));
  }
  // asigning new password
  user.password = req.body.new_password;
  await user.save();
  res.status(200).json({
    success: true,
  });
});

//Update Profile - /api/v1/profile/update/:id
exports.updateProfile = catchAsyncError(async (req, res, next) => {
  const user_id = req.params.id;
  const user_found = await User.findById(user_id)
  if(!user_found) {
    return next (new ErrorHandler("User not found", 404))
  }
  const {
    first_name,
    last_name,
    mobile_number,
    alternate_mobile_number,
    email,
    gender,
    date_of_birth,
  } = req.body;
  let newUserData = {
    first_name,
    last_name,
    mobile_number,
    alternate_mobile_number,
    email,
    gender,
    date_of_birth,
  };
  const user = await User.findOneAndUpdate({_id: user_id}, {...newUserData}, {
    new: true,
    // runValidators: true,
  });
  console.log("user: ",user);
  res.status(200).json({
    success: true,
    user,
  });
});
//Update Profile Image - /api/v1/profile/image/update/:id
exports.updateProfileImage = catchAsyncError(async (req, res, next) => {
  const user_id = req.params.id;
  const user_found = await User.findById(user_id)
  if(!user_found) {
    return next (new ErrorHandler("User not found", 404))
  }
  let avatar;
  if (req.file) {
    console.log("req.file: ", req.file);
    avatar = `${process.env.SERVER_URL}/uploads/user/${req.file.originalname}`;
  }
  const user = await User.findOneAndUpdate({_id: user_id}, {avatar}, {
    new: true,
    // runValidators: true,
  });
  console.log("user: ", user);
  res.status(200).json({
    success: true,
    avatar: user.avatar,
  });
});

//Admin:Get All users -/api/v1/admin/users
exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
});

//Admin: Get specific users -/api/v1/admin/user/:id
exports.getUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorHandler(`User not found with this id ${req.params.id}`)
    );
  }
  res.status(200).json({
    success: true,
    user,
  });
});

//  Admin: Update User  -/api/v1/admin/user/:id
exports.updateUser = catchAsyncError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

//Admin: Delete user  -/api/v1/admin/user/:id
exports.deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorHandler(`User not found with this id ${req.params.id}`)
    );
  }
  await user.remove();
  res.status(200).json({
    success: true,
  });
});
