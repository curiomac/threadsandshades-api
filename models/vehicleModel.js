const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    transmission_type: {
        type: String,
        required: [true, "Please enter transmission type" ],
        enum:{
            values: [
                'AMT',
                'MANUAL'
             ],
             message :"Please select correct transmission type"
        }
    },
    fuel_type: {
        type: String,
        required: [true, "Please enter fuel type" ],
        enum:{
            values: [
                'PETROL',
                'DEISEL',
                'CNG'
             ],
             message :"Please select correct fuel type"
        }
    },
    body_type: {
        type: String,
        required: [true, "Please enter vehicle type" ],
        enum:{
            values: [
                'SUV',
                'HATCH-BACK',
                'MUV',
                'SEDAN'
             ],
             message :"Please select correct vehicle type"
        }
    },
    images:[
        {
                image: {
                type: String,
                required: true
            }
        }
    ],
    location: {
        type: String,
        required: true
    },
    current_status: {
        type: Number,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    ratings: {
        type: String,
        default:0
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    reviews:[
        {
            user:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            rating: {
                type: String,
                required: true
            },
            comment:{
                type: String,
                required: true
            }
        }
    ],
    createdAt:{
        type: Date,
        dafault: Date.now()
    }
})


let model = mongoose.model('Vehicle', vehicleSchema);

module.exports = model;