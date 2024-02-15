const catchAsyncError = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const mongoose = require("mongoose");

// get cart items - /api/v1/cart/:id
exports.getCartItems = catchAsyncError(async (req, res, next) => {
  const user_id = req.params.id;
  const cart = await Cart.findOne({ user_id });
  const cart_items_res = await Promise.all(
    cart.cart_items.map(async (item) => {
      const found_product = await Product.findById(item.product_id);
      return {
        selected_product_details: item.selected_product_details,
        product: found_product,
      };
    })
  );
  res.status(200).json({
    success: true,
    cart: {
      cart_items: cart_items_res,
      cart_count: cart ? cart.cart_items.length : 0,
    },
  });
});

// add cart - /api/v1/cart/add
exports.addCart = catchAsyncError(async (req, res, next) => {
  const {
    product_id,
    user_id,
    selected_color,
    selected_color_code,
    selected_size,
    selected_quantity,
  } = req.body;
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
  if (!selected_color || !selected_color_code || !selected_size) {
    return next(new Error("Please provide all details"));
  }
  const selected_product_details = {
    selected_color,
    selected_color_code,
    selected_size,
    selected_quantity,
  };
  let cart = await Cart.findOneAndUpdate(
    { user_id },
    {
      $addToSet: {
        cart_items: { product_id: product._id, selected_product_details },
      },
    },
    { new: true }
  );
  if (!cart) {
    cart = await Cart.create({
      user_id,
      cart_items: [{ product_id: product._id, selected_product_details }],
    });
  }
  const cart_items_res = await Promise.all(
    cart.cart_items.map(async (item) => {
      const found_product = await Product.findById(item.product_id);
      return {
        selected_product_details: item.selected_product_details,
        product: found_product,
      };
    })
  );
  
  res.status(200).json({
    success: true,
    cart: {
      cart_items: cart_items_res,
      cart_count: cart ? cart.cart_items.length : 0,
    },
  });
});

// remove cart - /api/v1/cart/remove
exports.removeCart = catchAsyncError(async (req, res, next) => {
  const { product_id, user_id } = req.query;
  const productId = mongoose.Types.ObjectId(product_id);
  const user = await User.findById(user_id);

  if (!user) {
    return next(new Error("User not found"));
  }

  const product = await Product.findById(product_id);

  if (!product) {
    return next(new Error("Product not found"));
  }

  const cart = await Cart.findOne({ user_id });

  if (!cart) {
    return res.status(404).json({ success: false, message: "Cart not found" });
  }

  const productIndex = cart.cart_items.findIndex((item) =>
    item.product_id.equals(productId)
  );

  if (productIndex === -1) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found in cart" });
  }
  cart.cart_items.splice(productIndex, 1);

  await cart.save();

  const cart_items_res = await Promise.all(
    cart.cart_items.map(async (item) => {
      const found_product = await Product.findById(item.product_id);
      return {
        selected_product_details: item.selected_product_details,
        product: found_product,
      };
    })
  );
  res.status(200).json({
    success: true,
    cart: {
      cart_items: cart_items_res,
      cart_count: cart ? cart.cart_items.length : 0,
    },
  });
});
