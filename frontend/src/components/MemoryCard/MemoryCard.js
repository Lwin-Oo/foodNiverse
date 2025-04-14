import React from "react";

const MemoryCard = ({ memory }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-3">
      <img
        src={memory.image}
        alt="memory"
        className="mx-auto max-h-[400px] w-auto object-contain rounded-lg border"
      />
      <p className="text-gray-800 text-base">{memory.journal}</p>
      <p className="text-xs text-gray-500">{memory.date}</p>
      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 text-sm text-blue-600 font-medium">
          {memory.tags.map((tag, i) => (
            <span key={i}>@{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoryCard;
