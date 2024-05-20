const express = require("express");
const router = express.Router();
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../middlewares/authenticate");
const {
  getProducts,
  getProduct,
  createProduct,
  getProductsGroup,
  getProductsGroups,
  getSimilarProducts,
  getTopProducts,
} = require("../controllers/productController");
const multer = require("multer");
const path = require("path");

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "..", "uploads/product"));
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
});
router.route("/products").get(getProducts);
router.route("/similar/products").get(getSimilarProducts);
router.route("/top/products").get(getTopProducts);
router.route("/product/:id").get(getProduct);
router.route("/products/groups").get(getProductsGroups);
router.route("/products/group/:id").get(getProductsGroup);
router.route("/product/create").post(
  // isAuthenticatedUser,
  // authorizeRoles("admin", "manager"),
  upload.array("product_images"),
  createProduct
);

module.exports = router;
