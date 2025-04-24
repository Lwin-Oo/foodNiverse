const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const {
  createSpark,
  getSparks,
  loveSpark,
  shareSpark,
  getReflects
} = require("../../controllers/spark/sparkController");

router.post("/", authMiddleware, createSpark);
router.get("/", authMiddleware, getSparks);
router.post("/love", authMiddleware, loveSpark);
router.post("/share", authMiddleware, shareSpark);
router.get("/:sparkId/reflects", authMiddleware, getReflects);

module.exports = router;
