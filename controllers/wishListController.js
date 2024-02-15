const catchAsyncError = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const WishList = require("../models/wishListModel");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

// get wishList items - /api/v1/wishlist/:id
exports.getWishListItems = catchAsyncError(async (req, res, next) => {
  const user_id = req.params.id;
  const wishList = await WishList.findOne({ user_id });
  const wish_list_res = await Promise.all(
    wishList.wish_list_items.map(async (item) => {
      const found_product = await Product.findById(item.product_id);
      return {
        ...found_product._doc,
      };
    })
  )
  res.status(200).json({
    success: true,
    wishList: {
      wish_list_items: wish_list_res,
      wish_list_count: wishList ? wishList.wish_list_items.length : 0,
    },
  });
});

// move wishList - /api/v1/wishlist/move
exports.moveWishList = catchAsyncError(async (req, res, next) => {
  const { product_id, user_id, is_from } = req.query;
  const user = await User.findById(user_id);
  if (!user) {
    return next(new Error("User not found"));
  }
  const product = await Product.findById(product_id);
  if (!product) {
    return next(new Error("Product not found"));
  }
  const productFound = await WishList.findOne({
    user_id,
    wish_list_items: { $elemMatch: { product_id: product._id } },
  });
  if (is_from === "cart") {
    await Cart.findOneAndUpdate(
      { user_id },
      { $pull: { cart_items: { _id: product._id } } },
      { new: true }
    );
  }
  let wishList = await WishList.findOneAndUpdate(
    { user_id },
    { $addToSet: { wish_list_items: {product_id: product._id} } },
    { new: true, upsert: true }
  );
  if (!wishList) {
    wishList = await WishList.create({ user_id, wish_list_items: [{product_id: product._id}] });
  }
  if (productFound) {
    const removeWishlist = await WishList.findOneAndUpdate(
      { user_id },
      { $pull: { wish_list_items: { product_id: product._id } } }, 
      { new: true }
    );
    const wish_list_res = await Promise.all(
      removeWishlist.wish_list_items.map(async (item) => {
        const found_product = await Product.findById(item.product_id);
        return {
          ...found_product._doc,
        };
      })
    )
    res.status(200).json({
      success: true,
      wishList: {
        wish_list_items: wish_list_res,
        wish_list_count: removeWishlist
          ? removeWishlist.wish_list_items.length
          : 0,
      },
    });
  } else {
    const wish_list_res = await Promise.all(
      wishList.wish_list_items.map(async (item) => {
        const found_product = await Product.findById(item.product_id);
        return {
          ...found_product._doc,
        };
      })
    )
    res.status(200).json({
      success: true,
      wishList: {
        wish_list_items: wish_list_res,
        wish_list_count: wishList ? wishList.wish_list_items.length : 0,
      },
    });
  }
});
