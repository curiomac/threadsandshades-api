const catchAsyncError = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");

// get cart items - /api/v1/cart/:id
exports.getCartItems = catchAsyncError(async (req, res, next) => {
  const user_id = req.params.id;
  const cart = await Cart.findOne({ user_id });

  res.status(200).json({
    success: true,
    cart: { ...cart?.toObject(), cart_count: cart ? cart.cart_items.length : 0 },
  });
});

// add cart - /api/v1/cart/add
exports.addCart = catchAsyncError(async (req, res, next) => {
  const { product_id, user_id } = req.query;
  const [user, product] = await Promise.all([
    User.findById(user_id),
    Product.findById(product_id),
  ]);
  if (!user) {
    return next(new Error("User not found"));
  }
  if (!product) {
    return next(new Error("Product not found"));
  }
  let cart = await Cart.findOneAndUpdate(
    { user_id },
    { $addToSet: { cart_items: product } },
    { new: true }
  );
  if (!cart) {
    cart = await Cart.create({ user_id, cart_items: [product] });
  }
  res.status(200).json({
    success: true,
    cart: { ...cart?.toObject(), cart_count: cart ? cart.cart_items.length : 0 },
  });
});
