const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  order_items: {
    type: Array,
    required: true,
  },
  payment_method: {
    type: String,
    required: true,
  },
  payment_status: {
    type: String,
    required: true,
  },
  billing_address: {
    type: Object,
    required: true,
  },
  shipping_address_id: {
    type: String,
    required: true,
  },
  expected_delivery_date: {
    type: String,
    required: true,
  },
  order_summary: {
    type: Object,
    required: true,
  },
  order_status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "canceled"],
    default: "pending",
  },
  additional_notes: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

let Order = mongoose.model("Order", orderSchema);

module.exports = Order;
