const { db } = require("../../../server");
const { OpenAI } = require("openai");
const Clarifai = require("clarifai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const clarifai = new Clarifai.App({
  apiKey: process.env.CLARIFAI_API_KEY,
});

const detectFoodType = async (base64Image) => {
  try {
    const res = await clarifai.models.predict(
      Clarifai.FOOD_MODEL,
      { base64: base64Image.replace(/^data:image\/\w+;base64,/, "") }
    );

    const concepts = res.outputs[0].data.concepts;
    if (!concepts || concepts.length === 0) return "unknown";

    const topPrediction = concepts[0];
    return topPrediction.value > 0.85 ? topPrediction.name : "unknown";
  } catch (error) {
    console.error("❌ Clarifai failed:", error);
    return "unknown";
  }
};

// Generate poetic story from user prompt choices
const generateStory = async (req, res) => {
  try {
    const {
      image, // base64 image
      mood,
      occasion,
      vibe,
      location,
      time,
      city,
      country
    } = req.body;

    if (!image || !mood || !occasion || !vibe || !location || !time || !city || !country) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const foodType = await detectFoodType(image);
    console.log("🍜 Detected food:", foodType);

    const prompt = `
You're a human writing realistic food memories.

Write a short, natural 1-2 sentence food memory for a photo of ${foodType}.

Details:
- Mood: ${mood}
- Occasion: ${occasion}
- Vibe: ${vibe}
- Location: ${location}
- Time: ${time}
- City: ${city}
- Country: ${country}

Make it human. No poems. No fancy language. Just something casual, honest, and short.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 60,
    });

    const story = response.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ story });
  } catch (error) {
    console.error("❌ GPT generation failed:", error);
    res.status(500).json({ message: "Failed to generate story." });
  }
};


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

module.exports = { generateStory, addMemory, getAllMemories };
