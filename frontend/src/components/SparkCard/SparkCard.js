import React from "react";

const SparkCard = ({ spark, userMap, navigate }) => {
  return (
    <div className="bg-white/90 border border-blue-100 rounded-xl p-4 shadow flex flex-col">
      <p className="text-sm text-gray-700 italic mb-2">
        “{spark.journal.slice(0, 120)}{spark.journal.length > 120 ? "..." : ""}”
      </p>

      <div className="flex flex-wrap gap-2 mb-2">
        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
          🧠 {spark.mood}
        </span>
        <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-xs font-semibold">
          🎨 {spark.vibe}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-2">
        {spark?.location?.description || "Unknown"} • {spark.time}
      </p>

      <div
        className="flex items-center gap-2 mt-1 cursor-pointer"
        onClick={() => navigate(`/profile/${spark.name}`)}
      >
        <img
          src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${spark.name}`}
          alt={spark.name}
          className="w-6 h-6 rounded-full border"
        />
        <span className="text-xs text-gray-700 font-medium">{spark.name}</span>
      </div>
    </div>
  );
};

export default SparkCard;
