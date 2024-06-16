const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  content: {
    type: Object,
    required: true,
  },
  view_status: {
    type: String,
    default: "unread",
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

let Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
