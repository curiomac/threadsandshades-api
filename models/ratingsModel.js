const mongoose = require('mongoose');

const ratingsSchema = new mongoose.Schema({
    product_id: {
        type: String,
        required: true
    },
    ratings_value: {
        type: String,
        required: true
    },
    total_ratings: {
        type: String,
        required: true
    },
    reviews: {
        type: Array,
        required: true
    },
})

let model = mongoose.model('Ratings', ratingsSchema);

module.exports = model;