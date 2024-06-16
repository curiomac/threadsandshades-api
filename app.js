const express = require("express");
const app = express();
const errorMiddleware = require("./middlewares/error");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const auth = require("./routes/auth");
const theme = require("./routes/theme");
const product = require("./routes/product");
const cart = require("./routes/cart");
const wishList = require("./routes/wishList");
const checkoutDetails = require("./routes/checkoutDetails");
const couponCode = require("./routes/couponCode");
const order = require("./routes/order");
const address = require("./routes/address");
const rating = require("./routes/rating");
const notification = require("./routes/notification");

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT']
};

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
  });
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/v1/", auth);
app.use("/api/v1/", theme);
app.use("/api/v1/", product);
app.use("/api/v1/", cart);
app.use("/api/v1/", wishList);
app.use("/api/v1/", checkoutDetails);
app.use("/api/v1/", couponCode);
app.use("/api/v1/", order);
app.use("/api/v1/", address);
app.use("/api/v1/", rating);
app.use("/api/v1/", notification);

app.use(errorMiddleware);

module.exports = app;
