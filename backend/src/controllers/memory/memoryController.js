const { db } = require("../../../server");

// POST /api/memories
const addMemory = async (req, res) => {
  try {
    const { image, journal, tags } = req.body;
    if (!image || !journal) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const ref = db.collection("memories").doc();
    const memory = {
      id: ref.id,
      image,
      journal,
      tags,
      createdAt: new Date(),
    };
    await ref.set(memory);
    res.status(201).json({ message: "Memory saved", memory });
  } catch (err) {
    console.error("Error saving memory:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/memories
const getAllMemories = async (req, res) => {
  try {
    const snapshot = await db.collection("memories").orderBy("createdAt", "desc").get();
    const memories = snapshot.docs.map(doc => doc.data());
    res.status(200).json({ memories });
  } catch (err) {
    console.error("Error fetching memories:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { addMemory, getAllMemories };
