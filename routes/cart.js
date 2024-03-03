const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { addCart, getCartItems, removeCart, getTemporaryCartItems } = require('../controllers/cartController');

router.route('/cart/add').post(addCart);
router.route('/cart/:id').get(getCartItems);
router.route('/temp/cart').post(getTemporaryCartItems);
router.route('/cart/remove').post(removeCart);


module.exports = router; 