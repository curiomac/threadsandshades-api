const express = require("express");
const router = express.Router();
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../middlewares/authenticate");
const {
  createTheme,
  updateTheme,
  getTheme,
  getEntryNotification,
} = require("../controllers/themeController");

router
  .route("/theme/create")
  .post(isAuthenticatedUser, authorizeRoles("manager"), createTheme);
router
  .route("/theme/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("manager"), updateTheme);
router.route("/theme/get/:id").get(getTheme);
router.route("/enrty/notification/get").get(getEntryNotification);

module.exports = router;
