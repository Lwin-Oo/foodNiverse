import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";

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

const MemoryCard = ({
  memory,
  currentUser,
  replyCountMap = {},
  sparkOwnerMap = {},
}) => {
  const navigate = useNavigate();
  const auraClass = getAuraClass(memory.mood, memory.vibe);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);

  const isOwner = memory.userId === currentUser?.uid;
  const isReply = !!memory.respondingTo;
  const repliesCount = replyCountMap[memory.id] || 0;
  const connectedTo = sparkOwnerMap[memory.respondingTo];
  const creatorName = memory.name || memory.email?.split("@")[0] || "someone";

  const youAreTagged =
    Array.isArray(memory.tags) &&
    memory.tags.some((tag) => tag.userId === currentUser?.uid) &&
    !isOwner;

  const handleToggleReplies = async () => {
    if (showReplies) return setShowReplies(false);
    try {
      const res = await API.get(`/memories/replies/${memory.id}`);
      setReplies(res.data.replies || []);
      setShowReplies(true);
    } catch (err) {
      console.error("❌ Failed to load replies:", err);
    }
  };

  return (
    <div
      className={`
        relative ${auraClass}
        group
        p-4 rounded-[2rem] max-w-[14rem] mx-auto
        border border-transparent hover:border-blue-200
        transition-all duration-200 ease-out
        hover:scale-[1.01]
        backdrop-blur-[2px]
        min-h-[27rem] max-h-fit
        flex flex-col justify-between
      `}
    >
      {/* ✨ Top-left Labels */}
      <div className="absolute top-3 left-3 flex flex-col space-y-1 z-20">
        {isReply && connectedTo && (
          <div className="bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-3 py-1 rounded-full shadow-sm">
            ✨ Connected with {connectedTo}
          </div>
        )}
      </div>

      {/* 🌟 Top-right Tag Alert if user was tagged */}
      {youAreTagged && (
        <div className="absolute top-3 right-3 z-20">
          <span className="bg-pink-100 text-pink-700 text-[10px] font-semibold px-3 py-1 rounded-full shadow-sm animate-pulse">
            🌟 You were part of this moment!
          </span>
        </div>
      )}

      {/* 🖼️ Image */}
      <div className="flex flex-col items-center space-y-3 z-10">
        <div className="overflow-hidden rounded-2xl h-40 w-full border-4 border-white">
          <img
            src={memory.image}
            alt="memory"
            className="w-full h-full object-cover"
          />
        </div>

        {(memory.mood || memory.vibe) && (
          <div className="text-[11px] font-medium text-gray-600 italic text-center px-2">
            {memory.mood && memory.vibe
              ? `It felt ${memory.mood}, with a ${memory.vibe} kind of comfort.`
              : memory.mood
              ? `It felt ${memory.mood}.`
              : `There was something ${memory.vibe} in the air.`}
          </div>
        )}

        <div className="text-center px-2">
          <p className="text-[0.9rem] text-gray-800 leading-relaxed font-serif italic line-clamp-3 max-h-[4.5rem] overflow-hidden">
            “{memory.journal}”
          </p>
          {memory.location?.description && (
            <p className="mt-1 text-[11px] text-blue-600 font-semibold tracking-wide">
              {memory.location.description}
            </p>
          )}
        </div>
      </div>

      {/* 🧵 Replies Viewer */}
      {/* {!isReply && isOwner && repliesCount > 0 && (
        <button
          onClick={handleToggleReplies}
          className="mt-3 text-[11px] text-indigo-600 font-semibold hover:underline"
        >
          💬 View {repliesCount} response{repliesCount > 1 ? "s" : ""}
        </button>
      )} */}

      {showReplies && replies.length > 0 && (
        <div className="mt-4 space-y-3">
          {replies.map((r) => (
            <div
              key={r.id}
              className="bg-white/80 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 italic"
            >
              {r.image && (
                <img
                  src={r.image}
                  alt="reply"
                  className="w-full h-32 object-cover rounded-md mb-2"
                />
              )}
              “{r.journal}”
              <p className="text-[10px] text-gray-400 mt-1">
                — {r.name || r.email?.split("@")[0] || "someone"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 👤 Creator */}
      <div
        className="flex items-center gap-2 mt-4 justify-center cursor-pointer transition-opacity duration-200 hover:opacity-80"
        onClick={() => navigate(`/profile/${creatorName}`)}
      >
        <img
          src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${creatorName}`}
          alt={creatorName}
          className="w-6 h-6 rounded-full border shadow"
        />
        <span className="text-xs text-gray-700 font-medium">{creatorName}</span>
      </div>
    </div>
  );
};

export default MemoryCard;
