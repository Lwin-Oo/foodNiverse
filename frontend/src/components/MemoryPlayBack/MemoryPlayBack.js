import React, { useEffect, useState } from "react";
import API from "../../utils/api";

const MemoryPlayback = ({ memory, onClose }) => {
  const [embedUrl, setEmbedUrl] = useState(null);

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const res = await API.post("/memories/music", {
          memoryId: memory.id,
          mood: memory.mood,
          vibe: memory.vibe,
        });

        const url = res.data.embedUrl;
        if (!url.includes("https://open.spotify.com/embed/track/")) {
          throw new Error("Invalid embed URL");
        }

        const autoPlayUrl = url + "?autoplay=1";
        setEmbedUrl(autoPlayUrl);
      } catch (err) {
        console.error("❌ Failed to get Spotify music:", err);
      }
    };

    fetchMusic();
  }, [memory]);

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center">
      <div className="relative w-full h-full bg-gradient-to-br from-[#cbd5e1] via-white to-[#e0e7ff] flex flex-col items-center justify-center px-6">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-800 font-bold text-2xl z-50 hover:scale-110 transition"
        >
          ✕
        </button>

        {/* Memory Image */}
        <div className="overflow-hidden w-80 h-80 rounded-full border-8 border-white shadow-lg">
          <img src={memory.image} alt="memory" className="w-full h-full object-cover" />
        </div>

        {/* Memory Story */}
        <p className="mt-10 text-xl italic text-gray-800 text-center max-w-xl">
          “{memory.journal}”
        </p>

        {memory.userNote && (
          <p className="mt-2 text-sm text-gray-600 text-center max-w-sm">
            Note to self: {memory.userNote}
          </p>
        )}

        {/* 🎧 Spotify Music */}
        <div className="mt-6">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              width="300"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              className="rounded-xl shadow-xl"
              title="Spotify Player"
            />
          ) : (
            <p className="text-sm text-gray-500 animate-pulse">
              Finding perfect background music...
            </p>
          )}
        </div>

        {/* Memory Meta */}
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
