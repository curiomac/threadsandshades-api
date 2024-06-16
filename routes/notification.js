const express = require("express");
const router = express.Router();
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../middlewares/authenticate");
const { getNotifications } = require("../controllers/notificationController");

router
  .route("/notifications/get")
  .get(getNotifications);

module.exports = router;
