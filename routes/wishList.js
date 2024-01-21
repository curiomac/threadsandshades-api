const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { moveWishList, getWishListItems } = require('../controllers/wishListController');

router.route('/wishlist/move').post(moveWishList);
router.route('/wishlist/:id').get(getWishListItems);


module.exports = router; 
