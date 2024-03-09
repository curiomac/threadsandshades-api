const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  mobile_no: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  alternate_address: {
    type: String,
    default: ""
  },
  state: {
    type: String,
    required: true,
  },
  district: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  postal_code: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

let Address = mongoose.model("Address", addressSchema);

module.exports = Address;