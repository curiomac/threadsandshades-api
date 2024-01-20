const mongoose = require("mongoose");

const wishListSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
  },
  wish_list_items: {
    type: Array,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

let wishList = mongoose.model("wishList", wishListSchema);

module.exports = wishList;

