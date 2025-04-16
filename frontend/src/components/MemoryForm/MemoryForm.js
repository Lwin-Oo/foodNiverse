import React, { useState } from "react";
import API from "../../utils/api";

const moods = ["cozy", "excited", "nostalgic", "peaceful"];
const occasions = ["solo", "family", "date", "celebration"];
const vibes = ["warm", "spicy", "simple", "comforting"];
const locations = ["home", "restaurant", "street food", "friend's place"];
const times = ["morning", "lunch", "evening", "midnight"];

const MemoryForm = ({ onAddMemory }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [story, setStory] = useState("");
  const [tags, setTags] = useState("");

  const [mood, setMood] = useState("");
  const [occasion, setOccasion] = useState("");
  const [vibe, setVibe] = useState("");
  const [locationType, setLocationType] = useState("");
  const [time, setTime] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [userNote, setUserNote] = useState("");
  const [meaning, setMeaning] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const handleGenerateStory = async () => {
    setErrorMsg("");

    if (
      !imageFile ||
      !mood || !occasion || !vibe ||
      !locationType || !time || !city || !country
    ) {
      setErrorMsg("Please upload a photo and complete all fields before generating the memory.");
      return;
    }

    setLoading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Image = reader.result;

        const res = await API.post("/memories/generate", {
          image: base64Image,
          mood, occasion, vibe, location: locationType,
          time, city, country, userNote, meaning
        });

        setStory(res.data.story);
      } catch (err) {
        console.error("❌ GPT error:", err);
        setErrorMsg("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(imageFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || !story) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await API.post("/memories", {
          image: reader.result,
          journal: story,
          tags: tags.split(",").map((t) => t.trim()),
          userNote,
          meaning,
        });
        onAddMemory(res.data.memory);
        resetForm();
      } catch (err) {
        console.error("❌ Save error:", err);
        setErrorMsg("Could not save memory.");
      }
    };

    reader.readAsDataURL(imageFile);
  };

  const resetForm = () => {
    setImageFile(null);
    setImageUrl(null);
    setStory("");
    setTags("");
    setMood("");
    setOccasion("");
    setVibe("");
    setLocationType("");
    setTime("");
    setCity("");
    setCountry("");
    setUserNote("");
    setMeaning(null);
    setErrorMsg("");
  };

  const renderOptionGroup = (label, options, selected, setSelected, color) => (
    <div>
      <h3 className="font-semibold text-gray-700 mb-2">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => setSelected(option)}
            className={`px-3 py-1 rounded-full text-sm transition ${
              selected === option
                ? `bg-${color}-500 text-white`
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative pb-20">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 bg-white shadow-md p-6 rounded-xl max-w-2xl mx-auto"
      >
        <h2 className="text-xl font-bold text-center text-gray-800">
          📸 Create Your Memory Capsule
        </h2>

        <input type="file" accept="image/*" onChange={handleImageChange} />
        {imageUrl && (
          <img
            src={imageUrl}
            className="rounded-lg max-h-64 object-contain border"
            alt="Preview"
          />
        )}

        {renderOptionGroup("Mood", moods, mood, setMood, "blue")}
        {renderOptionGroup("Occasion", occasions, occasion, setOccasion, "green")}
        {renderOptionGroup("Vibe", vibes, vibe, setVibe, "pink")}
        {renderOptionGroup("Location Type", locations, locationType, setLocationType, "purple")}
        {renderOptionGroup("Time of Day", times, time, setTime, "yellow")}

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="City"
            className="flex-1 p-2 border border-gray-300 rounded"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            type="text"
            placeholder="Country"
            className="flex-1 p-2 border border-gray-300 rounded"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>

        <input
          type="text"
          placeholder="Tag friends (comma-separated)"
          className="p-3 border border-gray-300 rounded-md text-sm"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        <textarea
          rows={3}
          placeholder="Is there anything else you want to say about this moment?"
          className="p-3 border border-gray-300 rounded-md text-sm"
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
        />

        <div className="text-sm text-gray-600 text-center">
          How meaningful was this memory to you? 💛
          <div className="flex justify-center gap-2 mt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setMeaning(n)}
                type="button"
                className={`w-8 h-8 rounded-full text-sm font-bold ${
                  meaning === n ? "bg-yellow-400 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {story && (
          <div className="bg-white border-l-4 border-yellow-300 shadow-sm p-4 rounded-md space-y-2">
            <p className="text-sm text-gray-500 text-center">✨ Your memory reflection</p>
            <p className="text-center text-lg font-serif italic text-gray-800">“{story}”</p>
          </div>
        )}

        {errorMsg && <p className="text-sm text-red-500 text-center -mt-2">{errorMsg}</p>}

        <button
          type="button"
          onClick={handleGenerateStory}
          className="mt-4 bg-black text-white font-medium px-4 py-2 rounded-full hover:bg-gray-800 transition w-fit mx-auto"
        >
          {loading ? "Generating..." : "✨ Generate Story"}
        </button>
      </form>

      {/* Save button is sticky and beautiful */}
      <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-3 px-8 rounded-full shadow-lg text-sm transition"
        >
          💾 Save Memory
        </button>
      </div>
    </div>
  );
};

export default MemoryForm;
