import React from "react";

const getAuraClass = (mood, vibe) => {
  if (mood === "nostalgic") return "bg-gradient-to-r from-[#cbd5e1] via-white to-[#e0e7ff]";
  if (mood === "excited") return "bg-gradient-to-r from-[#bfdbfe] via-white to-[#ffe4e6]";
  if (mood === "cozy") return "bg-gradient-to-r from-[#fef9c3] via-white to-[#fce7f3]";
  if (mood === "peaceful") return "bg-gradient-to-r from-[#ccfbf1] via-white to-[#e0f2fe]";
  if (vibe === "spicy") return "bg-gradient-to-r from-[#fecaca] via-white to-[#fee2e2]";
  if (vibe === "warm") return "bg-gradient-to-r from-[#fde68a] via-white to-[#fcd34d]";
  if (vibe === "simple") return "bg-gradient-to-r from-[#f1f5f9] via-white to-[#e2e8f0]";
  if (vibe === "comforting") return "bg-gradient-to-r from-[#ddd6fe] via-white to-[#f3e8ff]";
  return "bg-gradient-to-b from-[#e0f7ff] via-white to-[#f0eaff]";
};

const MemoryCard = ({ memory, currentUser }) => {
  const auraClass = getAuraClass(memory.mood, memory.vibe);
  const isOwner = memory.userId === currentUser?.uid;
  const isFeatured = Array.isArray(memory.tags)
    ? memory.tags.some(tag => tag.userId === currentUser?.uid)
    : false;

  const creatorName = memory.name || memory.email?.split("@")[0] || "Someone";

  return (
    <div
      className={`
        relative ${auraClass}
        p-4 rounded-[2rem] shadow-xl w-full max-w-[14rem] mx-auto border border-blue-100 ring-1 ring-blue-200
        backdrop-blur-md overflow-hidden
        transition-transform duration-300 hover:-translate-y-1 hover:ring-2
      `}
    >
      {/* Romantic Featured Tag */}
      {!isOwner && isFeatured && (
        <div className="absolute top-3 left-3 bg-pink-100 text-pink-700 text-[10px] font-semibold px-3 py-1 rounded-full shadow-sm z-20">
          💌 {creatorName} made this memory with you
        </div>
      )}

      <div className="relative flex flex-col items-center space-y-3 z-10">
        {/* Image */}
        <div className="overflow-hidden rounded-2xl h-40 w-full border-4 border-white shadow-md">
          <img
            src={memory.image}
            alt="memory"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Mood / Vibe */}
        {(memory.mood || memory.vibe) && (
          <div className="text-[11px] font-medium text-gray-600 italic text-center px-2">
            {memory.mood && memory.vibe
              ? `It felt ${memory.mood}, with a ${memory.vibe} kind of comfort.`
              : memory.mood
              ? `It felt ${memory.mood}.`
              : `There was something ${memory.vibe} in the air.`}
          </div>
        )}

        {/* Journal */}
        <div className="text-center px-2">
          <p className="text-[0.9rem] text-gray-800 leading-relaxed font-serif italic">
            “{memory.journal}”
          </p>

          {memory.location?.description && (
            <p className="mt-1 text-[11px] text-blue-600 font-semibold tracking-wide">
              {memory.location.description}
            </p>
          )}
        </div>

        {/* Tag Info */}
        {Array.isArray(memory.tags) && memory.tags.length > 0 && (
          <p className="mt-2 text-[11px] font-semibold text-center text-pink-600">
            {isOwner
              ? `✨ Shared with ${memory.tags.map(t => t.name || t.email).join(", ")}`
              : ""}
          </p>
        )}
      </div>
    </div>
  );
};

export default MemoryCard;
