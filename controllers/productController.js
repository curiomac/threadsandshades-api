const catchAsyncError = require("../middlewares/catchAsyncError");
const Product = require("../models/productModel");
const ProductsGroup = require("../models/productsGroupModel");
const ErrorHandler = require("../utils/errorHandler");
const APIFeatures = require("../utils/apiFeatures");

// get product - /api/v1/product/:id
exports.getProduct = catchAsyncError(async (req, res, next) => {
  const product_id = req.params.id;
  const product = await Product.findById(product_id);
  const products_group = await ProductsGroup.findOne({ "group.products_group_id": product?.products_group_id });
  if (!product) {
    return next(new ErrorHandler("Product not found with this id", 404));
  }
  if (!products_group) {
    return next(new ErrorHandler("Product group not found", 404));
  }
  res.status(200).json({
    success: true,
    product,
    products_group
  });
});

// get products - /api/v1/products
exports.getProducts = catchAsyncError(async (req, res, next) => {
  const resPerPage = 1000;
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
    products_group_id,
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
  let products_group_data = await ProductsGroup.findOneAndUpdate(
    { "group.products_group_id": products_group_id },
    { $addToSet: { group: product } },
    { new: true }
  );

  if (!products_group_data) {
    products_group_data = await ProductsGroup.create({
      group: [product],
    });
  }
  res.status(200).json({
    success: true,
    product,
    message: "Product creation successful",
  });
});

// get products group -/api/v1/products/group/:id
exports.getProductsGroup = catchAsyncError(async (req, res, next) => {
  const product_group_id = req.params.id;
  const products_group = await ProductsGroup.findById(product_group_id);
  if (!products_group || products_group.length === 0) {
    return next(
      new ErrorHandler("No products found for this product group ID", 404)
    );
  }
  res.status(200).json({
    success: true,
    products_group,
  });
});

// get products groups -/api/v1/products/groups
exports.getProductsGroups = catchAsyncError(async (req, res, next) => {
  const resPerPage = 109;
  let buildQuery = () => {
    return new APIFeatures(ProductsGroup.find(), req.query).search().filter();
  };
  const filteredProductsGroupCount = await buildQuery().query.countDocuments(
    {}
  );
  const totalProductsGroupsCount = await ProductsGroup.countDocuments({});
  let productsGroupsCount = totalProductsGroupsCount;
  if (filteredProductsGroupCount !== totalProductsGroupsCount) {
    productsGroupsCount = filteredProductsGroupCount;
  }
  const currentPage = parseInt(req.query.page);
  const totalPages =
    Math.ceil(productsGroupsCount / resPerPage) > 0
      ? Math.ceil(productsGroupsCount / resPerPage)
      : 1;
  const productsGroups = await buildQuery().paginate(resPerPage).query;

  if (productsGroupsCount === 0) {
    return next(new ErrorHandler("No products groups found", 404));
  }
  res.status(200).json({
    success: true,
    resPerPage,
    totalCounts: productsGroupsCount,
    totalPages,
    currentPage,
    productsGroups,
  });
});
