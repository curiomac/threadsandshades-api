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
  let cart_items_res = []
  if(cart) {
    cart_items_res = await Promise.all(
    cart?.cart_items.map(async (item) => {
      const found_product = await Product.findById(item.product_id);
      return {
        selected_product_details: item.selected_product_details,
        product: found_product,
      };
    })
  );
  }
  res.status(200).json({
    success: true,
    cart: {
      cart_items: cart_items_res,
      cart_count: cart ? cart.cart_items.length : 0,
    },
  });
});
// get temporary cart items - /api/v1/temp/cart
exports.getTemporaryCartItems = catchAsyncError(async (req, res, next) => {
  const { cart_details } = req.body;
  let remove_product_ids = [];
  const cart_items_res = await Promise.all(
    cart_details.map(async (item) => {
      const found_product = await Product.findById(item.product_id);
      if (found_product) {
        const { selected_color, selected_size, selected_color_code } =
          item.selected_product_details;
        if (
          found_product.target_color === selected_color &&
          found_product.target_color_code === selected_color_code &&
          found_product.available_sizes.some(
            (available_size) => available_size === selected_size
          )
        ) {
          return {
            selected_product_details: item.selected_product_details,
            product: found_product,
          };
        } else {
          remove_product_ids = [...remove_product_ids, found_product._id];
        }
      } else {
        remove_product_ids = [...remove_product_ids, item.product_id];
      }
    })
  );
  const filtered_cart_items_res = cart_items_res.filter(
    (item) => item !== undefined
  );
  res.status(200).json({
    success: true,
    cart: {
      cart_items: filtered_cart_items_res,
      cart_count: filtered_cart_items_res ? filtered_cart_items_res.length : 0,
    },
    remove_product_ids,
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
// update cart - /api/v1/cart/update
exports.updateCart = catchAsyncError(async (req, res, next) => {
  const { user_id, cart_details } = req.body;
  if (!user_id) {
    return next(new Error("Provide a user id"));
  }
  const user = await User.findById(user_id);
  if (!user) {
    return next(new Error("User not found"));
  }
  const found_cart = await Cart.findOne({ user_id });
  const cart_items_payload = await Promise.all(
    cart_details.map(async (item) => {
      const found_product = await Product.findById(item.product_id);
      if (found_product) {
        const { selected_color, selected_size, selected_color_code } =
          item.selected_product_details;
        if (selected_color || selected_size || selected_color_code) {
          if (
            found_product.target_color === selected_color &&
            found_product.target_color_code === selected_color_code &&
            found_product.available_sizes.some(
              (available_size) => available_size === selected_size
            )
          ) {
            if (
              found_cart &&
              found_cart.cart_items.some(
                (cart_item) =>
                  cart_item.product_id.toString() === item.product_id
              )
            ) {
              return;
            } else {
              return {
                selected_product_details: item.selected_product_details,
                product: found_product,
              };
            }
          }
        }
      }
    })
  );
  const cartItems = cart_items_payload.filter((item) => item !== undefined);
  const formatedCartItems = cartItems.map((item) => {
    return {
      selected_product_details: item?.selected_product_details,
      product_id: item?.product?._id,
    };
  });
  let cart = [];
  if (found_cart) {
    const prevCartItemsMerge = [...found_cart.cart_items, ...formatedCartItems];
    cart = await Cart.findOneAndUpdate(
      { user_id },
      {
        $set: {
          cart_items: prevCartItemsMerge,
        },
      },
      { new: true }
    );
  } else {
    cart = await Cart.create({
      user_id,
      cart_items: formatedCartItems,
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
