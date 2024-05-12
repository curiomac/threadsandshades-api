const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
    mode: {
        type: Number,
        required: true
    },
    primary_color: {
        type: String,
        required: true
    },
    secondary_color: {
        type: String,
        required: true
    },
    ternary_color: {
        type: String,
        required: true
    },
    default_color: {
        type: String,
        required: true
    }
})


let model = mongoose.model('Theme', themeSchema);

module.exports = model;