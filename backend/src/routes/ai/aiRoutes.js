// routes/ai/aiRoutes.js
const express = require("express");
const router = express.Router();
const { chatWithLunr, getSparkSuggestion, detectThreadBetweenUsers, createThread, runConnectionAgent } = require("../../controllers/ai/aiController")

router.post("/chat", chatWithLunr);
router.post("/spark-suggest", getSparkSuggestion);
router.post("/threads/check", detectThreadBetweenUsers);
router.post("/threads/create", createThread);
router.post("/threads/agent", runConnectionAgent);

module.exports = router;
