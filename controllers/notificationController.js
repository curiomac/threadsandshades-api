const catchAsyncError = require("../middlewares/catchAsyncError");
const Notification = require("../models/notificationModel");

// notifications - /api/v1/notifications/get
exports.getNotifications = catchAsyncError(async (req, res, next) => {
  const { user_id } = req.query;
  const notifications = await Notification.find({ user_id });
  const notificationsCount = notifications.length;
  const unreadNotificationsCount = notifications.filter(
    (notification) => notification.view_status === "unread"
  ).length;

  res.status(200).json({
    success: true,
    notifications,
    notificationsCount,
    unreadNotificationsCount,
  });
});
