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

module.exports = {
  searchUsers,
};