const catchAsyncError = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

// get checkout details - /api/v1/checkoutdetails/:id
exports.getCheckoutDetails = catchAsyncError(async (req, res, next) => {
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
        discounted_charge: discountedCharge,
      };
    },
    { cost: 0, discounted_charge: 0 }
  );

  const cartTotal = totalMRP + calculatedDeliveryCharge.discounted_charge;

  res.status(200).json({
    success: true,
    checkout_details: {
      total_mrp: totalMRP,
      shipping_charge: calculatedDeliveryCharge.cost,
      discounted_delivery_charge: calculatedDeliveryCharge.discounted_charge,
      cart_total: cartTotal,
    },
  });
});
