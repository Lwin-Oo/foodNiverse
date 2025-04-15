const express = require("express");
const router = express.Router();
const { generateStory, addMemory, getAllMemories } = require("../../controllers/memory/memoryController");

router.post("/generate", generateStory);

// @route POST /api/memories
router.post("/", addMemory);

// @route GET /api/memories
router.get("/", getAllMemories);

module.exports = router;
