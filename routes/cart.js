const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { addCart, getCartItems } = require('../controllers/cartController');

router.route('/cart/add').post(addCart);
router.route('/cart/:id').get(getCartItems);


module.exports = router; 