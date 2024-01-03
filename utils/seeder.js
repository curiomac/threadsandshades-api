const vehicle = require('../data/vehicle.json');
const Vehicle = require('../models/vehicleModel');
const dotenv = require('dotenv');
const connectDatabase = require('../config/database')

dotenv.config({path: 'config/config.env'});
connectDatabase();

const seedProducts = async ()=>{
    try{
    await Vehicle.deleteMany();
    console.log('vehicles deleted')
    await Vehicle.insertMany(vehicle);
    console.log('All vehicles added')
    }catch (error){
        console.log(error.message);
    }
    process.exit();
}

seedProducts();