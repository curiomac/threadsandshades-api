const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { createOrder, getOrder, getOrders } = require('../controllers/orderController');

router.route('/order/create').post(createOrder);
router.route('/order/:id').get(getOrder);
router.route('/orders/:id').get(getOrders);

module.exports = router; 