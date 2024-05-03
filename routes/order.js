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
} = require("../controllers/orderController");

router
  .route("/order/create")
  .post(isAuthenticatedUser, authorizeRoles("user"), createOrder);
router
  .route("/order-status/update")
  .put(isAuthenticatedUser, authorizeRoles("user"), updateOrderStaus);
router
  .route("/order/:id")
  .get(isAuthenticatedUser, authorizeRoles("user"), getOrder);
router
  .route("/orders-all")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getOrdersAll);
router
  .route("/orders/:id")
  .get(
    // isAuthenticatedUser, authorizeRoles("user", "admin"),
     getOrders);

module.exports = router;
