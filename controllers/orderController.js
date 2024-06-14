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
const fs = require("fs");
const { executablePath } = require("puppeteer");
const handlebars = require("handlebars");
const puppeteer = require("puppeteer-core");
const { sendNotification } = require("../utils/sendNotification");
// const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// create order - /api/v1/order/create
exports.createOrder = catchAsyncError(async (req, res, next) => {
  const order_data = req.body;
  const fcmToken = req.body.fcmToken;
  const user_id = order_data.user_id;
  const user_found = await User.findById(user_id);
  if (!user_found) {
    return next(new ErrorHandler("User not found", 404));
  }
  const today = new Date();
  const email = user_found?.email;
  let products = [];
  const order_items = await Promise.all(
    order_data?.product_ids?.map(async (product) => {
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
        product_type: found_product?.product_type,
        target_color: found_product?.target_color,
        target_gender: found_product?.target_gender,
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
    expected_delivery_date:
      order_data?.billing_address?.state === "Tamil Nadu"
        ? new Date(today.setDate(today.getDate() + 2))
        : new Date(today.setDate(today.getDate() + 4)),
    order_summary: order_data?.order_summary,
    additional_notes: order_data?.additional_notes
      ? order_data?.additional_notes
      : "",
  };
  const order = await Order.create(orders_content);
  const hashed_order_id = order?._id;
  const momented_date = moment(order?.createdAt).format("MMM DD, YYYY");
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
  const notification = {
    title: "Thankyou for purchasing!",
    body: "For more details, please click this notification to view the order tracking information.",
  };
  const webpush = {
    fcm_options: {
      link: `http://localhost:4040/order-status?order_id=${order?._id}`,
    },
  };
  await sendNotification(fcmToken, notification, webpush);
  res.status(200).json({
    success: true,
    order: order_res,
    code: "order-creation-successfull",
  });
});

// update order status - /api/v1/order-status
exports.updateOrderStaus = catchAsyncError(async (req, res, next) => {
  const { order_id, status } = req.body;
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
    case "shipped": {
      /* Preventing updating duplicate status */
      if (order?.order_status === "shipped") {
        return next(
          new ErrorHandler(
            `Current order status is already in ${order?.order_status} state`,
            400
          )
        );
      }
      /* Preventing updating to previous status */
      if (
        order?.order_status === "delivered" ||
        order?.order_status === "canceled"
      ) {
        return next(
          new ErrorHandler(
            "Updating order status to previous status is restricted",
            400
          )
        );
      }
      order_res = await Order.findOneAndUpdate(
        { _id: order_id },
        { order_status: status },
        { new: true }
      );
      break;
    }
    case "delivered": {
      /* Preventing updating duplicate status */
      if (order?.order_status === "delivered") {
        return next(
          new ErrorHandler(
            `Current order status is already in ${order?.order_status} state`,
            400
          )
        );
      }
      /* Preventing updating to previous status */
      if (order?.order_status === "canceled") {
        return next(
          new ErrorHandler(
            "Updating order status to previous state is restricted",
            400
          )
        );
      }
      await Promise.all(
        order?.order_items?.map(async (product) => {
          const found_product = await Product.findById(product.product_id);
          if (
            found_product &&
            !found_product.verified_purchase_users.some(
              (user) => user.user_id === order.user_id
            )
          ) {
            await Product.findOneAndUpdate(
              { _id: product.product_id },
              {
                $addToSet: {
                  verified_purchase_users: { order_id, user_id: order.user_id },
                },
              }
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
});
// get order - /api/v1/order/:id
exports.getOrder = catchAsyncError(async (req, res, next) => {
  const order_id = req.params.id;
  const order = await Order.findById(order_id);
  console.log("order: ", order);
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

  const orders = await Order.find({ user_id }).sort({ createdAt: "desc" });

  res.status(200).json({
    success: true,
    orders,
  });
});

// get orders all - /api/v1/orders-all
exports.getOrdersAll = catchAsyncError(async (req, res, next) => {
  const orders_all = await Order.find().sort({ createdAt: "desc" });
  res.status(200).json({
    success: true,
    orders_all,
  });
});

// Helper function to compile HTML template
const compileTemplate = (templatePath, data) => {
  const template = fs.readFileSync(templatePath, "utf-8");
  const compiledTemplate = handlebars.compile(template);
  return compiledTemplate(data);
};
// Print order - /api/v1/print-invoice/:id
exports.printOrder = catchAsyncError(async (req, res, next) => {
  const order_id = req.params.id;
  const orderDetails = await Order.findById(order_id);
  console.log("order: ", orderDetails);
  if (!orderDetails) {
    return next(new ErrorHandler("Order not found with this id", 404));
  }
  const getCurrencyFormat = (price) => {
    const formatter = new Intl.NumberFormat("en-US", {
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(price);
  };
  const formatedOrderItems = orderDetails.order_items.map((data) => {
    return {
      product_title: data.product_title,
      fixed_price: getCurrencyFormat(data.fixed_price),
      selected_quantity: data.selected_quantity,
      product_act_price: getCurrencyFormat(
        data.fixed_price * data.selected_quantity
      ),
      product_image: data.product_images[0],
    };
  });
  const orderData = {
    order_id: orderDetails._id,
    user_id: orderDetails.user_id,
    order_date: orderDetails.createdAt,
    order_items: formatedOrderItems,
    total_mrp: getCurrencyFormat(orderDetails.order_summary.total_mrp),
    shipping_charge: getCurrencyFormat(
      orderDetails.order_summary.shipping_charge
    ),
    cart_total: getCurrencyFormat(orderDetails.order_summary.cart_total),
  };

  const htmlContent = compileTemplate(
    path.join(__dirname, "..", "ui/html/invoiceTemplate.html"),
    orderData
  );

  try {
    const browser = await puppeteer.launch({
      executablePath: executablePath(),
      headless: true,
      timeout: 60000,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=invoice.pdf");
    res.send(pdfBuffer);
  } catch (error) {
    return next(
      new ErrorHandler(`Failed to generate PDF: ${error.message}`, 500)
    );
  }
});
