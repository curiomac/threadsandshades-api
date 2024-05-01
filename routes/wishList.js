const express = require("express");
const router = express.Router();
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../middlewares/authenticate");
const {
  moveWishList,
  getWishListItems,
  getTemporaryWishListItems,
  updateWishlist,
} = require("../controllers/wishListController");

router
  .route("/wishlist/move")
  .post(isAuthenticatedUser, authorizeRoles("user"), moveWishList);
router
  .route("/wishlist/update")
  .post(isAuthenticatedUser, authorizeRoles("user"), updateWishlist);
router
  .route("/wishlist/:id")
  .get(isAuthenticatedUser, authorizeRoles("user"), getWishListItems);
router.route("/temp/wishlist").post(getTemporaryWishListItems);

module.exports = router;
