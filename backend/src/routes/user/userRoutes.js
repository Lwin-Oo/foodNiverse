// routes/user/userRoutes.js
const express = require("express");
const router = express.Router();
const { searchUsers, getUserByUsername, getUserVibeSummary, mapEmailsToNames } = require("../../controllers/user/userController.js");

// GET /api/users?query=someName
router.get("/", searchUsers);

// GET /api/username
router.get("/:username", getUserByUsername);

// GET /api/username/vibe-summary
router.get("/:username/vibe-summary", getUserVibeSummary);

// POST /api/user/map  — used to fetch names by emails
router.post("/map", mapEmailsToNames);

module.exports = router;