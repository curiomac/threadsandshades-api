const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { getVehicles, getVehicle } = require('../controllers/vehicleController');

router.route('/vehicles').get(getVehicles);
router.route('/vehicle/:id').get(getVehicle);


module.exports = router; 