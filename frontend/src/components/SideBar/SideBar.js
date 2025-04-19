import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const { pathname } = useLocation();
  const [username, setUsername] = useState(localStorage.getItem("username"));

  // 🔁 Watch for changes in localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const storedUsername = localStorage.getItem("username");
      if (storedUsername !== username) {
        setUsername(storedUsername);
      }
    }, 500); // check every 0.5s

    return () => clearInterval(interval);
  }, [username]);

  const navItem = (path, label, icon) => (
    <Link
      to={path}
      className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition ${
        pathname === path ? "bg-gray-300" : ""
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="w-52 bg-white shadow-md p-4 space-y-4">
      <h1 className="text-xl font-bold text-center">🍱 Memo</h1>
      {navItem(`/${username}/feed`, "Home", "🏠")}
      {navItem(`/${username}/create`, "Create Memory", "➕")}
      {navItem(`/${username}/chat`, "Chat", "💬")}
    </div>
  );
};

export default Sidebar;
