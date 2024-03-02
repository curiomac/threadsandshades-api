const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { createCouponCode } = require('../controllers/couponCodeController');

router.route('/couponcode/create').post(createCouponCode);


module.exports = router; 