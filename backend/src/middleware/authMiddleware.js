const jwt = require("jsonwebtoken");
const { db } = require("../../server");

const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      console.warn("⚠️ Missing or invalid Authorization header.");
      return res.status(401).json({ message: "No token provided." });
    }

    const token = header.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET not set in .env");
      return res.status(500).json({ message: "Server config error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.uid || !decoded.email) {
      console.warn("⚠️ Decoded token is invalid.");
      return res.status(401).json({ message: "Invalid token." });
    }

    // ✅ Fetch full user data from Firestore
    const userSnap = await db.collection("users").where("uid", "==", decoded.uid).limit(1).get();
    if (userSnap.empty) {
      console.warn("⚠️ User not found in Firestore.");
      return res.status(401).json({ message: "User not found." });
    }

    const user = userSnap.docs[0].data();

    // ✅ Attach full user data to request
    req.user = {
      uid: user.uid,
      email: user.email,
      name: user.name,
    };

    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

module.exports = authMiddleware;
