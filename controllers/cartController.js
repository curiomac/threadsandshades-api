const catchAsyncError = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const mongoose = require("mongoose");
const wishList = require("../models/wishListModel");

// get cart items - /api/v1/cart/:id
exports.getCartItems = catchAsyncError(async (req, res, next) => {
  const user_id = req.params.id;

  const cart = await Cart.findOne({ user_id });
  let cart_items_res = [];
  if (cart) {
    cart_items_res = await Promise.all(
      cart?.cart_items.map(async (item) => {
        const found_product = await Product.findById(item.product_id);
        return {
          selected_product_details: item.selected_product_details,
          product: found_product,
          createdAt: item?.createdAt,
        };
      })
    );
  }
  cart_items_res.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB - dateA;
  });
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
  const { cart_details, isSingle, targetProduct } = req.body;
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
  let filtered_cart_items_res = cart_items_res.filter(
    (item) => item !== undefined
  );
  filtered_cart_items_res.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB - dateA;
  });
  const verifiedTargetProduct = await Product.findById(targetProduct?._id);
  res.status(200).json({
    success: true,
    cart: {
      cart_items: filtered_cart_items_res,
      cart_count: filtered_cart_items_res ? filtered_cart_items_res.length : 0,
      added_product: isSingle ? verifiedTargetProduct : {},
      message:
        "Added to cart: Your item has been temporarily added to the cart. Please log in to continue checkout whenever you're ready.",
      toast: isSingle ? true : false,
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
    qty,
    is_from,
  } = req.body;
  const [user, product] = await Promise.all([
    User.findById(user_id),
    Product.findById(product_id),
  ]);
  const productId = mongoose.Types.ObjectId(product_id);
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
  const cart = await Cart.findOne({ user_id });
  let cart_res = {};
  if (cart) {
    const cart_product_exist = cart.cart_items.find(
      (cart_item) => cart_item.product_id.toString() === product_id
    );
    if (cart_product_exist) {
      // If product already found with the same user id in the cart, case updating the quantity;
      const productIndex = cart.cart_items.findIndex((item) =>
        item.product_id.equals(productId)
      );
      if (productIndex === -1) {
        return res
          .status(500)
          .json({ success: false, message: "Oops! Error occured!" });
      }
      cart.cart_items.splice(productIndex, 1);
      await cart.save();
      // Proccess for updating the quantity;
      let updated_selected_quantity;
      if (qty === "negative") {
        updated_selected_quantity =
          cart_product_exist?.selected_product_details?.selected_quantity -
          selected_quantity;
      } else {
        updated_selected_quantity =
          selected_quantity +
          cart_product_exist?.selected_product_details?.selected_quantity;
      }
      const updated_selected_product_details = {
        ...selected_product_details,
        selected_quantity: updated_selected_quantity,
      };
      if (updated_selected_quantity > 0) {
        cart_res = await Cart.findOneAndUpdate(
          { user_id },
          {
            $addToSet: {
              cart_items: {
                product_id: product._id,
                selected_product_details: updated_selected_product_details,
                createdAt: cart_product_exist?.createdAt,
              },
            },
          },
          { new: true }
        );
      } else {
        cart_res = await Cart.findOne({ user_id });
      }
    } else {
      cart_res = await Cart.findOneAndUpdate(
        { user_id },
        {
          $addToSet: {
            cart_items: {
              product_id: product._id,
              selected_product_details,
              createdAt: new Date(),
            },
          },
        },
        { new: true }
      );
    }
  } else {
    cart_res = await Cart.create({
      user_id,
      cart_items: [
        {
          product_id: product._id,
          selected_product_details,
          createdAt: new Date(),
        },
      ],
    });
  }
  console.log("cart_res: ", cart_res);
  let cart_items_res = await Promise.all(
    cart_res.cart_items.map(async (item) => {
      const found_product = await Product.findById(item.product_id);
      console.log("item: ", item);
      return {
        selected_product_details: item?.selected_product_details,
        product: found_product,
        createdAt: item?.createdAt,
      };
    })
  );
  console.log("cart_items_res: ", cart_items_res);
  // Sort cart_items_res by the dateCreated property of the products
  cart_items_res.sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return dateB - dateA;
  });
  if (is_from === "wishlist") {
    console.log("[logger] is__from: ", is_from);
    await wishList.findOneAndUpdate(
      { user_id },
      { $pull: { wish_list_items: { product_id: product._id } } },
      { new: true }
    );
  }
  const productData = {
    _id: product._id,
    product_images: product.product_images
  }
  res.status(200).json({
    success: true,
    cart: {
      cart_items: cart_items_res,
      cart_count: cart_res ? cart_res.cart_items.length : 0,
    },
    added_product: productData,
    message: is_from === 'qty' ? "" : "Added to cart: Your item is now in the cart and ready for checkout whenever you're ready."
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
