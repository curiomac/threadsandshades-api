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
    return next(
      new ErrorHandler("Please ensure all the fields are entered", 400)
    );
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
  /* Verifing for purchased user from the user id */
  const verified_user = product.verified_purchase_users.some(
    (user) => user.user_id === user_id
  );
  if (!verified_user) {
    return next(new ErrorHandler("Action restricted", 400));
  }
  /* Checking for product ratings */
  const ratings_found = await Ratings.findOne({ product_id: productId });
  if (ratings_found) {
    /* Proceed for found product ratings */
    /* Checking if user already rated this product */
    const user_rating_found = ratings_found.reviews.some(
      (review) => review.user_id === user_id
    );
    if (user_rating_found) {
      return next(new ErrorHandler("You have already rated this product", 400));
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
    await Ratings.findOneAndUpdate(
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
    await Ratings.create(payload);
  }
  /* Formating response for ratings (Only if ratings found) */
  // const formatted_ratings = await Promise.all(
  //   rating.reviews.map(async (item) => {
  //     const userId = mongoose.Types.ObjectId(item.user_id);
  //     const user = await User.findById(userId);
  //     return {
  //       ...item,
  //       user,
  //     };
  //   })
  // );
  res.status(200).json({
    success: true,
    // ratings: ratings_found
    //   ? { ...ratings_found._doc, reviews: formatted_ratings.sort((a, b) => new Date(b.posted_on) - new Date(a.posted_on)) }
    //   : rating,
    message: "Review submitted successfully!",
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
  const getRatingsCountsByStar = () => {
    /* Initialising the counts */

    let ratingsCount = {
      star_1: 0,
      star_2: 0,
      star_3: 0,
      star_4: 0,
      star_5: 0,
    };

    /* Updating Counts from reviews */
    ratings_found.reviews.forEach((review) => {
      switch (review.rating_value?.toString()) {
        case "1":
          ratingsCount.star_1++;
          break;
        case "2":
          ratingsCount.star_2++;
          break;
        case "3":
          ratingsCount.star_3++;
          break;
        case "4":
          ratingsCount.star_4++;
          break;
        case "5":
          ratingsCount.star_5++;
          break;
        default:
          break;
      }
    });

    return ratingsCount;
  };
  console.log("getRatingsCountsByStar: ", getRatingsCountsByStar());
  const getRatingsCountTotal = () => {
    /* Calculating total ratings count */
    const ratingsCounts = getRatingsCountsByStar();
    const totalNumberOfRatings =
      ratingsCounts.star_1 +
      ratingsCounts.star_2 +
      ratingsCounts.star_3 +
      ratingsCounts.star_4 +
      ratingsCounts.star_5;
      return totalNumberOfRatings
  }
  const getTotalRatings = () => {
    /* Calculating total ratings */
    const ratingsCounts = getRatingsCountsByStar();
    const totalRatings =
      ratingsCounts.star_1 +
      ratingsCounts.star_2 * 2 +
      ratingsCounts.star_3 * 3 +
      ratingsCounts.star_4 * 4 +
      ratingsCounts.star_5 * 5;
    return totalRatings / getRatingsCountTotal();
  };

  const formatted_ratings = await Promise.all(
    ratings_found.reviews.map(async (item) => {
      
      const userId = mongoose.Types.ObjectId(item.user_id);
      const user = await User.findById(userId);
      return {
        ...item,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar,
      };
    })
  );
  res.status(200).json({
    success: true,
    ratings: {
      ...ratings_found._doc,
      reviews: formatted_ratings.sort((a, b) => new Date(b.posted_on) - new Date(a.posted_on)),
      ratings_count: getRatingsCountTotal(),
      total_ratings: getTotalRatings().toFixed(1).toString(),
      ratings_counts_by_star: getRatingsCountsByStar(),
    },
    message: null,
  });
});
