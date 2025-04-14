const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
module.exports.db = db;

// Set up Express app
const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(helmet());
app.use(morgan("dev"));

// Routes
const memoryRoutes = require("./src/routes/memory/memoryRoutes");
app.use("/api/memories", memoryRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("🔥 Local Memory API running.");
});

// Start server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`🚀 Dev server running on http://localhost:${PORT}`);
});
