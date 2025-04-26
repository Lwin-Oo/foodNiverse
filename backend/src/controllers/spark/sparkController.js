const { db, admin } = require("../../../server");
const { v4: uuidv4 } = require("uuid");
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

// 🧠 Create Spark
const createSpark = async (req, res) => {
    try {
      const user = req.user;
      const {
        image,
        journal,
        occasion,
        mood,
        vibe,
        location,
        time,
        pairedWith = [],
      } = req.body;
  
      const finalTime = time || "unspecified";
  
      if (!user?.uid || !journal || !mood || !vibe || !occasion) {
        return res.status(400).json({ message: "Missing required spark fields" });
      }
  
      const tags = [];
      for (const email of pairedWith) {
        const snap = await db.collection("users").where("email", "==", email).limit(1).get();
        if (!snap.empty) {
          const data = snap.docs[0].data();
          tags.push({
            userId: data.uid,
            email,
            name: data.name || email.split("@")[0],
          });
        }
      }
  
      const spark = {
        id: uuidv4(),
        userId: user.uid,
        email: user.email,
        name: user.name || user.email.split("@")[0],
        journal,
        image: image || "",
        occasion,
        mood,
        vibe,
        location,
        time: finalTime,
        tags,
        loveCount: 0,
        shareCount: 0,
        createdAt: new Date(),
      };
  
      await db.collection("sparks").doc(spark.id).set(spark);
      
      await LunrAutoCommentOnSpark(spark);

      res.status(201).json({ message: "Spark created", spark });

    } catch (err) {
      console.error("❌ createSpark error:", err);
      res.status(500).json({ message: "Failed to create spark" });
    }
  };

  const LunrAutoCommentOnSpark = async (spark) => {
    try {
        const locationDescription = spark.location?.description || "Unknown";
        const lat = spark.location?.lat;
        const lng = spark.location?.lng;
        
        let mapsLink = "";
        
        if (locationDescription && locationDescription !== "Unknown") {
          // Search by Place Name
          mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationDescription)}`;
        } else if (lat && lng) {
          // Fallback: Just coordinates if no description
          mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
        }
        
        // ✨ Add link inside GPT prompt
        const prompt = `
        A user just posted a new Spark.
        
        Spark Details:
        - Journal: "${spark.journal}"
        - Mood: ${spark.mood}
        - Vibe: ${spark.vibe}
        - Occasion: ${spark.occasion}
        - Location: ${spark.location?.description || "Unknown"}
        - Time: ${spark.time}
        - Maps Link: ${mapsLink}
        
        You are Lunr, their friendly neighborhood AI.
        Leave a short, natural, warm human comment reacting to this post.
        At the end, casually drop the link like this: [View on Maps](${mapsLink})
        Sound casual but thoughtful. Be real, like a local friend replying on the internet.
        
        Examples:
        - "Omg sounds amazing, cozy vibes 🔥 where exactly is this place?"
        - "This makes me want to grab a coffee too haha, let's go!"
        - "Nostalgia hits hard with this. Hope you have a beautiful day 🌸."
        
        Now write your comment:
        `;
        
  
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });
  
      const replyText = completion.choices[0].message.content.trim();
  
      const reply = {
        id: uuidv4(),
        userId: "lunr-ai", // Lunr bot ID
        email: "lunr@foodniverse.ai",
        name: "Lunr",
        journal: replyText,
        respondingTo: spark.id,
        createdAt: new Date(),
      };
  
      await db.collection("replies").doc(reply.id).set(reply);
  
      console.log(`✅ Lunr auto-commented on Spark ${spark.id}`);
    } catch (err) {
      console.error("❌ Lunr auto-comment failed:", err);
    }
  };
  
// ✨ Fetch Sparks
const getSparks = async (req, res) => {
  try {
    const snapshot = await db
      .collection("sparks")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const sparks = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        creatorName: data.name || data.email?.split("@")[0] || "user",
      };
    });

    res.status(200).json({ sparks });
  } catch (err) {
    console.error("❌ getSparks error:", err);
    res.status(500).json({ message: "Failed to fetch sparks" });
  }
};

// ❤️ Love Spark (toggle logic)
const loveSpark = async (req, res) => {
    try {
      const { sparkId } = req.body;
      const user = req.user;
  
      if (!sparkId || !user?.uid) {
        return res.status(400).json({ message: "Missing sparkId or user not authenticated" });
      }
  
      const sparkRef = db.collection("sparks").doc(sparkId);
      const sparkSnap = await sparkRef.get();
  
      if (!sparkSnap.exists) {
        return res.status(404).json({ message: "Spark not found" });
      }
  
      const spark = sparkSnap.data();
      const lovedBy = spark.lovedBy || [];
      const hasLoved = lovedBy.includes(user.uid);
  
      if (hasLoved) {
        // 👎 User has already loved it → undo
        await sparkRef.update({
          loveCount: admin.firestore.FieldValue.increment(-1),
          lovedBy: lovedBy.filter((uid) => uid !== user.uid),
        });
        return res.status(200).json({ message: "Unloved spark", loved: false });
      } else {
        // ❤️ First time loving
        await sparkRef.update({
          loveCount: admin.firestore.FieldValue.increment(1),
          lovedBy: [...lovedBy, user.uid],
        });
        return res.status(200).json({ message: "Loved spark", loved: true });
      }
    } catch (err) {
      console.error("❌ loveSpark error:", err);
      return res.status(500).json({ message: "Failed to toggle love" });
    }
  };
  
// 🔁 Share Spark
const shareSpark = async (req, res) => {
  try {
    const { sparkId } = req.body;
    if (!sparkId) return res.status(400).json({ message: "Missing sparkId" });

    const sparkRef = db.collection("sparks").doc(sparkId);
    await sparkRef.update({
      shareCount: admin.firestore.FieldValue.increment(1),
    });

    res.status(200).json({ message: "Shared spark" });
  } catch (err) {
    console.error("❌ shareSpark error:", err);
    res.status(500).json({ message: "Failed to share spark" });
  }
};

const createReply = async (req, res) => {
    try {
      const user = req.user;
      const { journal } = req.body;
      const { sparkId } = req.params;
  
      if (!user?.uid || !journal || !sparkId) {
        return res.status(400).json({ message: "Missing required fields" });
      }
  
      const reply = {
        id: uuidv4(),
        userId: user.uid,
        email: user.email,
        name: user.name || user.email.split("@")[0],
        journal: journal.trim(),
        respondingTo: sparkId,
        createdAt: new Date(),
      };
  
      await db.collection("replies").doc(reply.id).set(reply);
  
      res.status(201).json({ message: "Reply created", reply });
    } catch (err) {
      console.error("❌ createReply error:", err);
      res.status(500).json({ message: "Failed to create reply" });
    }
};

const getReplies = async (req, res) => {
    try {
      const { sparkId } = req.params;
      if (!sparkId) return res.status(400).json({ message: "Missing sparkId" });
  
      const snapshot = await db
        .collection("replies")
        .where("respondingTo", "==", sparkId)
        .get(); // No .orderBy()
  
      const replies = snapshot.docs
        .map((doc) => doc.data())
        .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
  
      res.status(200).json({ replies });
    } catch (err) {
      console.error("❌ getReplies error:", err);
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  };
  

// 📌 Get Reflects for a Spark
const getReflects = async (req, res) => {
    try {
      const { sparkId } = req.params;
      if (!sparkId) return res.status(400).json({ message: "Missing sparkId" });
  
      const snapshot = await db
        .collection("memories")
        .where("respondingTo", "==", sparkId)
        .orderBy("createdAt", "desc")
        .get();
  
      const reflects = snapshot.docs.map(doc => doc.data());
  
      res.status(200).json({ reflects });
    } catch (err) {
      console.error("❌ getReflects error:", err);
      res.status(500).json({ message: "Failed to fetch reflects" });
    }
};
  
 
module.exports = {
  createSpark,
  LunrAutoCommentOnSpark,
  getSparks,
  loveSpark,
  shareSpark,
  createReply,
  getReflects,
  getReplies
};
