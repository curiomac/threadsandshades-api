const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  products_group_id: {
    type: String,
    required: [true, "Please enter the product group id"],
  },
  product_title: {
    type: String,
    required: [true, "Please enter product title"],
  },
  product_label: {
    type: String,
    required: [true, "Please enter product label"],
  },
  product_images: {
    type: Array,
    required: [true, "Please add product images"],
  },
  product_tags: {
    type: Array,
    required: [true, "Please add product tags"],
  },
  product_type: {
    type: String,
    required: [true, "Please select a product type"],
  },
  target_gender: {
    type: String,
    required: [true, "Please select a target gender"],
  },
  target_color: {
    type: String,
    required: [true, "Please select target color"],
  },
  target_color_code: {
    type: String,
    required: [true, "Please select color code"],
  },
  available_sizes: {
    type: Array,
    required: [true, "Please add available sizes"],
  },
  out_of_stock_sizes: {
    type: Array,
    required: [true, "Please add out of stock sizes"],
  },
  available_quantity: {
    type: String,
    required: [true, "Please enter available quantity"],
  },
  minimum_quantity: {
    type: String,
    required: [true, "Please enter minimum quantity"],
  },
  maximum_quantity: {
    type: String,
    required: [true, "Please enter maximum quantity"],
  },
  unit_price: {
    type: String,
    required: [true, "Please enter unit price"],
  },
  profit_percentage: {
    type: String,
    required: [true, "Please enter profit percentage"],
  },
  sale_price: {
    type: String,
    required: [true, "Please enter sale price"],
  },
  discount_percentage: {
    type: String,
    required: [true, "Please enter discount percentage"],
  },
  discount_price: {
    type: String,
    required: [true, "Please enter discount price"],
  },
  fixed_price: {
    type: String,
  },
  discount_start_date: {
    type: String,
    required: [true, "Please enter discount start date"],
  },
  discount_end_date: {
    type: String,
    required: [true, "Please enter discount end date"],
  },
  is_discounted_product: {
    type: Boolean,
    default: false,
  },
  return_days: {
    type: String,
    required: [true, "Please enter return days"],
  },
  exchange_days: {
    type: String,
    required: [true, "Please enter exchange days"],
  },
  delivery_within_local: {
    type: String,
    required: [true, "Please enter delivery within local"],
  },
  delivery_within_district: {
    type: String,
    required: [true, "Please enter delivery within district"],
  },
  delivery_within_state: {
    type: String,
    required: [true, "Please enter delivery within state"],
  },
  delivery_inter_state: {
    type: String,
    required: [true, "Please enter delivery inter state"],
  },
  product_status: {
    type: String,
    required: [true, "Please enter product status"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

let Product = mongoose.model("Product", productSchema);

module.exports = Product;
