const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { moveWishList, getWishListItems, getTemporaryWishListItems, updateWishlist } = require('../controllers/wishListController');

router.route('/wishlist/move').post(moveWishList);
router.route('/wishlist/update').post(updateWishlist);
router.route('/wishlist/:id').get(getWishListItems);
router.route('/temp/wishlist').post(getTemporaryWishListItems);

module.exports = router; 