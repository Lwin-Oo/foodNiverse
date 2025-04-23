import React from "react";
import { useNavigate } from "react-router-dom";

const GlobalHeader = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-lg border-b border-blue-100 shadow-sm px-6 py-4 flex items-center justify-between">
      {/* Logo / App Name */}
      <div
        onClick={() => navigate(`/${user.name}/feed`)}
        className="text-xl font-bold text-blue-600 cursor-pointer"
      >
        Foodniverse
      </div>

      {/* User Info */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          @{user.name}
        </span>
        <button
          onClick={() => navigate(`/profile/${user.name}`)}
          className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-xs px-3 py-1 rounded-full transition"
        >
          View Profile
        </button>
      </div>
    </div>
  );
};

export default GlobalHeader;
