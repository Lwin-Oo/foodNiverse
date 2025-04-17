import React, { useState } from "react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
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
  const [userNote, setUserNote] = useState("");
  const [meaning, setMeaning] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({ debounce: 300 });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const handleGenerateStory = async () => {
    setErrorMsg("");
    if (!imageFile || !mood || !occasion || !vibe || !locationType || !time || !selectedPlace) {
      setErrorMsg("Please complete all fields before generating the memory.");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Image = reader.result;
        const res = await API.post("/memories/generate", {
          image: base64Image,
          mood,
          occasion,
          vibe,
          location: locationType,
          time,
          city: selectedPlace?.description || "",
          country: selectedPlace?.description || "", // TEMP for compatibility
          userNote,
          meaning,
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
          mood,
          vibe,
          location: selectedPlace || null,
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
    setUserNote("");
    setMeaning(null);
    setValue("");
    setSelectedPlace(null);
    setErrorMsg("");
  };

  const renderOptionGroup = (label, options, selected, setSelected, color) => (
    <div className="mb-4">
      <h3 className="font-semibold text-gray-600 mb-1 text-xs uppercase tracking-wider">{label}</h3>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setSelected(option)}
            className={`px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all duration-300 ${
              selected === option
                ? `bg-${color}-600 text-white ring-4 ring-${color}-300 scale-105 animate-pulseSlow`
                : `bg-${color}-100 text-${color}-800 hover:bg-${color}-200`
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen px-4 pb-28 pt-10">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 bg-white/70 shadow-xl backdrop-blur-md p-8 rounded-3xl max-w-2xl mx-auto border border-blue-100 ring-1 ring-blue-200"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">Create Your Memory Capsule</h2>

        <input type="file" accept="image/*" onChange={handleImageChange} />
        {imageUrl && (
          <div className="rounded-full overflow-hidden w-64 h-64 mx-auto ring-4 ring-sky-300 shadow-xl">
            <img src={imageUrl} alt="Memory Preview" className="w-full h-full object-cover" />
          </div>
        )}

        {renderOptionGroup("Mood", moods, mood, setMood, "blue")}
        {renderOptionGroup("Occasion", occasions, occasion, setOccasion, "blue")}
        {renderOptionGroup("Vibe", vibes, vibe, setVibe, "blue")}
        {renderOptionGroup("Location Type", locations, locationType, setLocationType, "blue")}
        {renderOptionGroup("Time of Day", times, time, setTime, "blue")}

        {/* Google Places Autocomplete */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search a place"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSelectedPlace(null); // reset selectedPlace if they start typing again
            }}
            disabled={!ready}
            className="w-full p-3 border border-gray-300 rounded-md text-sm"
          />
          {status === "OK" && data.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-200 rounded-md mt-1 w-full shadow-md max-h-48 overflow-y-auto">
              {data.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={async () => {
                    const selected = suggestion.description;
                    setValue(selected, false); // Don't trigger new fetch
                    clearSuggestions(); // Hide dropdown
                    setSelectedPlace(null); // Optional: reset before setting new one
                  
                    try {
                      const results = await getGeocode({ address: selected });
                      const { lat, lng } = await getLatLng(results[0]);
                      setSelectedPlace({
                        description: selected,
                        lat,
                        lng,
                      });
                    } catch (err) {
                      console.error("❌ Location select error:", err);
                    }
                  }}
                  
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {suggestion.description}
                </li>
              ))}
            </ul>
          )}
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
          placeholder="What makes this moment so special?"
          className="p-3 border border-gray-300 rounded-md text-sm"
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
        />

        <div className="text-sm text-gray-600 text-center">
          How meaningful was this memory to you?
          <div className="flex justify-center gap-2 mt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setMeaning(n)}
                type="button"
                className={`w-8 h-8 rounded-full text-sm font-bold ${
                  meaning === n ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {story && (
          <div className="bg-white/90 border-l-4 border-blue-400 shadow-md p-4 rounded-md space-y-2 backdrop-blur">
            <p className="text-sm text-gray-600 text-center">Your memory reflection</p>
            <p className="text-center text-lg font-serif italic text-gray-800">“{story}”</p>
          </div>
        )}

        {errorMsg && <p className="text-sm text-red-500 text-center">{errorMsg}</p>}

        <button
          type="button"
          onClick={handleGenerateStory}
          className="mt-2 bg-blue-600 text-white font-medium px-6 py-3 rounded-full hover:bg-blue-700 transition w-fit mx-auto"
        >
          {loading ? "Generating..." : "Generate Story"}
        </button>
      </form>

      {/* Save Memory Floating Orb */}
      <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 px-10 rounded-full shadow-2xl text-sm transition transform hover:scale-105 animate-pulseSlow"
        >
          Save Memory
        </button>
      </div>
    </div>
  );
};

export default MemoryForm;
