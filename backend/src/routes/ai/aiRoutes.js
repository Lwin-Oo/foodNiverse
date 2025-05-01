// routes/ai/aiRoutes.js
const express = require("express");
const router = express.Router();
const { chatWithLunr, getLunrProfile, getTasteProfilerMemory, startTasteProfiler, handleTasteProfilerChat, getSparkSuggestion, detectThreadBetweenUsers, createThread, runConnectionAgent, recordLunrIgnored } = require("../../controllers/ai/aiController")

router.post("/chat", chatWithLunr);
router.get("/lunr-profile", getLunrProfile);
router.get("/taste-profiler/memory", getTasteProfilerMemory);
router.post("/taste-profiler/start", startTasteProfiler);
router.post("/taste-profiler/chat", handleTasteProfilerChat);
router.post("/spark-suggest", getSparkSuggestion);
router.post("/threads/check", detectThreadBetweenUsers);
router.post("/threads/create", createThread);
router.post("/threads/agent", runConnectionAgent);
router.post("/lunr/ignored", recordLunrIgnored);

module.exports = router;
