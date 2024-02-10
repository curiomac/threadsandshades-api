const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  group: {
    type: Array,
    required: true,
  },
});

let Product = mongoose.model("ProductsGroup", productSchema);

module.exports = Product;
