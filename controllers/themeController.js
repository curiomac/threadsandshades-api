const catchAsyncError = require('../middlewares/catchAsyncError');
const Theme = require('../models/themeModel');

// create theme - /api/v1/theme/create
exports.createTheme = catchAsyncError(async (req, res, next) => {

    const theme = await Theme.create(req.body);

    res.status(200).json({
        success: true,
        theme
    })
})

// update theme - /api/v1/theme/update/:id
exports.updateTheme = catchAsyncError(async (req, res, next) => {

    const theme = await Theme.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!theme) {
        return next(new ErrorHandler(`Theme not found with this id ${req.params.id}`))
    }
    res.status(200).json({
        success: true,
        theme
    })
})

// get theme - /api/v1/theme/get/:id
exports.getTheme = catchAsyncError(async (req, res, next) => {

    const theme = await Theme.findById(req.params.id);

    res.status(200).json({
        success: true,
        theme
    })
})