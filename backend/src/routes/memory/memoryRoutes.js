const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const {
  generateStory,
  addMemory,
  getUserMemories,
  recommendSpotifyTrack,
  getPairedMemories,
  getPublicMemories,
  getPartnerMemories,
  getMemoryReplies,
  getReplyCounts
} = require("../../controllers/memory/memoryController");

router.post("/generate", authMiddleware, generateStory);
router.post("/", authMiddleware, addMemory);
router.get("/", authMiddleware, getUserMemories);
router.post("/music", authMiddleware, recommendSpotifyTrack);
router.get("/paired", authMiddleware, getPairedMemories);
router.get("/public", getPublicMemories);
router.post("/partner", authMiddleware, getPartnerMemories);
router.get("/replies/:sparkId", authMiddleware, getMemoryReplies);
router.get("/replyCounts", authMiddleware, getReplyCounts);

module.exports = router;
