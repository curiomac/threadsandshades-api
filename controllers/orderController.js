const catchAsyncError = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const Address = require("../models/addressModel");
const Order = require("../models/ordersModel");
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const readHTMLTemplate = require("../utils/readHTMLTemplate");
const path = require("path");
const sendEmail = require("../utils/email");
const moment = require("moment");
// create order - /api/v1/order/create
exports.createOrder = catchAsyncError(async (req, res, next) => {
  const order_data = req.body;
  const user_id = order_data.user_id;
  const user_found = await User.findById(user_id);
  if (!user_found) {
    return next(new ErrorHandler("User not found", 404));
  }
  const email = user_found?.email;
  let products = [];
  const order_items = await Promise.all(
    order_data?.product_ids?.map(async (product_id) => {
      const found_product = await Product.findById(product_id);
      products = [...products, { ...found_product._doc }];
      return {
        product_id: found_product?._id,
      };
    })
  );
  let address_data = {};
  if (order_data.billing_address.act_shipping_address === true) {
    const billing_address = order_data.billing_address;
    const {
      first_name,
      last_name,
      mobile_no,
      email,
      address,
      state,
      district,
      location,
      postal_code,
    } = billing_address;
    if (
      !first_name ||
      !last_name ||
      !mobile_no ||
      !email ||
      !address ||
      !state ||
      !district ||
      !location ||
      !postal_code
    ) {
      return next(new ErrorHandler("Please enter all the fields", 400));
    } else {
      address_data = await Address.create({
        user_id,
        ...billing_address,
      });
    }
  }
  const orders_content = {
    user_id: order_data?.user_id,
    order_items,
    payment_method: order_data?.payment_method,
    payment_status: "pending",
    billing_address: order_data?.billing_address,
    shipping_address_id: address_data?._id,
    expected_delivery_date: "15-03-2024",
    order_summary: order_data?.order_summary,
    additional_notes: order_data?.additional_notes
      ? order_data?.additional_notes
      : "",
  };
  const order = await Order.create(orders_content);
  const hashed_order_id = order?._id;
  const momented_date = moment(order?.createdAt).format("MMM DD, YYYY");
  console.log("momented_date: ", momented_date);
  const generateTableRows = (products) => {
    let tableRows = "";
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      tableRows += `<tr style="height: 60px;background-color: transparent">
        <td style="word-break: break-all;border: 2px solid #dddddd;
      text-align: left;
      padding: 8px;">${product.product_title}, ${product.target_color}</td>
        <td style="border: 2px solid #dddddd;
      text-align: left;
      padding: 8px;">3</td>
        <td style="border: 2px solid #dddddd;
      text-align: left;
      padding: 8px;">₹${product.fixed_price}</td>
      </tr>`;
    }
    return tableRows;
  };

  const tableRows = generateTableRows(products);

  const htmlTemplate = readHTMLTemplate(
    path.join(__dirname, "..", "ui/html/order_details_email_template.html"),
    {
      greet: "Thank You for purchasing!",
      customer_name: user_found?.first_name
        ? user_found?.first_name
        : "Customer",
      order_id: hashed_order_id,
      payment_method: order?.payment_method,
      date: momented_date,
      estimated_delivery: order?.expected_delivery_date,
      order_summary: `<div>
        <table style="margin-top: 20px;font-family: arial, sans-serif;
          border-collapse: collapse;
          width: 100%;">  
          <tr style="height: 60px;background-color: transparent">
            <th style="border: 2px solid #dddddd;
              text-align: left;
              padding: 8px;">Product</td>
            <th style="border: 2px solid #dddddd;
              text-align: left;
              padding: 8px;">Quantity</td>
            <th style="border: 2px solid #dddddd;
              text-align: left;
              padding: 8px;">Price</td>
          </tr>
          ${tableRows}
          <tr style="height: 60px;background-color: transparent">
            <td style="word-break: break-all;border: 2px solid #dddddd;
              text-align: left;
              padding: 8px;"></td>
            <td style="border: 2px solid #dddddd;
              text-align: left;
              padding: 8px; font-weight:600">Total MRP</td>
            <td style="border: 2px solid #dddddd;
              text-align: left;
              padding: 8px;">${order_data?.order_summary?.total_mrp}</td>
          </tr>
          <tr style="height: 60px;background-color: transparent">
            <td style="word-break: break-all;border: 2px solid #dddddd;
              text-align: left;
              padding: 8px;"></td>
            <td style="border: 2px solid #dddddd;
              text-align: left;
              padding: 8px; font-weight:600">Shipping</td>
            <td style="border: 2px solid #dddddd;
              text-align: left;
              padding: 8px;">${order_data?.order_summary?.shipping_charge}</td>
          </tr>
          <tr style="height: 60px;background-color: transparent">
            <td style="word-break: break-all;border: 2px solid #dddddd;
              text-align: left;
              padding: 8px;"></td>
            <td style="border: 2px solid #dddddd;
              text-align: left;
              padding: 8px; font-weight:600">Total</td>
            <td style="border: 2px solid #dddddd;
              text-align: left;
              padding: 8px;">${order_data?.order_summary?.cart_total}</td>
          </tr>
        </table>
      </div>`,
    }
  );
  sendEmail({
    email,
    subject: "Order Details",
    message: htmlTemplate,
  });
  await Cart.findOneAndDelete({ user_id });
  const order_items_res = await Promise.all(
    order?.order_items.map(async (item) => {
      const found_product = await Product.findById(item.product_id);
      return { ...found_product?._doc };
    })
  );
  const order_res = { ...order?._doc, order_items_res };
  res.status(200).json({
    success: true,
    order: order_res,
    code: "order-creation-successfull",
  });
});

// get order - /api/v1/order/:id
exports.getOrder = catchAsyncError(async (req, res, next) => {
  const order_id = req.params.id;
  const order = await Order.findById(order_id);
  if (!order) {
    return next(new ErrorHandler("Order not found with this id", 404));
  }
  const order_items = await Promise.all(
    order?.order_items.map(async (item) => {
      const found_product = await Product.findById(item.product_id);
      return { ...found_product?._doc };
    })
  );
  const order_res = { ...order?._doc, order_items };
  res.status(200).json({
    success: true,
    order: order_res,
  });
});

// get orders - /api/v1/orders/:id
exports.getOrders = catchAsyncError(async (req, res, next) => {
  const user_id = req.params.id;
  const orders = await Order.find({ user_id });

  if (!orders || orders.length === 0) {
    return next(new ErrorHandler("Order not found with this id", 404));
  }

  const orders_items = await Promise.all(
    orders.map(async (order) => {
      const ordered_products = await Promise.all(
        order.order_items.map(async (item) => {
          console.log("item: ", item);
          const found_product = await Product.findById(item.product_id);
          return { ...found_product?._doc };
        })
      );
      const order_res = { ...order?._doc, order_items: ordered_products };
      return order_res;
    })
  );

  res.status(200).json({
    success: true,
    orders: orders_items,
  });
});
