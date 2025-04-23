const { db } = require("../../../server");

const searchUsers = async (req, res) => {
  try {
    const query = req.query.query?.toLowerCase();
    if (!query) return res.json([]);

    const snap = await db.collection("users").get();
    const allUsers = snap.docs.map((doc) => doc.data());

    const matchedUsers = allUsers.filter((user) => {
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    });

    const result = matchedUsers.map((user) => ({
      name: user.name,
      email: user.email,
    }));

    res.json(result.slice(0, 5));
  } catch (err) {
    console.error("❌ User search error:", err);
    res.status(500).json({ message: "Failed to search users" });
  }
};

const getUserByUsername = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const snap = await db.collection("users").where("name", "==", username).limit(1).get();

    if (snap.empty) {
      return res.status(404).json({ message: "User not found" });
    }

    const data = snap.docs[0].data();
    return res.json({
      uid: data.uid,
      name: data.name,
      email: data.email,
      city: data.city,
      country: data.country,
      vibe: data.vibe,
    });
  } catch (err) {
    console.error("❌ getUserByUsername error:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

const getUserVibeSummary = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();

    // Step 1: Get user data by username
    const snap = await db.collection("users").where("name", "==", username).limit(1).get();
    if (snap.empty) return res.status(404).json({ message: "User not found" });

    const user = snap.docs[0].data();
    const userId = user.uid;

    // Step 2: Fetch all memories (for now — later optimize by Firestore indexing)
    const allSnap = await db.collection("memories").get();
    const allMemories = allSnap.docs.map(doc => doc.data());

    // Step 3: Filter solo and featured
    const soloMemories = allMemories.filter(mem => mem.userId === userId);
    const featuredMemories = allMemories.filter(mem =>
      Array.isArray(mem.tags) &&
      mem.tags.some(tag => tag.userId === userId) &&
      mem.userId !== userId
    );

    // Step 4: Gather all vibes
    const allVibes = [...soloMemories, ...featuredMemories].map(mem => mem.vibe).filter(Boolean);

    if (allVibes.length === 0) return res.json({ topVibe: null, vibeStats: [] });

    const vibeCount = {};
    allVibes.forEach(vibe => {
      vibeCount[vibe] = (vibeCount[vibe] || 0) + 1;
    });

    const sorted = Object.entries(vibeCount).sort((a, b) => b[1] - a[1]);

    return res.json({
      topVibe: sorted[0][0],
      vibeStats: sorted.map(([vibe, count]) => ({ vibe, count })),
    });

  } catch (err) {
    console.error("❌ getUserVibeSummary error:", err);
    res.status(500).json({ message: "Failed to fetch vibe summary" });
  }
};

// In userController.js
const mapEmailsToNames = async (req, res) => {
  try {
    const { emails } = req.body;
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ message: "Missing or invalid emails array" });
    }

    const snap = await db.collection("users").get();
    const users = snap.docs.map(doc => doc.data());

    const result = {};
    emails.forEach(email => {
      const match = users.find(u => u.email === email);
      if (match) {
        result[email] = match.name;
      }
    });

    return res.json(result); 
  } catch (err) {
    console.error("❌ mapEmailsToNames error:", err);
    res.status(500).json({ message: "Failed to map emails to names" });
  }
};


module.exports = {
  searchUsers,
  getUserByUsername,
  getUserVibeSummary,
  mapEmailsToNames
};