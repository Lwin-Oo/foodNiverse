const express = require("express");
const router = express.Router();

const {
  checkUserExists,
  registerUser,
  loginUser,
  getUserProfile,
} = require("../../controllers/auth/authController");

const authMiddleware = require("../../middleware/authMiddleware");

// @route POST /api/auth/check
router.post("/check", checkUserExists);

// @route POST /api/auth/register
router.post("/register", registerUser);

// @route POST /api/auth/login
router.post("/login", loginUser);

// @route GET /api/auth/profile/:uid
router.get("/profile/:uid", authMiddleware, getUserProfile);

module.exports = router;
