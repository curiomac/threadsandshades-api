const catchAsyncError = require('../middlewares/catchAsyncError');
const Product = require('../models/productModel');
const ErrorHandler = require('../utils/errorHandler');
const APIFeatures = require('../utils/apiFeatures');

// get product - /api/v1/product/:id
exports.getProduct = catchAsyncError(async (req, res, next) => {
    const product_id = req.params.id
    const product = await Product.findById(product_id);
    if (!product) {
        return next(new ErrorHandler('Product not found with this id', 404));
    }
    res.status(200).json({
        success: true,
        product
    })
})

// get products - /api/v1/products
exports.getProducts = catchAsyncError(async (req, res, next) => {
    const resPerPage = 9;
    let buildQuery = () => {
        return new APIFeatures(Product.find(), req.query).search().filter()
    }
    const filteredProductCount = await buildQuery().query.countDocuments({})
    const totalProductsCount = await Product.countDocuments({});
    let productsCount = totalProductsCount;
    if (filteredProductCount !== totalProductsCount) {
        productsCount = filteredProductCount;
    }
    const currentPage = parseInt(req.query.page)
    const totalPages = Math.ceil(productsCount / resPerPage) > 0 ? Math.ceil(productsCount / resPerPage) : 1;
    const products = await buildQuery().paginate(resPerPage).query;
    
    if (productsCount === 0) {
        return next(new ErrorHandler('No products found', 404));
    }
    res.status(200).json({
        success: true,
        resPerPage,
        totalCounts: productsCount,
        totalPages,
        currentPage,
        products
    })
})