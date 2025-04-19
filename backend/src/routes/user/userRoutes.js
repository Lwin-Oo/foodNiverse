// routes/user/userRoutes.js
const express = require("express");
const router = express.Router();
const { searchUsers } = require("../../controllers/user/userController.js");

// GET /api/users?query=someName
router.get("/", searchUsers);

module.exports = router;