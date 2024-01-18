const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  cart_items: {
    type: Array,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

let Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;

