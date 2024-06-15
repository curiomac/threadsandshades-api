const express = require("express");
const router = express.Router();
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../middlewares/authenticate");
const {
  addCart,
  getCartItems,
  removeCart,
  getTemporaryCartItems,
  updateCart,
} = require("../controllers/cartController");

router
  .route("/cart/add")
  .post(isAuthenticatedUser, authorizeRoles("user", "super_admin"), addCart);
router
  .route("/cart/update")
  .post(isAuthenticatedUser, authorizeRoles("user", "super_admin"), updateCart);
router
  .route("/cart/:id")
  .get(isAuthenticatedUser, authorizeRoles("user", "super_admin"), getCartItems);
router.route("/temp/cart").post(getTemporaryCartItems);
router
  .route("/cart/remove")
  .post(isAuthenticatedUser, authorizeRoles("user", "super_admin"), removeCart);

module.exports = router;
