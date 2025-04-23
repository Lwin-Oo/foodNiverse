const { db } = require("../../../server");
const { v4: uuidv4 } = require("uuid");
const { OpenAI } = require("openai");
const Clarifai = require("clarifai");
const getSpotifyToken = require("../../utils/spotifyAuth");
const axios = require("axios");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const clarifai = new Clarifai.App({ apiKey: process.env.CLARIFAI_API_KEY });

const detectFoodType = async (base64Image) => {
  try {
    const res = await clarifai.models.predict(
      Clarifai.FOOD_MODEL,
      { base64: base64Image.replace(/^data:image\/\w+;base64,/, "") }
    );
    const top = res.outputs?.[0]?.data?.concepts?.[0];
    return top?.value > 0.85 ? top.name : "unknown";
  } catch (err) {
    console.error("Clarifai error", err);
    return "unknown";
  }
};

const generateStory = async (req, res) => {
  try {
    const {
      image, mood, occasion, vibe, location,
      time, city, country, userNote, meaning
    } = req.body;

    if (!image || !mood || !occasion || !vibe || !location || !time || !city || !country)
      return res.status(400).json({ message: "Missing fields" });

    const foodType = await detectFoodType(image);
    const prompt = `
You're not an author — you're just someone reflecting on a meaningful food moment.

Write 1–2 short, casual sentences about a real memory involving ${foodType}.
Use a natural tone — not poetic, not dramatic. Don't over-explain.

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

Examples:

“We baked a cake together that morning — not perfect, but it tasted like us.”
“Sushi on the curb after class. She laughed at how I couldn’t use chopsticks.”`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.75,
    });

    const story = response.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ story });
  } catch (err) {
    console.error("GPT error:", err);
    res.status(500).json({ message: "Story generation failed" });
  }
};

const addMemory = async (req, res) => {
  try {
    const user = req.user;
    const {
      image,
      journal,
      pairedWith = [],
      userNote,
      meaning,
      location,
      mood,
      vibe,
      seekingConnection,
      respondingTo,
    } = req.body;

    if (!user?.uid || typeof journal !== "string")
      return res.status(400).json({ message: "Missing fields" });

    const tags = [];

    for (const email of pairedWith) {
      const snap = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!snap.empty) {
        const data = snap.docs[0].data();
        tags.push({
          userId: data.uid,
          email,
          name: data.name || email.split("@")[0],
          userNote,
          vibe,
        });
      }
    }

    const memory = {
      id: uuidv4(),
      userId: user.uid,
      email: user.email,
      image: image || "", // allow empty string if no image
      journal,
      tags, // = pairedWith (intact)
      userNote: userNote?.trim() || "",
      meaning: meaning || null,
      mood: mood || null,
      vibe: vibe || null,
      location: location || null,
      createdAt: new Date(),
      seekingConnection: seekingConnection || false,
      respondingTo: respondingTo || null, // ✅ this allows replying to another memory
    };

    await db.collection("memories").doc(memory.id).set(memory);
    res.status(201).json({ message: "Memory saved", memory });
  } catch (err) {
    console.error("❌ Add memory error:", err);
    res.status(500).json({ message: "Failed to save memory" });
  }
};

const getUserMemories = async (req, res) => {
  try {
    const user = req.user;

    // Firestore throws index error *only if* the collection has no docs with userId
    // So we first check if *any* memories exist for this user
    const checkSnap = await db
      .collection("memories")
      .where("userId", "==", user.uid)
      .limit(1)
      .get();

    // ✅ No memories — return empty array early
    if (checkSnap.empty) {
      return res.status(200).json({ memories: [] });
    }

    // ✅ Memories exist — now safely order by createdAt
    const snapshot = await db
      .collection("memories")
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .get();

    const memories = snapshot.docs.map(doc => doc.data());
    return res.status(200).json({ memories });

  } catch (err) {
    console.error("❌ Fetch memories error:", err);
    return res.status(500).json({ message: "Failed to fetch memories" });
  }
};

const recommendSpotifyTrack = async (req, res) => {
  try {
    const { mood, vibe, memoryId } = req.body;
    if (!mood || !vibe || !memoryId)
      return res.status(400).json({ message: "Missing mood/vibe/memoryId" });

    const token = await getSpotifyToken();
    const query = `${mood} ${vibe}`;

    const result = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const track = result.data.tracks.items[0];
    if (!track) throw new Error("No track found");

    const musicUrl = `https://open.spotify.com/track/${track.id}`;
    const embedUrl = `https://open.spotify.com/embed/track/${track.id}`;
    const title = track.name;
    const artist = track.artists.map(a => a.name).join(", ");

    await db.collection("memories").doc(memoryId).update({
      musicUrl,
      musicMeta: { title, artist, embedUrl },
    });

    res.status(200).json({ musicUrl, embedUrl, title, artist });
  } catch (err) {
    console.error("Spotify fetch error:", err);
    res.status(500).json({ message: "Failed to get music" });
  }
};

const getPairedMemories = async (req, res) => {
  try {
    const user = req.user;
    console.log("👤 Fetching paired memories for:", user.uid);

    const snapshot = await db.collection("memories").get();
    const allMemories = snapshot.docs.map(doc => doc.data());

    const featured = allMemories.filter((mem) =>
      Array.isArray(mem.tags) &&
      mem.tags.some((tag) => tag.userId === user.uid) &&
      mem.userId !== user.uid
    );

    console.log("🎁 Featured Memories Found:", featured.length);
    res.status(200).json({ memories: featured });
  } catch (err) {
    console.error("❌ Paired memories fetch error:", err);
    res.status(500).json({ message: "Failed to fetch paired memories" });
  }
};

const getPublicMemories = async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ message: "Missing user ID" });

    const snap = await db
      .collection("memories")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    const memories = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        image: data.image,
        journal: data.journal,
        pairedWith: data.tags || [],
      };
    });

    res.status(200).json(memories);
  } catch (err) {
    console.error("❌ getPublicMemories error:", err);
    res.status(500).json({ message: "Failed to fetch memories" });
  }
};

const getPartnerMemories = async (req, res) => {
  try {
    const { partnerName } = req.body;
    const currentUser = req.user;

    if (!partnerName || !currentUser?.uid) {
      return res.status(400).json({ message: "Missing partner name or auth" });
    }

    // 🧠 Get partner user
    const partnerSnap = await db.collection("users").where("name", "==", partnerName).limit(1).get();
    if (partnerSnap.empty) return res.status(404).json({ message: "Partner not found" });

    const partner = partnerSnap.docs[0].data();

    // 🔍 Check for thread access
    const threadsSnap = await db.collection("threads")
      .where("participants", "array-contains", currentUser.uid)
      .get();

    const hasThread = threadsSnap.docs.some(doc => {
      const { participants } = doc.data();
      return participants.includes(partner.uid);
    });

    if (!hasThread) return res.status(403).json({ message: "No thread access" });

    // ✅ Fetch memories of the partner
    const memSnap = await db.collection("memories")
      .where("userId", "==", partner.uid)
      .orderBy("createdAt", "desc")
      .get();

    const memories = memSnap.docs.map(doc => doc.data());
    res.status(200).json({ memories });
  } catch (err) {
    console.error("❌ getPartnerMemories error:", err);
    res.status(500).json({ message: "Failed to fetch partner's memories" });
  }
};

const getMemorySparks = async (req, res) => {
  try {
    const snapshot = await db
      .collection("memories")
      .where("seekingConnection", "==", true)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const sparks = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        creatorName: data.name || data.email?.split("@")[0] || "user",
      };
    });

    res.status(200).json({ sparks });
  } catch (err) {
    console.error("❌ Memory Sparks fetch error:", err);
    res.status(500).json({ message: "Failed to fetch memory sparks" });
  }
};

const getMemoryReplies = async (req, res) => {
  try {
    const { sparkId } = req.params;
    if (!sparkId) return res.status(400).json({ message: "Missing sparkId" });

    const snapshot = await db
      .collection("memories")
      .where("respondingTo", "==", sparkId)
      .orderBy("createdAt", "desc")
      .get();

    const replies = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const userSnap = await db
          .collection("users")
          .where("uid", "==", data.userId)
          .limit(1)
          .get();

        const user = userSnap.empty ? null : userSnap.docs[0].data();
        return {
          ...data,
          name: user?.name || "someone",
        };
      })
    );

    res.status(200).json({ replies });
  } catch (err) {
    console.error("❌ Fetch replies error:", err);
    res.status(500).json({ message: "Failed to fetch replies" });
  }
};


const getReplyCounts = async (req, res) => {
  try {
    const snapshot = await db.collection("memories").where("respondingTo", "!=", null).get();
    const counts = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      const sparkId = data.respondingTo;
      if (sparkId) {
        counts[sparkId] = (counts[sparkId] || 0) + 1;
      }
    });

    res.status(200).json({ counts });
  } catch (err) {
    console.error("❌ Failed to fetch reply counts:", err);
    res.status(500).json({ message: "Failed to fetch reply counts" });
  }
};

module.exports = {
  generateStory,
  addMemory,
  getUserMemories,
  recommendSpotifyTrack,
  getPairedMemories,
  getPublicMemories,
  getPartnerMemories,
  getMemorySparks,
  getMemoryReplies,
  getReplyCounts
};
