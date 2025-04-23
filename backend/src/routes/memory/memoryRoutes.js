const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const {
  generateStory,
  addMemory,
  getUserMemories,
  recommendSpotifyTrack,
  getPairedMemories,
  getPublicMemories
} = require("../../controllers/memory/memoryController");

router.post("/generate", authMiddleware, generateStory);
router.post("/", authMiddleware, addMemory);
router.get("/", authMiddleware, getUserMemories);
router.post("/music", authMiddleware, recommendSpotifyTrack);
router.get("/paired", authMiddleware, getPairedMemories);
router.get("/public", getPublicMemories);

module.exports = router;
