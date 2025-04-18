// components/MemoryModal/MemoryModal.js
import React from "react";

const MemoryModal = ({ memory, onClose }) => {
  if (!memory) return null;

  const getAuraClass = (mood, vibe) => {
    if (mood === "nostalgic") return "from-[#cbd5e1] via-white to-[#e0e7ff]";
    if (mood === "excited") return "from-[#bfdbfe] via-white to-[#ffe4e6]";
    if (mood === "cozy") return "from-[#fef9c3] via-white to-[#fce7f3]";
    if (mood === "peaceful") return "from-[#ccfbf1] via-white to-[#e0f2fe]";
    if (vibe === "spicy") return "from-[#fecaca] via-white to-[#fee2e2]";
    if (vibe === "warm") return "from-[#fde68a] via-white to-[#fcd34d]";
    if (vibe === "simple") return "from-[#f1f5f9] via-white to-[#e2e8f0]";
    if (vibe === "comforting") return "from-[#ddd6fe] via-white to-[#f3e8ff]";
    return "from-[#e0f7ff] via-white to-[#f0eaff]";
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center">
      <div
        className={`relative bg-gradient-to-br ${getAuraClass(
          memory.mood,
          memory.vibe
        )} p-8 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden backdrop-blur-lg`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 text-lg font-bold hover:text-black"
        >
          ✕
        </button>

        {/* Image */}
        <div className="w-full max-h-[18rem] overflow-hidden rounded-2xl border-4 border-white shadow-md mb-4">
          <img
            src={memory.image}
            alt="memory"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text Content */}
        <div className="text-center space-y-3">
          <p className="text-xl font-serif italic text-gray-800">“{memory.journal}”</p>
          <p className="text-sm text-gray-600">
            {memory.location?.description || "Somewhere special"}
          </p>
          <p className="text-[13px] italic text-gray-500">
            Mood: {memory.mood}, Vibe: {memory.vibe}
          </p>
          {memory.userNote && (
            <p className="text-[13px] text-gray-700">Note: {memory.userNote}</p>
          )}
          {memory.meaning && (
            <p className="text-sm text-blue-600 font-semibold">Meaning: {memory.meaning}/5</p>
          )}
        </div>

        {/* Music */}
        {memory.musicUrl && (
          <div className="mt-6">
            <p className="text-xs font-medium text-gray-600 text-center mb-2">
              Memory soundtrack
            </p>
            <audio controls className="w-full">
              <source src={memory.musicUrl} type="audio/mpeg" />
              Your browser does not support audio playback.
            </audio>
          </div>
        )}

        {/* Tags */}
        {memory.tags.length > 0 && (
          <div className="flex flex-wrap justify-center mt-4 gap-2 text-xs text-blue-700 font-medium">
            {memory.tags.map((tag, i) => (
              <span key={i} className="bg-blue-100 px-2 py-1 rounded-full shadow">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryModal;
