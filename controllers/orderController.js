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
    order_data?.products?.map(async (product) => {
      const found_product = await Product.findById(product.product_id);
      products = [...products, { ...found_product._doc }];
      return {
        product_id: found_product?._id,
        product_images: found_product?.product_images,
        sale_price: found_product?.sale_price,
        discount_percentage: found_product?.discount_percentage,
        discount_price: found_product?.discount_price,
        fixed_price: found_product?.fixed_price,
        product_title: found_product?.product_title,
        product_label: found_product?.product_label,
        target_color: found_product?.target_color,
        target_color_code: found_product?.target_color_code,
        selected_color: product?.selected_color,
        selected_color_code: product?.selected_color_code,
        selected_quantity: product?.selected_quantity,
        selected_size: product?.selected_size,
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
  const order_res = { ...order?._doc, _id: hashed_order_id };
  res.status(200).json({
    success: true,
    order: order_res,
    code: "order-creation-successfull",
  });
});

// update order status - /api/v1/order-status
exports.updateOrderStaus = catchAsyncError(async (req, res, next) => {
  const { order_id, status } = req.body
  /* Checking for order */
  if (!order_id || !status) {
    return next(new ErrorHandler("All the fields are required", 400));
  }
  /* Verifing order from the order id  */
  const order = await Order.findById(order_id);
  if (!order) {
    return next(new ErrorHandler("Order not found with this id", 404));
  }
  let order_res = order;
  /* Updating order status */
  switch (status) {
    case ('shipped'): {
      /* Preventing updating duplicate status */
      if(order?.order_status === 'shipped') {
        return next(new ErrorHandler(`Current order status is already in ${order?.order_status} state`, 400));
      }
      /* Preventing updating to previous status */
      if (order?.order_status === 'delivered' || order?.order_status === 'canceled') {
        return next(new ErrorHandler("Updating order status to previous status is restricted", 400));
      }
      order_res = await Order.findOneAndUpdate(
        { _id: order_id },
        { order_status: status },
        { new: true }
      );
      break;
    }
    case ('delivered'): {
      /* Preventing updating duplicate status */
      if(order?.order_status === 'delivered') {
        return next(new ErrorHandler(`Current order status is already in ${order?.order_status} state`, 400));
      }
      /* Preventing updating to previous status */
      if (order?.order_status === 'canceled') {
        return next(new ErrorHandler("Updating order status to previous state is restricted", 400));
      }
      await Promise.all(
        order?.order_items?.map(async (product) => {
          const found_product = await Product.findById(product.product_id);
          if (found_product && !found_product.verified_purchase_users.some(user => user.user_id === order.user_id)) {
            await Product.findOneAndUpdate(
              { _id: product.product_id },
              { $addToSet: { verified_purchase_users: { order_id, user_id: order.user_id } } }
            );
          }
        })
      );
      order_res = await Order.findOneAndUpdate(
        { _id: order_id },
        { order_status: status },
        { new: true }
      );
      break;
    }
    default: {
      return next(new ErrorHandler("Internal server error", 500));
    }
  }
  res.status(200).json({
    success: true,
    order: order_res,
  });
})
// get order - /api/v1/order/:id
exports.getOrder = catchAsyncError(async (req, res, next) => {
  const order_id = req.params.id;
  const order = await Order.findById(order_id);
  if (!order) {
    return next(new ErrorHandler("Order not found with this id", 404));
  }
  res.status(200).json({
    success: true,
    order,
  });
});

// get orders - /api/v1/orders/:id
exports.getOrders = catchAsyncError(async (req, res, next) => {
  const user_id = req.params.id;
  const user = await User.findById(user_id);
  if (!user) {
    return next(new ErrorHandler("User not found with this id", 404));
  }

  const orders = await Order.find({ user_id }).sort({ createdAt: 'desc' });

  res.status(200).json({
    success: true,
    orders,
  });
});

// get orders all - /api/v1/orders-all
exports.getOrdersAll = catchAsyncError(async (req, res, next) => {
  const orders_all = await Order.find().sort({ createdAt: 'desc' });
  console.log("orders_all", orders_all);
  res.status(200).json({
    success: true,
    orders_all,
  });
});