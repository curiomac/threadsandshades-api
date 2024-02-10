const catchAsyncError = require("../middlewares/catchAsyncError");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorHandler");
const APIFeatures = require("../utils/apiFeatures");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

// get product - /api/v1/product/:id
exports.getProduct = catchAsyncError(async (req, res, next) => {
  const product_id = req.params.id;
  const product = await Product.findById(product_id);
  if (!product) {
    return next(new ErrorHandler("Product not found with this id", 404));
  }
  res.status(200).json({
    success: true,
    product,
  });
});

// get products - /api/v1/products
exports.getProducts = catchAsyncError(async (req, res, next) => {
  const resPerPage = 109;
  let buildQuery = () => {
    return new APIFeatures(Product.find(), req.query).search().filter();
  };
  const filteredProductCount = await buildQuery().query.countDocuments({});
  const totalProductsCount = await Product.countDocuments({});
  let productsCount = totalProductsCount;
  if (filteredProductCount !== totalProductsCount) {
    productsCount = filteredProductCount;
  }
  const currentPage = parseInt(req.query.page);
  const totalPages =
    Math.ceil(productsCount / resPerPage) > 0
      ? Math.ceil(productsCount / resPerPage)
      : 1;
  const products = await buildQuery().paginate(resPerPage).query;

  if (productsCount === 0) {
    return next(new ErrorHandler("No products found", 404));
  }
  res.status(200).json({
    success: true,
    resPerPage,
    totalCounts: productsCount,
    totalPages,
    currentPage,
    products,
  });
});
// create product -/api/v1/products/create
exports.createProduct = catchAsyncError(async (req, res, next) => {
  const {
    unit_price,
    profit_percentage,
    sale_price,
    discount_percentage,
    discount_price,
  } = req.body;
  const isValidSalePrice = () => {
    const profitMargin = profit_percentage / 100;
    const selling_price_value = unit_price * (1 + profitMargin);
    return selling_price_value.toFixed(2) === Number(sale_price).toFixed(2);
  };
  const isValidDiscountPrice = () => {
    const discountMargin = discount_percentage / 100;
    const discountPriceAmount = sale_price * discountMargin;
    console.log(
      Number(discountPriceAmount).toFixed(2),
      Number(discount_price).toFixed(2)
    );
    return (
      Number(discountPriceAmount).toFixed(2) ===
      Number(discount_price).toFixed(2)
    );
  };
  if (!isValidSalePrice()) {
    return next(new ErrorHandler("Please verify the sale price", 400));
  }
  if (!isValidDiscountPrice()) {
    return next(new ErrorHandler("Please verify the discount price", 400));
  }
  let product_images = [];
  if (req.files.length > 0) {
    req.files.forEach((file) => {
      let url = `${process.env.SERVER_URL}/uploads/product/${file.originalname}`;
      product_images.push(url);
    });
  }
  req.body.product_images = product_images;
  const fixed_price = (sale_price - discount_price).toFixed(2);
  const create_product = {
    ...req.body,
    fixed_price,
  };
  const product = await Product.create(create_product);
  res.status(200).json({
    success: true,
    product,
    message: "Product creation successful",
  });
});
