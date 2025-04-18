import React, { useEffect, useRef, useState } from "react";
import API from "../../utils/api";

const getBackdrop = (mood, vibe) => {
  if (mood === "nostalgic") return "from-[#cbd5e1] via-white to-[#e0e7ff]";
  if (mood === "excited") return "from-[#fca5a5] via-white to-[#ffe4e6]";
  if (mood === "cozy") return "from-[#fef9c3] via-white to-[#fde68a]";
  if (mood === "peaceful") return "from-[#ccfbf1] via-white to-[#e0f2fe]";
  if (vibe === "spicy") return "from-[#fecaca] via-white to-[#fee2e2]";
  if (vibe === "warm") return "from-[#fcd34d] via-white to-[#fef3c7]";
  if (vibe === "comforting") return "from-[#ddd6fe] via-white to-[#f3e8ff]";
  return "from-[#e0f7ff] via-white to-[#f0eaff]";
};

const MemoryPlayback = ({ memory, onClose }) => {
  const audioRef = useRef(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [musicUrl, setMusicUrl] = useState(memory.musicUrl || null);

  useEffect(() => {
    const generateMusicIfNeeded = async () => {
      if (!memory.musicUrl) {
        console.log("🎧 No musicUrl found. Requesting generation...");
        try {
          const res = await API.post("/memories/music", {
            memoryId: memory.id,
            mood: memory.mood,
            vibe: memory.vibe,
          });

          const url = res.data.musicUrl;
          console.log("✅ Music URL received:", url);
          setMusicUrl(url);
        } catch (err) {
          console.error("❌ Failed to generate music:", err);
        }
      } else {
        console.log("🎵 Music already exists:", memory.musicUrl);
        setMusicUrl(memory.musicUrl);
      }
    };

    generateMusicIfNeeded();
  }, [memory]);

  useEffect(() => {
    if (!musicUrl) return;

    const audio = new Audio(musicUrl);
    audioRef.current = audio;
    audio.preload = "auto";

    audio.addEventListener("canplaythrough", () => {
      setAudioLoaded(true);
    });

    audio.addEventListener("error", (e) => {
      console.error("❌ Audio error:", e);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [musicUrl]);

  useEffect(() => {
    if (audioLoaded && audioRef.current) {
      const playAudio = async () => {
        try {
          await audioRef.current.play();
        } catch (err) {
          console.warn("⚠️ Audio failed to play:", err);
        }
      };

      setTimeout(playAudio, 200);
    }
  }, [audioLoaded]);

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center">
      <div
        className={`relative w-full h-full bg-gradient-to-br ${getBackdrop(
          memory.mood,
          memory.vibe
        )} flex flex-col items-center justify-center px-6`}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-800 font-bold text-2xl z-50 hover:scale-110 transition"
        >
          ✕
        </button>

        {/* Image */}
        <div className="overflow-hidden w-80 h-80 rounded-full shadow-xl border-8 border-white animate-floatSlow">
          <img src={memory.image} alt="memory" className="w-full h-full object-cover" />
        </div>

        {/* Story */}
        <p className="mt-10 text-center text-xl font-serif italic text-gray-800 max-w-xl animate-fadeInSlow">
          “{memory.journal}”
        </p>

        {memory.userNote && (
          <p className="text-center text-sm text-gray-600 mt-2 max-w-sm">
            Note to self: {memory.userNote}
          </p>
        )}

        {/* 🎧 Music */}
        <div className="mt-6 animate-fadeInSlow">
          {audioLoaded && musicUrl ? (
            <audio controls className="w-full max-w-md" src={musicUrl} />
          ) : (
            <p className="text-sm text-gray-500 animate-pulse">Loading memory music...</p>
          )}
        </div>

        <div className="mt-6 text-xs text-blue-700 font-medium text-center">
          {memory.location?.description && <p>{memory.location.description}</p>}
          {memory.meaning && (
            <p className="mt-1 italic text-gray-600">Meaning: {memory.meaning}/5</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryPlayback;
