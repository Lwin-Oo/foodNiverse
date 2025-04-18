const { db, storage } = require("../../../server");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { OpenAI } = require("openai");
const Clarifai = require("clarifai");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const getSpotifyToken = require("../../utils/spotifyAuth");

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
      image, mood, occasion, vibe, location,
      time, city, country, userNote, meaning
    } = req.body;

    if (!image || !mood || !occasion || !vibe || !location || !time || !city || !country) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const foodType = await detectFoodType(image);
    console.log("🍜 Detected food:", foodType);

    // Inject real-world tone guidance + examples
    const prompt = `
You're not an author — you're just someone reflecting on a meaningful food moment.

Write 1–2 short, casual sentences about a real memory involving ${foodType}.
Use a natural tone — not poetic, not dramatic. Don't over-explain. Just sound human.

Details:
- Mood: ${mood}
- Occasion: ${occasion}
- Vibe: ${vibe}
- Location Type: ${location}
- Time of Day: ${time}
- City: ${city}
- Country: ${country}
${userNote ? `- Note from user: "${userNote}"` : ""}
${meaning ? `- Memory Importance: ${meaning}/5` : ""}

Here are examples of the tone to follow:

Example 1:
“We baked a cake together that morning — not perfect, but it tasted like us.”

Example 2:
“Sushi on the curb after class. She laughed at how I couldn’t use chopsticks.”

Now write the user's memory.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.75, // grounded, slightly expressive
    });

    const story = response.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ story });
  } catch (error) {
    console.error("❌ GPT generation failed:", error);
    res.status(500).json({ message: "Failed to generate story." });
  }
};


const moodToGenre = {
  nostalgic: "acoustic",
  excited: "pop",
  peaceful: "chill",
  cozy: "lofi",
  sad: "piano",
};

const vibeToTags = {
  spicy: "latin",
  warm: "soul",
  comforting: "jazz",
  simple: "ambient",
};

const recommendSpotifyTrack = async (req, res) => {
  try {
    const { mood, vibe, memoryId } = req.body;

    if (!mood || !vibe || !memoryId)
      return res.status(400).json({ message: "Missing mood/vibe/memoryId" });

    const token = await getSpotifyToken();

    const genre = moodToGenre[mood] || "lofi";
    const tag = vibeToTags[vibe] || "instrumental";

    const query = `${genre} ${tag}`;
    const result = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const track = result.data.tracks.items[0];
    if (!track) throw new Error("No track found");

    const musicUrl = `https://open.spotify.com/track/${track.id}`;
    const embedUrl = `https://open.spotify.com/embed/track/${track.id}`;
    const title = track.name;
    const artist = track.artists.map(a => a.name).join(", ");

    // ✅ Save it to Firestore
    await db.collection("memories").doc(memoryId).update({
      musicUrl,
      musicMeta: {
        title,
        artist,
        embedUrl,
      },
    });

    res.status(200).json({ musicUrl, embedUrl, title, artist });
  } catch (err) {
    console.error("❌ Spotify fetch failed:", err);
    res.status(500).json({ message: "Failed to get Spotify music." });
  }
};


// POST /api/memories
const addMemory = async (req, res) => {
  try {
    const { image, journal, tags, userNote, meaning, location, mood, vibe } = req.body;

    if (!image || !journal) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const ref = db.collection("memories").doc();
    const memory = {
      id: ref.id,
      image,
      journal,
      tags: Array.isArray(tags) ? tags : [],
      userNote: userNote?.trim() || "",
      meaning: meaning || null,
      mood: mood || "",
      vibe: vibe || "",
      location: location || null,
      createdAt: new Date(),
    };

    await ref.set(memory);
    res.status(201).json({ message: "Memory saved", memory });
  } catch (err) {
    console.error("❌ Error saving memory:", err);
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

module.exports = { generateStory, recommendSpotifyTrack, addMemory, getAllMemories };
