const product = require('../data/product.json');
const { Product } = require('../models/productModel');
const dotenv = require('dotenv');
const connectDatabase = require('../config/database');

dotenv.config({ path: 'config/config.env' });
connectDatabase();

const seedProduct = async () => {
    try {
        await Product.deleteMany();
        console.log('Products deleted');
        await Product.insertMany(product);
        console.log('All products added');
    } catch (error) {
        console.log(error.message);
    }
    process.exit();
};

seedProduct();
