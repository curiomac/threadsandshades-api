const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/authenticate');
const { createTheme, updateTheme, getTheme } = require('../controllers/themeController');

router.route('/theme/create').post(createTheme);
router.route('/theme/update/:id').put(updateTheme);
router.route('/theme/get/:id').get(getTheme);


module.exports = router; 