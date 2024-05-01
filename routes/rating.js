const express = require("express");
const router = express.Router();
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../middlewares/authenticate");
const { createRating, getRatings } = require("../controllers/ratingController");

router
  .route("/rating/create")
  .post(isAuthenticatedUser, authorizeRoles("user"), createRating);
router.route("/ratings/get").get(getRatings);

module.exports = router;
