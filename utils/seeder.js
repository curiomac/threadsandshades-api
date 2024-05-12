const theme = require('../data/theme.json');
const Theme = require('../models/themeModel');
const dotenv = require('dotenv');
const connectDatabase = require('../config/database');

dotenv.config({ path: 'config/config.env' });
connectDatabase();

const seedProduct = async () => {
    try {
        await Theme.deleteMany();
        console.log('Products deleted');
        await Theme.insertMany(theme);
        console.log('All products added');
    } catch (error) {
        console.log(error.message);
    }
    process.exit();
};

seedProduct();
