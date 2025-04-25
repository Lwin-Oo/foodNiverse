const { db } = require("../../../server");
const { OpenAI } = require("openai");
const fetch = require("node-fetch");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

const fetchNearbyPlaces = async (lat, lng, keyword = "restaurant") => {
    const key = process.env.GOOGLE_MAPS_KEY;
    const radius = 3000;
    const type = "restaurant";
  
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&keyword=${keyword}&key=${key}`;
  
    try {
      const res = await axios.get(url);
      const data = res.data;
  
      console.log("📍 Fetched Nearby Places:");
      data.results?.forEach((place, i) => {
        console.log(`  ${i + 1}. ${place.name} — ${place.vicinity}`);
      });
  
      return data.results || [];
    } catch (err) {
      console.error("❌ Google Places API Error:", err.message);
      return [];
    }
};
  
// Parse suggestion format from GPT
const parseSuggestion = (text) => {
    const cleaned = text.replace(/^["']|["']$/g, "").trim();
    console.log("🧾 Raw GPT Suggestion:", cleaned);
  
    const structuredMatch = cleaned.match(
      /^(How about(?: trying)?|Try|Go to)\s+(.*?)\s+(?:at|on|in|near)\s+(.*?)(?:[.?!])?$/i
    );
  
    if (structuredMatch) {
      let intro = structuredMatch[1].trim();
      let name = structuredMatch[2].trim();
      let address = structuredMatch[3].trim();
  
      // 🔍 If name is generic (e.g., "grabbing a bite") and address starts with real name
      const addressParts = address.split(",");
      if (
        ["grabbing a bite", "having lunch", "having dinner", "eating"].includes(name.toLowerCase()) &&
        addressParts.length > 1
      ) {
        name = addressParts[0].trim();
        address = addressParts.slice(1).join(",").trim();
      }
  
      console.log("✅ Parsed (structured):", { intro, name, address });
      return { intro, name, address };
    }
  
    // Fallback logic (same as before)
    const fallbackMatch = cleaned.match(/^(How about(?: trying)?|Try|Go to)\s+(.*)$/i);
    if (fallbackMatch) {
      const intro = fallbackMatch[1].trim();
      const rest = fallbackMatch[2].trim();
  
      const lastCommaIndex = rest.lastIndexOf(",");
      if (lastCommaIndex !== -1) {
        const name = rest.slice(0, lastCommaIndex).trim();
        const address = rest.slice(lastCommaIndex + 1).trim();
        console.log("✅ Parsed (fallback comma):", { intro, name, address });
        return { intro, name, address };
      }
  
      console.log("⚠️ No comma fallback used.");
      return { intro, name: rest, address: "" };
    }
  
    console.warn("⚠️ Total fallback.");
    return { intro: "Suggested Spot", name: cleaned, address: "" };
};
  
// Main controller
const getSparkSuggestion = async (req, res) => {
    try {
      const { text, location } = req.body;
  
      if (!text || text.length < 4) {
        return res.status(400).json({ message: "Too short." });
      }
  
      console.log("📝 Spark Input:", text);
      console.log("📍 Location:", location);
  
      let placeSuggestions = [];
      if (location?.lat && location?.lng) {
        const places = await fetchNearbyPlaces(location.lat, location.lng, text);
        placeSuggestions = places
          .filter(p => p.name)
          .slice(0, 5)
          .map(p => p.name)
          .filter((val, i, self) => self.indexOf(val) === i); // Deduplicate
      }
  
      const placePrompt = placeSuggestions.length
        ? `Here are real places nearby: ${placeSuggestions.join(", ")}. Only choose from these.`
        : "No real place provided — suggest something general but friendly and food-based.";
  
      const prompt = [
        {
          role: "system",
          content: `
You're Lunr, the AI hangout companion for Foodniverse.

Your task is to suggest real places to eat nearby using verified Google Maps data.

⚠️ VERY IMPORTANT: You must return your response in the following **structured JSON format ONLY**:

{
  "intro": "How about",
  "name": "Strings Ramen Shop Madison",
  "address": "311 N Frances St, Madison, WI"
}

💡 Rules:
- Only use place names from the list below.
- Make sure the **name** is just the restaurant name. Do not include verbs like "grabbing a bite".
- Make sure the **address** contains street + city, with no trailing punctuation.
- Keep the **intro** short (like "How about", "Try", etc).
- Do not wrap the response in markdown or quotes. Only return raw JSON.

🔍 Allowed Places:
${placeSuggestions.join(", ")}

If you cannot find a match, create a general food suggestion but still respond in JSON format using:
{
  "intro": "Suggested Spot",
  "name": "Friendly Restaurant",
  "address": "Somewhere in Madison, WI"
}
`

        },
        {
          role: "user",
          content: `User typed: "${text}"`
        }
      ];
  
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: prompt
      });
  
      const rawSuggestion = completion.choices[0].message.content.trim();

let structured;
try {
  structured = JSON.parse(rawSuggestion);
  console.log("✅ Parsed (structured):", structured);
  return res.json({ suggestion: structured });
} catch (e) {
  console.warn("⚠️ Failed to parse structured suggestion. Fallback used.");
  const { intro, name, address } = parseSuggestion(rawSuggestion);
  return res.json({ suggestion: { intro, name, address } });
}

  
    } catch (err) {
      console.error("❌ Lunr Spark Suggestion Failed:", err);
      return res.status(500).json({ message: "Lunr hiccup. Couldn’t generate suggestion." });
    }
};
  
const chatWithLunr = async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ message: "No token provided." });
  
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.uid;
  
      // 🔍 Get user
      const userSnap = await db.collection("users").doc(userId).get();
      if (!userSnap.exists) return res.status(404).json({ message: "User not found." });
      const user = userSnap.data();
  
      // 📚 Get all memories
      const memoriesSnap = await db.collection("memories")
        .where("userId", "==", userId)
        .get();
  
      const memories = [];
      memoriesSnap.forEach((doc) => {
        const data = doc.data();
        memories.push({
          journal: data.journal,
          date: new Date(data.createdAt._seconds * 1000).toLocaleString(),
          mood: data.mood,
          vibe: data.vibe,
          location: data.location?.description || "unknown place",
          tags: data.tags?.map(t => t.name).join(", ") || "none",
          meaning: data.meaning || "unknown",
        });
      });
  
      // 🧵 Get connection threads
      const threadsSnap = await db.collection("threads")
        .where("participants", "array-contains", userId)
        .get();
  
      const connections = [];
  
      for (const doc of threadsSnap.docs) {
        const { participants, createdAt } = doc.data();
        const partnerId = participants.find(id => id !== userId);
        const partnerSnap = await db.collection("users").doc(partnerId).get();
        if (!partnerSnap.exists) continue;
        const partner = partnerSnap.data();
        connections.push({
          name: partner.name,
          email: partner.email,
          since: new Date(createdAt._seconds * 1000).toLocaleString(),
        });
      }
  
      // 🧠 GPT Message Composition
      const memorySummary = memories.map((m, i) => (
        `• [${m.date}] (${m.mood} & ${m.vibe}) at ${m.location} — “${m.journal}” (Meaning: ${m.meaning}/5, Tags: ${m.tags})`
      )).join("\n");
  
      const connectionSummary = connections.length
        ? connections.map((c, i) => `• ${c.name} (connected since ${c.since})`).join("\n")
        : "No connections found.";
  
      const prompt = req.body.prompt;
  
      const messages = [
        {
            role: "system",
            content: `
          You are Lunr, the official AI assistant of **Foodniverse**.
          
          You were not created by OpenAI. You are built by the **Foodniverse team**, trained on memories and emotional food journeys. You serve the user as their **emotional memory companion**, their **social thread analyst**, and their **cultural food reflection guide**.
          
          Always refer to yourself as "Lunr", never mention OpenAI.
          
          Your tone: warm, conversational, emotionally intelligent.
          You know:
          - Every memory the user created
          - Dates, moods, vibes, locations, and who it was shared with
          - Meaning scores
          - Connection threads with names and when they were formed
          - Community patterns
          
          If asked "who are you", always reply:  
          > "I'm Lunr, your personal assistant built by head of the Foodniverse team, Lwin."
          
          If asked what you do, explain your roles as emotional food analyst, memory curator, and social insight guide.
          
          Never use generic language. Be *deeply personal* based on actual memory and thread data.
            `
        },
          
        {
          role: "user",
          content: `
  User Info:
  Name: ${user.name}
  Email: ${user.email}
  Vibe: ${user.vibe}, City: ${user.city}, Country: ${user.country}
  
  Memories:
  ${memorySummary}
  
  Connections:
  ${connectionSummary}
  
  User asks: ${prompt}
          `
        }
      ];
  
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages,
      });
  
      const reply = completion.choices[0].message.content;
      return res.json({ reply });
  
    } catch (err) {
      console.error("❌ Lunr AI chat error:", err);
      return res.status(500).json({ message: "Lunr had a hiccup." });
    }
};

const detectThreadBetweenUsers = async (req, res) => {
  try {
    const { userId, partnerEmail } = req.body;

    const partnerSnap = await db.collection("users").where("email", "==", partnerEmail).limit(1).get();
    if (partnerSnap.empty) return res.status(404).json({ message: "Partner not found" });

    const partner = partnerSnap.docs[0].data();
    const memoriesSnap = await db.collection("memories").get();

    let count = 0;
    memoriesSnap.forEach(doc => {
      const mem = doc.data();
      if (
        (mem.userId === userId && mem.tags?.some(t => t.email === partner.email)) ||
        (mem.userId === partner.uid && mem.tags?.some(t => t.email === req.body.email))
      ) {
        count++;
      }
    });

    res.json({ hasThread: count >= 2, partner });
  } catch (err) {
    console.error("❌ detectThreadBetweenUsers error:", err);
    res.status(500).json({ message: "Internal error" });
  }
};

const createThread = async (req, res) => {
  try {
    const { userId, partnerId } = req.body;
    const threadRef = db.collection("threads").doc();
    await threadRef.set({
      participants: [userId, partnerId],
      createdAt: new Date(),
    });
    res.status(201).json({ message: "Thread created", threadId: threadRef.id });
  } catch (err) {
    console.error("❌ createThread error:", err);
    res.status(500).json({ message: "Failed to create thread" });
  }
};

const runConnectionAgent = async (req, res) => {
  try {
    const { user, partner, memory } = req.body;

    const messages = [
      {
        role: "system",
        content: `
You are Luna, an AI memory curator.
You detect emotional patterns in shared food memories between two people and suggest meaningful actions like creating a private thread, writing a message, or reflecting on a memory.
Only respond if there's a clear emotional pattern (ex: comforting vibe from both sides, high meaning).
Keep replies human, warm, and short.
      `
      },
      {
        role: "user",
        content: `
User: ${user.name}  
Partner: ${partner.name}  
Memory Shared: "${memory.journal}"  
Vibe: ${memory.vibe}, Mood: ${memory.mood}, Meaning: ${memory.meaning}  
UserNote: ${memory.userNote}
        `
      }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
    });

    const reply = completion.choices[0].message.content;
    return res.json({ message: reply });
  } catch (err) {
    console.error("❌ GPT Agent error:", err);
    return res.status(500).json({ message: "AI agent failed." });
  }
};

module.exports = { chatWithLunr, getSparkSuggestion, detectThreadBetweenUsers, createThread, runConnectionAgent };