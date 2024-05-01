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
  .post(isAuthenticatedUser, authorizeRoles("user"), addCart);
router
  .route("/cart/update")
  .post(isAuthenticatedUser, authorizeRoles("user"), updateCart);
router
  .route("/cart/:id")
  .get(isAuthenticatedUser, authorizeRoles("user"), getCartItems);
router.route("/temp/cart").post(getTemporaryCartItems);
router
  .route("/cart/remove")
  .post(isAuthenticatedUser, authorizeRoles("user"), removeCart);

module.exports = router;
