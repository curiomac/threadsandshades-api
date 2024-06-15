const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  changePassword,
  updateProfile,
  updateProfileImage,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  sendOTP,
  getUserProfileImage,
} = require("../controllers/authController");
const router = express.Router();
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../middlewares/authenticate");
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "..", "uploads/user"));
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    },
  }),
});

router.route("/otp/send").post(sendOTP);
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logoutUser);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").post(resetPassword);
router
  .route("/profile/get")
  .get(isAuthenticatedUser, authorizeRoles("user", "super_admin"), getUserProfile);
router
  .route("/profile/image/get")
  .get(isAuthenticatedUser, authorizeRoles("user", "super_admin"), getUserProfileImage);
router
  .route("/password/change")
  .put(isAuthenticatedUser, authorizeRoles("user", "super_admin"), changePassword);
router
  .route("/profile/update/:id")
  .put(isAuthenticatedUser, authorizeRoles("user", "super_admin"), updateProfile);
router
  .route("/profile/image/update/:id")
  .put(
    isAuthenticatedUser,
    authorizeRoles("user", "super_admin"),
    upload.single("avatar"),
    updateProfileImage
  );
//Admin routes
router
  .route("/admin/users")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAllUsers);
router
  .route("/admin/user/:id")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getUser)
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateUser)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);

module.exports = router;
