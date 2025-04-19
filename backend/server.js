// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://foodniverse-e1d60.firebasestorage.app",
});

const db = admin.firestore();
const storage = admin.storage(); // ✅ export this too
module.exports = { admin, db, storage };

// ✅ Setup Express
const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(helmet());
app.use(morgan("dev"));

// ✅ Routes
const memoryRoutes = require("./src/routes/memory/memoryRoutes");
app.use("/api/memories", memoryRoutes);

const authRoutes = require("./src/routes/auth/authRoutes");
app.use("/api/auth", authRoutes);

const userRoutes = require("./src/routes/user/userRoutes");
app.use("/api/user", userRoutes);

// ✅ Health check
app.get("/", (req, res) => {
  res.send("🔥 Local Memory API running.");
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`🚀 Dev server running on http://localhost:${PORT}`);
});
