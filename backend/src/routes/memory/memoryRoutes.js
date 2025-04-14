const express = require("express");
const router = express.Router();
const { addMemory, getAllMemories } = require("../../controllers/memory/memoryController");

// @route POST /api/memories
router.post("/", addMemory);

// @route GET /api/memories
router.get("/", getAllMemories);

module.exports = router;
