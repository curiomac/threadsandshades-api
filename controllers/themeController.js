const catchAsyncError = require("../middlewares/catchAsyncError");
const Theme = require("../models/themeModel");
const { sendNotification } = require("../utils/sendNotification");

// create theme - /api/v1/theme/create
exports.createTheme = catchAsyncError(async (req, res, next) => {
  const theme = await Theme.create(req.body);

  res.status(200).json({
    success: true,
    theme,
  });
});

// update theme - /api/v1/theme/update/:id
exports.updateTheme = catchAsyncError(async (req, res, next) => {
  const theme = await Theme.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!theme) {
    return next(
      new ErrorHandler(`Theme not found with this id ${req.params.id}`)
    );
  }
  res.status(200).json({
    success: true,
    theme,
  });
});

// get theme - /api/v1/theme/get/:id
exports.getTheme = catchAsyncError(async (req, res, next) => {
  const theme = await Theme.findById(req.params.id);
  res.status(200).json({
    success: true,
    theme,
  });
});
// get entry notification - /api/v1/enrty/notification/get
exports.getEntryNotification = catchAsyncError(async (req, res, next) => {
  const { token: fcmToken } = req.query;
  const notification = {
    title: "Welcome to Threads and Shades",
    body: "For more offers, please click this notification to see",
  };
  const webpush = {
    fcm_options: {
      link: "http://localhost:4040/",
    },
  };
  await sendNotification(fcmToken, notification, webpush);
  res.status(200).json({
    success: true,
  });
});
