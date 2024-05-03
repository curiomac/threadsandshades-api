const axios = require("axios");
const catchAsyncError = require("../middlewares/catchAsyncError");

// get postal area - /api/v1/PostalAddress/get
exports.getPostalAddress = catchAsyncError(async (req, res, next) => {
  const POSTAL_API = process.env.postal_address_API;
  const postal_address = await axios.get(`${POSTAL_API}${req.params.id}`);
  res.status(200).json({
    success: true,
    postal_address: postal_address?.data[0],
  });
});

//create address = /api/v1/address/create
exports.createAddress = catchAsyncError(async (req, res, next) => {
    const address_data = req.body;
    res.status(200).json({
      success: true,
      address_data
    });
  });