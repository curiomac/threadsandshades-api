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

  res.status(200).json({
    success: true,
    wishList: {
      ...wishList?.toObject(),
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
    wish_list_items: { $elemMatch: { _id: product._id } },
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
    { $addToSet: { wish_list_items: product } },
    { new: true, upsert: true }
  );
  if (!wishList) {
    wishList = await WishList.create({ user_id, wish_list_items: [product] });
  }
  if (productFound) {
    const removeWishlist = await WishList.findOneAndUpdate(
      { user_id },
      { $pull: { wish_list_items: { _id: product._id } } }, 
      { new: true }
    );
    res.status(200).json({
      success: true,
      wishList: {
        ...removeWishlist?.toObject(),
        wish_list_count: removeWishlist
          ? removeWishlist.wish_list_items.length
          : 0,
      },
    });
  } else {
    res.status(200).json({
      success: true,
      wishList: {
        ...wishList?.toObject(),
        wish_list_count: wishList ? wishList.wish_list_items.length : 0,
      },
    });
  }
});
