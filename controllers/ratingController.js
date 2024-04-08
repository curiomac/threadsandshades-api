const catchAsyncError = require("../middlewares/catchAsyncError");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Ratings = require("../models/ratingsModel");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");

// create rating - /api/v1/rating/create
exports.createRating = catchAsyncError(async (req, res, next) => {
  const {
    user_id,
    product_id,
    rating_value,
    review_title,
    product_review,
    product_recommend,
  } = req.body;
  /* Ensuring all the fields are positive */
  if (
    !user_id ||
    !product_id ||
    !rating_value ||
    !review_title ||
    !product_review ||
    !product_recommend
  ) {
    return next(new ErrorHandler("All the fields are required", 400));
  }
  /* Verifing user from the user id */
  const user = await User.findById(user_id);
  if (!user) {
    return next(new ErrorHandler("User not found with this id", 404));
  }
  /* Verifing product from the product id */
  const productId = mongoose.Types.ObjectId(product_id);
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product not found with this id", 404));
  }
  /* Checking for product ratings */
  const ratings_found = await Ratings.findOne({ product_id: productId });
  let rating;
  if (ratings_found) {
    /* Proceed for found product ratings */
    /* Checking if user already rated this product */
    const user_rating_found = ratings_found.reviews.some(
      (review) => review.user_id === user_id
    );
    console.log("user_rating_found: ", user_rating_found);
    if (user_rating_found) {
      return next(new ErrorHandler("User already rated this product", 400));
    }
    /* Calculating overall ratings value */
    const payload = {
      user_id,
      rating_value,
      review_title,
      product_review,
      product_recommend,
      posted_on: new Date(),
    };
    rating = await Ratings.findOneAndUpdate(
      { product_id: productId },
      {
        $addToSet: {
          reviews: {
            ...payload,
          },
        },
      },
      { new: true }
    );
  } else {
    /* Proceed for product ratings not found  */
    const payload = {
      product_id: product_id,
      ratings_value: rating_value,
      total_ratings: rating_value,
      reviews: [
        {
          user_id,
          rating_value,
          review_title,
          product_review,
          product_recommend,
          posted_on: new Date(),
        },
      ],
    };
    rating = await Ratings.create(payload);
  }
  const formatted_ratings = await Promise.all(
    rating.reviews.map(async (item) => {
      console.log("item: ", item);
      const userId = mongoose.Types.ObjectId(item.user_id);
      const user = await User.findById(userId);
      return {
        ...item,
        user,
      };
    })
  );
  res.status(200).json({
    success: true,
    ratings: { ...ratings_found._doc, reviews: formatted_ratings },
  });
});

// get ratings - /api/v1/ratings/get
exports.getRatings = catchAsyncError(async (req, res, next) => {
  const { product_id } = req.query;
  /* Checking for product id */
  if (!product_id) {
    return next(new ErrorHandler("Product id not found", 400));
  }
  /* Verifing product from the product id */
  const productId = mongoose.Types.ObjectId(product_id);
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product not found with this id", 404));
  }
  /* Checking for product ratings */
  const ratings_found = await Ratings.findOne({ product_id: productId });
  if (!ratings_found) {
    return res.status(200).json({
      success: true,
      ratings: {},
    });
  }
  const formatted_ratings = await Promise.all(
    ratings_found.reviews.map(async (item) => {
      console.log("item: ", item);
      const userId = mongoose.Types.ObjectId(item.user_id);
      const user = await User.findById(userId);
      return {
        ...item,
        user,
      };
    })
  );
  res.status(200).json({
    success: true,
    ratings: { ...ratings_found._doc, reviews: formatted_ratings },
  });
});
