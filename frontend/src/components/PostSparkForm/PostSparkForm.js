import React, { useState } from "react";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";

const MOOD_OPTIONS = ["open", "nostalgic", "excited", "cozy", "peaceful"];
const VIBE_OPTIONS = ["friendly", "spicy", "warm", "simple", "comforting"];
const OCCASION_OPTIONS = ["hangout", "date", "family dinner", "birthday", "exploration"];
const TIME_OPTIONS = ["morning", "lunch", "evening", "midnight"];

const PostSparkForm = ({ onSubmit, onClose }) => {
    const [form, setForm] = useState({
      journal: "",
      mood: "",
      vibe: "",
      occasion: "",
      time: "",
    });
  
    const [selectedPlace, setSelectedPlace] = useState(null);
  
    const {
      ready,
      value,
      setValue,
      suggestions: { status, data },
      clearSuggestions,
    } = usePlacesAutocomplete({ debounce: 300 });
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!form.journal || !form.mood || !form.vibe || !form.occasion || !form.time || !selectedPlace) return;
  
      const spark = {
        ...form,
        location: {
          description: selectedPlace.description,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
        },
        image: "",
      };
  
      onSubmit(spark);
      setForm({ journal: "", mood: "", vibe: "", occasion: "", time: "" });
      setValue("");
      setSelectedPlace(null);
      onClose();
    };
  
    return (
      <div className="bg-white w-full max-w-md mx-auto rounded-xl p-6 shadow-xl border border-blue-100 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 text-center">Leave a Spark ✨</h2>
  
        <textarea
          value={form.journal}
          onChange={(e) => setForm({ ...form, journal: e.target.value })}
          placeholder="What’s on your mind?"
          rows={2}
          className="w-full border border-gray-300 rounded-md p-2 text-sm"
        />
  
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={form.mood}
            onChange={(e) => setForm({ ...form, mood: e.target.value })}
            className="border border-gray-300 p-2 text-sm rounded"
          >
            <option value="">Mood</option>
            {MOOD_OPTIONS.map((m) => <option key={m}>{m}</option>)}
          </select>
          <select
            value={form.vibe}
            onChange={(e) => setForm({ ...form, vibe: e.target.value })}
            className="border border-gray-300 p-2 text-sm rounded"
          >
            <option value="">Vibe</option>
            {VIBE_OPTIONS.map((v) => <option key={v}>{v}</option>)}
          </select>
          <select
            value={form.occasion}
            onChange={(e) => setForm({ ...form, occasion: e.target.value })}
            className="border border-gray-300 p-2 text-sm rounded"
          >
            <option value="">Occasion</option>
            {OCCASION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="border border-gray-300 p-2 text-sm rounded"
          >
            <option value="">Time</option>
            {TIME_OPTIONS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
  
        {/* Google Places Autocomplete */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search place"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSelectedPlace(null);
            }}
            disabled={!ready}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          />
          {status === "OK" && data.length > 0 && (
            <ul className="absolute z-10 bg-white border border-gray-200 rounded shadow max-h-40 overflow-y-auto mt-1 text-sm w-full">
              {data.map((suggestion) => (
                <li
                  key={suggestion.place_id}
                  onClick={async () => {
                    const description = suggestion.description;
                    setValue(description, false);
                    clearSuggestions();
                    try {
                      const results = await getGeocode({ address: description });
                      const { lat, lng } = await getLatLng(results[0]);
                      setSelectedPlace({ description, lat, lng });
                    } catch (err) {
                      console.error("❌ Location select error:", err);
                    }
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {suggestion.description}
                </li>
              ))}
            </ul>
          )}
        </div>
  
        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 text-sm hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
          >
            Post
          </button>
        </div>
      </div>
    );
  };

export default PostSparkForm;
