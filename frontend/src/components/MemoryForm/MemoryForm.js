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
    if (!mood || !occasion || !vibe || !locationType || !time || !city || !country) {
      setErrorMsg("Please complete all fields before generating the memory.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/memories/generate", {
        mood,
        occasion,
        vibe,
        location: locationType,
        time,
        city,
        country,
      });
      setStory(res.data.story);
    } catch (err) {
      console.error("❌ GPT error:", err);
      setErrorMsg("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white shadow-md p-6 rounded-xl max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-center text-gray-800">📸 Create Your Memory Capsule</h2>

      <input type="file" accept="image/*" onChange={handleImageChange} />
      {imageUrl && <img src={imageUrl} className="rounded-lg max-h-64 object-contain border" alt="Preview" />}

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

      <div className="text-center">
        <button
          type="button"
          onClick={handleGenerateStory}
          className="bg-black text-white font-medium px-4 py-2 rounded-full mt-4 hover:bg-gray-800 transition"
        >
          {loading ? "Generating..." : "✨ Generate Story"}
        </button>
      </div>

      {errorMsg && <p className="text-sm text-red-500 text-center -mt-2">{errorMsg}</p>}

      {story && (
        <div className="bg-gray-50 p-4 rounded-md text-center italic text-gray-700 border border-dashed">
          “{story}”
        </div>
      )}

      <input
        type="text"
        placeholder="Tag friends (comma-separated)"
        className="p-3 border border-gray-300 rounded-md text-sm"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
      />

      <button
        type="submit"
        className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-2 px-6 rounded-full shadow text-sm mx-auto transition"
      >
        💾 Save Memory
      </button>
    </form>
  );
};

export default MemoryForm;
