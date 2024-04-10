const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { createOrder, getOrder, getOrders, updateOrderStaus, getOrdersAll } = require('../controllers/orderController');

router.route('/order/create').post(createOrder);
router.route('/order-status/update').put(updateOrderStaus);
router.route('/order/:id').get(getOrder);
router.route('/orders-all').get(getOrdersAll);
router.route('/orders/:id').get(getOrders);

module.exports = router; 