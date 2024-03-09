const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { createOrder } = require('../controllers/orderController');

router.route('/order/create').post(createOrder);

module.exports = router; 