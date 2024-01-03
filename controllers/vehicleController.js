const catchAsyncError = require('../middlewares/catchAsyncError');
const Vehicle = require('../models/vehicleModel');
const ErrorHandler = require('../utils/errorHandler');
const APIFeatures = require('../utils/apiFeatures');

// get vehicle - /api/v1/vehicle/:id
exports.getVehicle = catchAsyncError(async (req, res, next) => {
    const vehicle_id = req.params.id
    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle) {
        return next(new ErrorHandler('Vehicle not found with this id', 404));
    }
    res.status(200).json({
        success: true,
        vehicle
    })
})

// get vehicles - /api/v1/vehicles
exports.getVehicles = catchAsyncError(async (req, res, next) => {
    const resPerPage = 9;
    let buildQuery = () => {
        return new APIFeatures(Vehicle.find(), req.query).search().filter()
    }
    const filteredVehicleCount = await buildQuery().query.countDocuments({})
    const totalVehiclesCount = await Vehicle.countDocuments({});
    let vehiclesCount = totalVehiclesCount;
    if (filteredVehicleCount !== totalVehiclesCount) {
        vehiclesCount = filteredVehicleCount;
    }
    const currentPage = parseInt(req.query.page)
    const totalPages = Math.ceil(vehiclesCount / resPerPage) > 0 ? Math.ceil(vehiclesCount / resPerPage) : 1;
    const vehicles = await buildQuery().paginate(resPerPage).query;
    
    if (vehiclesCount === 0) {
        return next(new ErrorHandler('No vehicles found', 404));
    }
    res.status(200).json({
        success: true,
        resPerPage,
        totalCounts: vehiclesCount,
        totalPages,
        currentPage,
        vehicles
    })
})