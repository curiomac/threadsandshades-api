const mongoose = require("mongoose");

const couponCodeSchema = new mongoose.Schema({
  coupon_code: {
    type: String,
    required: true,
  },
  valid_for: {
    type: String,
    required: true,
  },
  expire_on: {
    type: String,
    required: true,
  },
  usage_limit: {
    type: String,
    required: true,
  },
  discount_price: {
    type: String,
    required: true,
  },
  mimimum_purchase_amount: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

let CouponCode = mongoose.model("CouponCode", couponCodeSchema);

module.exports = CouponCode;

