const express = require("express");
const router = express.Router();
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../middlewares/authenticate");
const {
  createOrder,
  getOrder,
  getOrders,
  updateOrderStaus,
  getOrdersAll,
  printOrder,
} = require("../controllers/orderController");

router
  .route("/order/create")
  .post(isAuthenticatedUser, authorizeRoles("user", "super_admin"), createOrder);
router
  .route("/order-status/update")
  .put(
    // isAuthenticatedUser, authorizeRoles("user", "super_admin"),
     updateOrderStaus);
router
  .route("/order/:id")
  .get(isAuthenticatedUser, authorizeRoles("user", "super_admin"), getOrder);
router
  .route("/orders-all")
  .get(
    // isAuthenticatedUser, authorizeRoles("admin"), 
    getOrdersAll);
router
  .route("/orders/:id")
  .get(
    // isAuthenticatedUser, authorizeRoles("user", "admin"),
     getOrders);
router
  .route("/print-invoice/:id")
  .get(
    // isAuthenticatedUser, authorizeRoles("user", "admin"),
    printOrder);

module.exports = router;
