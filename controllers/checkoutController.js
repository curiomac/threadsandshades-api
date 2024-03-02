const catchAsyncError = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const CouponCode = require("../models/couponCodeModel");
const moment = require("moment");
// get checkout details - /api/v1/checkoutdetails/:id
exports.getCheckoutDetails = catchAsyncError(async (req, res, next) => {
  const { coupon_code } = req.query;
  const user_id = req.params.id;
  if (!user_id) {
    return next(new ErrorHandler("Please provide the user id"));
  }
  const user = await User.findById(user_id);
  if (!user) {
    return next(new Error("User not found"));
  }

  const cart = await Cart.findOne({ user_id });
  if (!cart) {
    return next(new Error("Cart item not found"));
  }

  const cartItems = cart.cart_items;

  const cartItemsProducts = await Promise.all(
    cartItems.map(async (item) => {
      const foundProduct = await Product.findById(item.product_id);
      return {
        selected_product_details: item.selected_product_details,
        product: foundProduct,
      };
    })
  );

  const totalMRP = cartItemsProducts.reduce((acc, item) => {
    return acc + parseFloat(item.product.fixed_price);
  }, 0);

  const DISCOUNT_DELIVERY_CHARGE = 500;
  const shippingCharges = cartItemsProducts.map((cartItemProduct) => {
    return {
      delivery_charge: cartItemProduct.product.delivery_within_state,
    };
  });

  const calculatedDeliveryCharge = shippingCharges.reduce(
    (acc, item) => {
      const charge = parseFloat(item.delivery_charge);
      const max = acc.cost;
      const discountedCharge =
        totalMRP >= DISCOUNT_DELIVERY_CHARGE ? 0 : charge;
      return {
        cost: charge > max ? charge : max,
        discounted_delivery_charge: discountedCharge,
      };
    },
    { cost: 0, discounted_delivery_charge: 0 }
  );
  const cartTotal =
    totalMRP + calculatedDeliveryCharge.discounted_delivery_charge;

  let coupon_discount = 0;
  let coupon_discounted_total = 0;
  let coupon_applied = false;
  if (coupon_code) {
    const found_coupon_code = await CouponCode.findOne({
      coupon_code: coupon_code,
    });
    if (found_coupon_code) {
      const coupon_already_applied = found_coupon_code.applied_users.some(
        (userId) => userId.toString() === user._id.toString()
      );
      if (coupon_already_applied) {
        return next(new ErrorHandler("Coupon code already used"));
      }
      if (moment(found_coupon_code.expire_on) < moment(new Date())) {
        return next(new ErrorHandler("Coupon code expired"));
      }
      if (totalMRP >= found_coupon_code.mimimum_purchase_amount) {
        // const update_coupon = await CouponCode.findOneAndUpdate(
        //   { coupon_code: coupon_code },
        //   { $addToSet: { applied_users: user._id } },
        //   { new: true }
        // );
        if (found_coupon_code.discount_by === "discount_price") {
          coupon_discounted_total =
            cartTotal - parseFloat(found_coupon_code.discount_price);
          coupon_discount = cartTotal - coupon_discounted_total;
        } else if (found_coupon_code.discount_by === "discount_percentage") {
          const coupon_discount_persentage =
            (cartTotal * parseFloat(found_coupon_code.discount_percentage)) /
            100;
          coupon_discounted_total = cartTotal - coupon_discount_persentage;
          coupon_discount = cartTotal - coupon_discounted_total;
        }
        coupon_applied = true;
      } else {
        return next(
          new ErrorHandler(
            `Total MRP should above ${found_coupon_code.mimimum_purchase_amount}`
          )
        );
      }
    } else {
      return next(new ErrorHandler("Invalid coupon code"));
    }
  }
  res.status(200).json({
    success: true,
    checkout_details: {
      total_mrp: totalMRP,
      shipping_charge: calculatedDeliveryCharge.cost,
      discounted_delivery_charge:
        calculatedDeliveryCharge.discounted_delivery_charge,
      cart_total: coupon_applied ? coupon_discounted_total : cartTotal,
      coupon_discount,
      coupon_applied: coupon_applied,
      coupon_code: coupon_applied ? coupon_code : "",
    },
  });
});
