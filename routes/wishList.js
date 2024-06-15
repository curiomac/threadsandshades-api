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
  .post(isAuthenticatedUser, authorizeRoles("user", "super_admin"), moveWishList);
router
  .route("/wishlist/update")
  .post(isAuthenticatedUser, authorizeRoles("user", "super_admin"), updateWishlist);
router
  .route("/wishlist/:id")
  .get(isAuthenticatedUser, authorizeRoles("user", "super_admin"), getWishListItems);
router.route("/temp/wishlist").post(getTemporaryWishListItems);

module.exports = router;
