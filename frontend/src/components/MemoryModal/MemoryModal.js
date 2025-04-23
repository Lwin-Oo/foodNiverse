import React from "react";
import { useNavigate } from "react-router-dom";

const MemoryModal = ({ memory, onClose }) => {
  const navigate = useNavigate();
  if (!memory) return null;

  const creatorName = memory.name || memory.email?.split("@")[0] || "someone";

  const getAuraClass = (mood, vibe) => {
    if (mood === "nostalgic") return "from-[#fdfcfb] via-[#e2ebf0] to-[#dfe9f3]";
    if (mood === "excited") return "from-[#fbd3e9] via-[#fcb69f] to-[#ffecd2]";
    if (mood === "cozy") return "from-[#fff1eb] via-[#ace0f9] to-[#c2e9fb]";
    if (mood === "peaceful") return "from-[#a1c4fd] via-[#c2e9fb] to-[#d4fc79]";
    if (vibe === "spicy") return "from-[#ff9a9e] via-[#fad0c4] to-[#fad0c4]";
    if (vibe === "warm") return "from-[#fbc2eb] via-[#a6c1ee] to-[#fbc2eb]";
    if (vibe === "comforting") return "from-[#fddb92] via-[#d1fdff] to-[#fddb92]";
    return "from-[#e0c3fc] via-[#8ec5fc] to-[#f9f586]";
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-hidden">
      {/* ✨ Background stuff (stars, bubbles)... */}

      {/* Modal Panel */}
      <div className={`relative bg-gradient-to-br ${getAuraClass(
        memory.mood,
        memory.vibe
      )} p-10 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.4)] max-w-5xl w-full mx-6 backdrop-blur-2xl z-10`}>

        {/* ❌ Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-700 text-3xl font-bold hover:scale-125 transition-all z-50"
        >
          ✕
        </button>

        {/* ✅ Content */}
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          {/* Image */}
          <div className="w-64 h-64 rounded-[2rem] overflow-hidden shadow-xl border-4 border-white animate-floatSlow">
            <img src={memory.image} alt="memory" className="w-full h-full object-cover" />
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left space-y-4 animate-fadeInSlow">
            <p className="text-3xl font-serif italic text-gray-800 drop-shadow-lg">
              “{memory.journal}”
            </p>
            <p className="text-md text-gray-600">
              {memory.location?.description || "Somewhere special"}
            </p>
            <p className="text-sm italic text-gray-500">
              Mood: {memory.mood}, Vibe: {memory.vibe}
            </p>
            {memory.userNote && (
              <p className="text-sm text-gray-700 font-light">Note: {memory.userNote}</p>
            )}
            {memory.meaning && (
              <p className="text-md text-blue-600 font-semibold">
                Meaning: {memory.meaning}/5
              </p>
            )}

            {/* Tags */}
            {Array.isArray(memory.tags) && memory.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start text-sm text-blue-700 font-medium">
                {memory.tags.map((tag, i) => (
                  <span key={i} className="bg-white/40 px-3 py-1 rounded-full shadow-md backdrop-blur-md">
                    {tag.name || tag.email}
                  </span>
                ))}
              </div>
            )}

            {/* ✅ Creator Avatar & Link */}
            <div
              onClick={() => navigate(`/profile/${creatorName}`)}
              className="mt-8 flex items-center gap-3 cursor-pointer justify-center md:justify-start"
            >
              <img
                src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${creatorName}`}
                alt={creatorName}
                className="w-8 h-8 rounded-full border shadow"
              />
              <span className="text-sm text-gray-700 font-semibold hover:underline">
                @{creatorName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemoryModal;
