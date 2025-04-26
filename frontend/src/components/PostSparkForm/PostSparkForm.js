import React, { useState, useEffect } from "react";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import API from "../../utils/api";

const MOOD_OPTIONS = ["open", "nostalgic", "excited", "cozy", "peaceful"];
const VIBE_OPTIONS = ["friendly", "spicy", "warm", "simple", "comforting"];
const OCCASION_OPTIONS = ["hangout", "date", "family dinner", "birthday", "exploration"];
const TIME_OPTIONS = ["morning", "lunch", "evening", "midnight"];

const PostSparkForm = ({ onSubmit, onClose }) => {
  const [form, setForm] = useState({ journal: "", mood: "", vibe: "", occasion: "", time: "" });
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [lunrSuggestion, setLunrSuggestion] = useState("");
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationErrorMessage, setLocationErrorMessage] = useState("");

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({ debounce: 300 });

  useEffect(() => {
    let didSet = false;
  
    const setLoc = (lat, lng, label = "Current Location") => {
      setSelectedPlace({ description: label, lat, lng });
      setLocationGranted(true);
      setLocationDenied(false);
      didSet = true;
    };
  
    const fallbackToCurrent = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLoc(pos.coords.latitude, pos.coords.longitude),
        () => fallbackToDefault(),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };
  
    const fallbackToDefault = async () => {
      try {
        // Optional: fetch IP-based location from backend
        const res = await fetch("https://ipapi.co/json");
        const data = await res.json();
        setLoc(data.latitude, data.longitude, "Estimated from IP");
      } catch {
        // Final fallback if IP fails
        setLoc(43.0731, -89.4012, "Default: Madison, WI");
      }
    };
  
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!didSet) setLoc(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn("⚠️ watchPosition failed:", err.message);
          fallbackToCurrent();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      );
  
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      fallbackToDefault();
    }
  }, []);
  

  useEffect(() => {
    const fetchSuggestion = async () => {
      if (form.journal.trim().length < 4 || !selectedPlace) return setLunrSuggestion("");
      try {
        const token = localStorage.getItem("token");
        const res = await API.post(
          "/ai/spark-suggest",
          { text: form.journal, location: selectedPlace },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLunrSuggestion(res.data.suggestion);
        if (res.data.suggestion?.category) {
            setForm(prev => ({ ...prev, category: res.data.suggestion.category }));
        }
      } catch (err) {
        console.error("❌ Lunr AI suggestion error:", err);
      }
    };
    const debounce = setTimeout(fetchSuggestion, 600);
    return () => clearTimeout(debounce);
  }, [form.journal, selectedPlace]);
  

  const splitSuggestion = (text) => {
    if (!text || typeof text !== "string") {
      return { intro: "Suggested Spot", name: "Unknown", address: "Unknown Location" };
    }
  
    const cleaned = text.replace(/^["']|["']$/g, "").replace(/💡/g, "").trim();
  
    // Handles "How about Strings Ramen Shop Madison at 311 N Frances St, Madison?"
    const match = cleaned.match(/^(.*?)\s+(.+?)\s+at\s+(.+?)\.?$/i);
    if (match) {
      const intro = match[1].trim();
      const name = match[2].trim();
      const address = match[3].trim().replace(/\?$/, "");
      return { intro, name, address };
    }
  
    // Fallback: Try to split by last comma
    const lastComma = cleaned.lastIndexOf(",");
    if (lastComma !== -1) {
      return {
        intro: "Suggested Spot",
        name: cleaned.slice(0, lastComma).trim(),
        address: cleaned.slice(lastComma + 1).trim().replace(/\?$/, ""),
      };
    }
  
    // Final fallback
    return {
      intro: "Suggested Spot",
      name: cleaned,
      address: "",
    };
  };
  
  
  const handleAISuggestionClick = async () => {
    const { name, address } = lunrSuggestion;
    const placeQuery = `${name}, ${address}`;
  
    setValue(placeQuery, true); // Update input value
    clearSuggestions();         // Clear suggestions before fetch
  
    const waitForSuggestions = () => new Promise((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(() => {
        if (status === "OK" && data.length > 0) {
          const match = data.find((d) =>
            d.description.toLowerCase().includes(name.toLowerCase()) ||
            d.description.toLowerCase().includes(address.toLowerCase())
          );
          if (match) {
            clearInterval(interval);
            resolve(match);
          }
        }
        if (++attempts >= 10) {
          clearInterval(interval);
          reject("❌ Could not find place in dropdown");
        }
      }, 400);
    });
  
    try {
      const match = await waitForSuggestions();
      setValue(match.description, false);
      clearSuggestions();
      const geo = await getGeocode({ address: match.description });
      const { lat, lng } = await getLatLng(geo[0]);
      setSelectedPlace({ description: match.description, lat, lng });
    } catch (err) {
      console.error("❌ AI Suggestion selection error:", err);
    }
  };
  

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.journal || !form.mood || !form.vibe || !form.occasion || !form.time || !form.category || !selectedPlace) return;
    
    const spark = { ...form, location: selectedPlace, image: "" };
    onSubmit(spark);
  
    setForm({ journal: "", mood: "", vibe: "", occasion: "", time: "", category: "" });
    setValue("");
    setSelectedPlace(null);
    setLunrSuggestion("");
    onClose();
  };
  

  return (
    <div className="bg-white w-full max-w-md mx-auto rounded-xl p-6 shadow-xl border border-blue-100 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 text-center">Leave a Spark ✨</h2>
      {!locationGranted ? (
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600 mb-2">
            To help us suggest meaningful places around you, please enable location access.
          </p>
          <p className="text-xs text-red-500 mt-2">{locationErrorMessage}</p>
        </div>
      ) : (
        <>
          <textarea
            value={form.journal}
            onChange={(e) => setForm({ ...form, journal: e.target.value })}
            placeholder="Spark a craving, a connection, an experience, or a find."
            rows={2}
            className="w-full border border-gray-300 rounded-md p-2 text-sm"
          />

{lunrSuggestion && (() => {
  const { intro, name, address } = lunrSuggestion;
  

  return (
    <div className="flex flex-col items-center mt-2 space-y-2">
      <p className="text-sm font-medium text-indigo-600">{intro}</p>
      <div
        onClick={handleAISuggestionClick}
        className="cursor-pointer transition-transform duration-300 ease-out transform hover:scale-[1.02] bg-indigo-50 border border-indigo-200 rounded-xl shadow-md p-4 w-full max-w-sm"
      >
        <p className="text-base text-gray-800 font-semibold">{name}</p>
        {address && <p className="text-sm text-gray-600 mt-1">{address}</p>}
      </div>
    </div>
  );
})()}


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {["mood", "vibe", "occasion", "time"].map((key, i) => {
              const options = [MOOD_OPTIONS, VIBE_OPTIONS, OCCASION_OPTIONS, TIME_OPTIONS][i];
              return (
                <select
                  key={key}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="border border-gray-300 p-2 text-sm rounded"
                >
                  <option value="">{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                  {options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              );
            })}
          </div>

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
            <button onClick={onClose} className="text-gray-500 text-sm hover:underline">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
            >
              Post
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default PostSparkForm;