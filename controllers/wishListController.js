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
  );
  res.status(200).json({
    success: true,
    wishList: {
      wish_list_items: wish_list_res,
      wish_list_count: wishList ? wishList.wish_list_items.length : 0,
    },
  });
});

// get temporary wishlist items - /api/v1/temp/wishlist
exports.getTemporaryWishListItems = catchAsyncError(async (req, res, next) => {
  const { wish_list_details, isSingle, targetProduct } = req.body;
  let remove_product_ids = [];
  const wish_list_res = await Promise.all(
    wish_list_details.map(async (item) => {
      const found_product = await Product.findById(item.product_id);
      if (found_product) {
        return {
          ...found_product._doc,
        };
      } else {
        remove_product_ids = [...remove_product_ids, item.product_id];
      }
    })
  );
  const filtered_wish_list_res = wish_list_res.filter(
    (item) => item !== undefined
  );
  const verifiedTargetProduct = await Product.findById(targetProduct?._id);
  res.status(200).json({
    success: true,
    wishList: {
      wish_list_items: filtered_wish_list_res,
      wish_list_count: filtered_wish_list_res
        ? filtered_wish_list_res.length
        : 0,
      added_product: isSingle ? verifiedTargetProduct : {},
      message:
        "Your item has been temporarily added to the wish list and is ready to be added to the cart whenever you're ready.",
      toast: isSingle ? true : false,
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
      { $pull: { cart_items: { product_id: product._id } } },
      { new: true }
    );
  }
  let wishList = await WishList.findOneAndUpdate(
    { user_id },
    { $addToSet: { wish_list_items: { product_id: product._id } } },
    { new: true, upsert: true }
  );
  if (!wishList) {
    wishList = await WishList.create({
      user_id,
      wish_list_items: [{ product_id: product._id }],
    });
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
    );
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
    );
    res.status(200).json({
      success: true,
      wishList: {
        wish_list_items: wish_list_res,
        wish_list_count: wishList ? wishList.wish_list_items.length : 0,
        added_product: product || {},
        message:
          "Your item has ben added to the wish list and is ready to be added to the cart whenever you're ready.",
        toast: true,
      },
    });
  }
});

// update wishlist - /api/v1/wishlist/update
exports.updateWishlist = catchAsyncError(async (req, res, next) => {
  const { user_id, wish_list_details } = req.body;
  if (!user_id) {
    return next(new Error("Provide a user id"));
  }
  const user = await User.findById(user_id);
  if (!user) {
    return next(new Error("User not found"));
  }
  const found_wish_list = await WishList.findOne({ user_id });
  const wish_list_payload = await Promise.all(
    wish_list_details.map(async (item) => {
      const found_product = await Product.findById(item.product_id);
      if (found_product) {
        if (
          found_wish_list &&
          found_wish_list.wish_list_items.some(
            (wish_list_item) =>
              wish_list_item.product_id.toString() === item.product_id
          )
        ) {
          return;
        } else {
          return {
            product: found_product,
          };
        }
      }
    })
  );
  const wishListItems = wish_list_payload.filter((item) => item !== undefined);
  const formatedWishListItems = wishListItems.map((item) => {
    return {
      product_id: item?.product?._id,
    };
  });
  let wish_list = [];
  if (found_wish_list) {
    const prevWishListItemsMerge = [
      ...found_wish_list.wish_list_items,
      ...formatedWishListItems,
    ];
    wish_list = await WishList.findOneAndUpdate(
      { user_id },
      {
        $set: {
          wish_list_items: prevWishListItemsMerge,
        },
      },
      { new: true }
    );
  } else {
    wish_list = await WishList.create({
      user_id,
      wish_list_items: formatedWishListItems,
    });
  }
  const wish_list_items_res = await Promise.all(
    wish_list.wish_list_items.map(async (item) => {
      const found_product = await Product.findById(item.product_id);
      return {
        product: found_product,
      };
    })
  );

  res.status(200).json({
    success: true,
    wish_list: {
      wish_list_items: wish_list_items_res,
      wish_list_count: wish_list_items_res ? wish_list_items_res?.length : 0,
    },
  });
});
