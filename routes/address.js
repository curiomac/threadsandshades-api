const express = require("express");
const router = express.Router();
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../middlewares/authenticate");
const { createOrder } = require("../controllers/orderController");
const { getPostalAddress } = require("../controllers/addressController");

router
  .route("/PostalAddress/get/:id")
  .get(isAuthenticatedUser, authorizeRoles('user', 'super_admin'), getPostalAddress);

module.exports = router;
