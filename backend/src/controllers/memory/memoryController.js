const { db, storage } = require("../../../server");
const { v4: uuidv4 } = require("uuid");
const { OpenAI } = require("openai");
const Clarifai = require("clarifai");
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

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

// Generate Background music from AI
const generateMusic = async (req, res) => {
  try {
    const { mood, vibe, memoryId } = req.body;
    if (!mood || !vibe || !memoryId) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    console.log("🎧 Generating music for:", memoryId);

    // 1. GPT generates raw ABC
    const gptRes = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "user",
        content: `
Write a short calming lo-fi melody in ABC notation.
- Headers: X:1, T:title, M:4/4, L:1/8, Q:1/4=90, K:C or K:Dm
- Add V:1 name="Piano" clef=treble
- Use [V:1] before notes
- Each bar must total exactly 8 eighth-notes (L:1/8)
- End with a clean cadence and |]
- No repeats, no explanations.
`.trim()
      }],
      max_tokens: 300,
    });

    const rawABC = gptRes.choices?.[0]?.message?.content?.trim() || "";
    console.log("🎼 Raw ABC:\n", rawABC);

    const abcCode = rawABC
      .split("\n")
      .filter(line =>
        /^X:\d+/.test(line.trim()) ||
        /^T:/.test(line.trim()) ||
        /^M:4\/4/.test(line.trim()) ||
        /^L:1\/8/.test(line.trim()) ||
        /^Q:/.test(line.trim()) ||
        /^K:(C|Dm)/.test(line.trim()) ||
        /^V:1 /.test(line.trim()) ||
        /^\[V:1\]/.test(line.trim()) ||
        /^[A-Ga-gz|:\[\] \d,']+$/.test(line.trim())
      )
      .join("\n")
      .trim();

    const hasValidVoice =
      /(V:1\s+.*name="Piano".*clef=treble|V:1\s+.*clef=treble.*name="Piano")/.test(abcCode);

    const isValidABC =
      abcCode.includes("X:1") &&
      abcCode.includes("T:") &&
      abcCode.includes("M:4/4") &&
      abcCode.includes("L:1/8") &&
      abcCode.includes("Q:") &&
      (abcCode.includes("K:C") || abcCode.includes("K:Dm")) &&
      hasValidVoice &&
      abcCode.includes("[V:1]") &&
      abcCode.trim().endsWith("|]");

    if (!isValidABC) throw new Error("GPT did not return valid ABC with all required headers.");

    // 2. Convert ABC to MIDI
    let midiBuffer = await tryABCtoMIDI(abcCode);

    // 3. If broken, try patched version
    if (!midiBuffer) {
      console.warn("⚠️ Trying patched ABC...");
      const patched = patchABCEnding(abcCode);
      midiBuffer = await tryABCtoMIDI(patched);
    }

    // 4. Fallback melody if everything fails
    if (!midiBuffer) {
      console.warn("⚠️ Using fallback melody.");
      const fallbackABC = `
X:1
T:Fallback Lo-Fi
M:4/4
L:1/8
Q:1/4=90
K:C
V:1 name="Piano" clef=treble
[V:1] C2 E2 G2 C2 | D2 F2 A2 D2 | E2 G2 C2 E2 | C4 z4 |]
      `.trim();
      midiBuffer = await tryABCtoMIDI(fallbackABC);
    }

    if (!midiBuffer) throw new Error("MIDI conversion failed after all retries.");

    // 5. Convert to MP3
    const mp3Buffer = await new Promise((resolve, reject) => {
      const proc = spawn("/opt/homebrew/bin/ffmpeg", [
        "-y", "-f", "midi", "-i", "pipe:0",
        "-acodec", "libmp3lame", "-ab", "192k", "-f", "mp3", "pipe:1"
      ]);
      const chunks = [];
      proc.stdout.on("data", chunk => chunks.push(chunk));
      proc.stderr.on("data", data => console.error("ffmpeg stderr:", data.toString()));
      proc.on("close", code => {
        if (code !== 0) return reject(new Error(`ffmpeg failed with code ${code}`));
        resolve(Buffer.concat(chunks));
      });
      proc.on("error", reject);
      proc.stdin.write(midiBuffer);
      proc.stdin.end();
    });

    // 6. Upload to Firebase
    const filePath = `memory-music/${memoryId}.mp3`;
    const file = storage.bucket().file(filePath);
    await file.save(mp3Buffer, { metadata: { contentType: "audio/mpeg" }, resumable: false });
    await file.makePublic();

    const musicUrl = `https://storage.googleapis.com/${file.bucket.name}/${file.name}`;
    console.log("✅ Uploaded music:", musicUrl);
    await db.collection("memories").doc(memoryId).update({ musicUrl });

    return res.status(200).json({ musicUrl });

  } catch (err) {
    console.error("❌ AI music generation error:", err.message || err);
    return res.status(500).json({ message: "Failed to generate music." });
  }
};

// 🔧 Helper: Try ABC → MIDI conversion
const tryABCtoMIDI = async (abcCode) => {
  try {
    const tmpDir = os.tmpdir();
    const abcFile = path.join(tmpDir, `melody-${Date.now()}.abc`);
    const midiFile = path.join(tmpDir, `melody-${Date.now()}.mid`);

    fs.writeFileSync(abcFile, abcCode);

    return new Promise((resolve, reject) => {
      const proc = spawn("/opt/homebrew/bin/abc2midi", [abcFile, "-o", midiFile, "-c"]);

      proc.stderr.on("data", (data) => console.error("abc2midi stderr:", data.toString()));
      proc.on("close", (code) => {
        if (code !== 0 || !fs.existsSync(midiFile)) {
          return reject(new Error(`abc2midi failed with code ${code}`));
        }

        const midiBuffer = fs.readFileSync(midiFile);
        if (midiBuffer.length < 100 || midiBuffer.slice(0, 4).toString() !== "MThd") {
          return reject(new Error("abc2midi succeeded but output was invalid MIDI"));
        }

        fs.unlinkSync(abcFile);
        fs.unlinkSync(midiFile);
        resolve(midiBuffer);
      });

      proc.on("error", reject);
    });
  } catch (err) {
    console.error("❌ File-based MIDI generation failed:", err);
    return null;
  }
};


// 🩹 Patch broken ABC endings
const patchABCEnding = (abc) => {
  const requiredHeaders = [
    "X:1",
    "T:Auto-patched Melody",
    "M:4/4",
    "L:1/8",
    "Q:1/4=90",
    'V:1 name="Piano" clef=treble',
    "K:C",
  ];

  const hasHeaders =
    abc.includes("X:1") && abc.includes("K:") && abc.includes("V:1");

  let lines = abc
    .split("\n")
    .filter((line) =>
      line.trim().startsWith("[V:1]") ||
      /^[A-Ga-gz|:\[\] \d,']+$/.test(line.trim())
    );

  let melody = lines.join(" ").trim();

  // 🧼 CLEANUP STEP
  melody = melody
    .replace(/\|:|:\|/g, "")                  // Remove repeat markers
    .replace(/\|]{2,}/g, "|]")                // Fix ||]]
    .replace(/\|]\|]/g, "|]")                 // Fix |]|]
    .replace(/\[V:1\]/g, "")                  // Remove existing voice marker
    .replace(/[\^_=]/g, "")                   // Remove accidentals
    .replace(/([a-g])/g, (n) => n.toUpperCase()) // Normalize lowercase notes to uppercase
    .replace(/([A-G][',]?)(?=[A-G])/g, "$1 ") // Add spaces between notes
    .replace(/(?<!\d)(?<=^|\s)([A-G][',]?)(?!\d)/g, "$11") // Add duration if missing
    .replace(/([A-G][',]?)(\d{2,})/g, (_, note, dur) => `${note}${Math.min(+dur, 4)}`); // Cap note length

  const bars = melody
    .split("|")
    .map((bar) => bar.trim())
    .filter((bar) => bar.length > 0);

  const corrected = bars.map((bar) => {
    const notes = bar.match(/[A-Ga-gz][',]?\d*/g) || [];
    const total = notes.reduce((sum, n) => sum + (parseInt(n.replace(/[^\d]/g, "")) || 1), 0);

    if (total < 8) return bar + " z" + (8 - total);
    if (total > 8) {
      let built = [], count = 0;
      for (const n of notes) {
        const len = parseInt(n.replace(/[^\d]/g, "")) || 1;
        if (count + len > 8) break;
        built.push(n);
        count += len;
      }
      if (count < 8) built.push("z" + (8 - count));
      return built.join(" ");
    }
    return bar;
  });

  const finalLine = "[V:1] " + corrected.join(" | ") + " |]";

  return hasHeaders
    ? abc.replace(/\[V:1\][\s\S]*$/, finalLine)
    : [...requiredHeaders, finalLine].join("\n");
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

module.exports = { generateStory, generateMusic, addMemory, getAllMemories };
