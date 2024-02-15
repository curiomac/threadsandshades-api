const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { getCheckoutDetails } = require('../controllers/checkoutController');

router.route('/checkoutdetails/:id').get(getCheckoutDetails);


module.exports = router; 