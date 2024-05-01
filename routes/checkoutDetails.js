const express = require("express");
const router = express.Router();
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../middlewares/authenticate");
const {
  getCheckoutDetails,
  getTempCheckoutDetails,
} = require("../controllers/checkoutController");

router
  .route("/checkoutdetails/:id")
  .get(isAuthenticatedUser, authorizeRoles("user"), getCheckoutDetails);
router.route("/temp/checkoutdetails").post(getTempCheckoutDetails);

module.exports = router;
