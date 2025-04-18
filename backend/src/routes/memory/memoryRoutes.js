const express = require("express");
const router = express.Router();
const { generateStory, recommendSpotifyTrack, addMemory, getAllMemories } = require("../../controllers/memory/memoryController");

router.post("/generate", generateStory);

// @route POST /api/memories
router.post("/", addMemory);

// @route GET /api/memories
router.get("/", getAllMemories);

// @route POST /api/memories/music
router.post("/music", recommendSpotifyTrack);

module.exports = router;
