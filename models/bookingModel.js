const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    start_date: {
        type: String,
        required: true
    },
    end_date: {
        type: String,
        required: true
    },
    pickup_time: {
        type: String,
        required: true
    },
    drop_time: {
        type: String,
        required: true
    },
    pickup_location: {
        type: String,
        required: true
    },
    drop_location: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
})


let model = mongoose.model('Booking', bookingSchema);

module.exports = model;