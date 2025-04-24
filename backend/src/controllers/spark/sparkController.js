const { db, admin } = require("../../../server");
const { v4: uuidv4 } = require("uuid");

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
      res.status(201).json({ message: "Spark created", spark });
    } catch (err) {
      console.error("❌ createSpark error:", err);
      res.status(500).json({ message: "Failed to create spark" });
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
  getSparks,
  loveSpark,
  shareSpark,
  getReflects
};
