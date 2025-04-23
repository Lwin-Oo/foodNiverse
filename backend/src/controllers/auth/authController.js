const { db } = require("../../../server");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// @desc Check if user exists by email
const checkUserExists = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const userSnap = await db.collection("users").where("email", "==", email).get();
    const exists = !userSnap.empty;

    let name = null;
    if (exists) {
      name = userSnap.docs[0].data().name;
    }
    res.status(200).json({ exists, name });

  } catch (err) {
    console.error("❌ Error checking user existence:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Register user
const registerUser = async (req, res) => {
  try {
    const { email, password, name, avatar, city, country } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: "Missing fields" });

    const userSnap = await db.collection("users").where("email", "==", email).get();
    if (!userSnap.empty) return res.status(409).json({ message: "User already exists" });

    const uid = require("uuid").v4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      uid,
      email,
      password: hashedPassword,
      name,
      avatar: avatar || null,
      city: city || "",
      country: country || "",
      createdAt: new Date(),
    };

    await db.collection("users").doc(uid).set(userData);

    res.status(201).json({ message: "User created", uid });
  } catch (err) {
    console.error("❌ Error registering user:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Login user
const loginUser = async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Missing fields" });
      }
  
      const userSnap = await db.collection("users").where("email", "==", email).get();
      if (userSnap.empty) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const user = userSnap.docs[0].data();
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: "Invalid password" });
      }
  
      // Generate JWT
      const token = jwt.sign({ uid: user.uid, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
  
      // Send back name as username for frontend routing
      res.status(200).json({
        message: "Login success",
        token,
        uid: user.uid,
        email: user.email,
        username: user.name || "user"  // fallback if name is somehow missing
      });
    } catch (err) {
      console.error("❌ Login error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  

// @desc Get user profile by uid
const getUserProfile = async (req, res) => {
  try {
    const { uid } = req.params;
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) return res.status(404).json({ message: "User not found" });

    const { password, ...userData } = userSnap.data(); // don't return password
    res.status(200).json(userData);
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  checkUserExists,
  registerUser,
  loginUser,
  getUserProfile,
};
