const catchAsyncError = require("../middlewares/catchAsyncError");
const CouponCode = require("../models/couponCodeModel");
const ErrorHandler = require("../utils/errorHandler");
const moment = require("moment");

// create coupon code - /api/v1/couponcode/create
exports.createCouponCode = catchAsyncError(async (req, res, next) => {
  const {
    coupon_code,
    valid_for,
    valid_product,
    expire_on,
    usage_limit,
    discount_price,
    discount_percentage,
    mimimum_purchase_amount,
  } = req.body;
  if (!coupon_code) {
    return next(new ErrorHandler("Please provide a coupon code"));
  }
  if (!valid_for) {
    return next(new ErrorHandler("Please provide coupon valid for"));
  }
  if (!valid_product) {
    return next(new ErrorHandler("Please provide coupon valid product"));
  }
  if (!expire_on) {
    return next(new ErrorHandler("Please provide coupon expire on date"));
  }
  if (!usage_limit) {
    return next(new ErrorHandler("Please provide a coupon usage limit"));
  }
  if (!mimimum_purchase_amount) {
    return next(new ErrorHandler("Please provide a mimimum purchase amount"));
  }
  const found_coupon_code = await CouponCode.findOne({
    coupon_code: coupon_code,
  });
  if (found_coupon_code) {
    return next(new ErrorHandler("Coupon code already found"));
  }
  if (moment(expire_on) < moment(new Date())) {
    return next(new ErrorHandler("Please provide a valid expire on date"));
  }
  const coupon_data = {
    coupon_code,
    valid_for,
    valid_product,
    expire_on,
    usage_limit,
    discount_price: discount_price || 0,
    discount_percentage: discount_percentage || 0,
    discount_by: discount_price
      ? "discount_price"
      : discount_percentage
      ? "discount_percentage"
      : "",
    mimimum_purchase_amount,
    applied_users: [],
  };
  const coupon = await CouponCode.create(coupon_data);
  res.status(200).json({
    success: true,
    coupon,
  });
});
