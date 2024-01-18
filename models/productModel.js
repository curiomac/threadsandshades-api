const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  images: [
    {
      image: {
        type: String,
        required: true,
      },
    },
  ],
  offer_price: {
    type: String,
  },
  discount: {
    type: String,
  },
  availableColors: {
    type: Array,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

let Product = mongoose.model("Product", productSchema);

module.exports = Product;
