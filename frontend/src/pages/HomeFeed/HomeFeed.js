import React, { useEffect, useState } from "react";
import API from "../../utils/api";
import MemoryCard from "../../components/MemoryCard/MemoryCard";

const HomeFeed = () => {
  const [memories, setMemories] = useState([]);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const res = await API.get("/memories");
        setMemories(res.data.memories);
      } catch (err) {
        console.error("❌ Failed to load memories:", err);
      }
    };

    fetchMemories();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-semibold mb-4">🧵 Your Memory Stream</h2>
      {memories.map((memory, idx) => (
        <MemoryCard key={idx} memory={memory} />
      ))}
    </div>
  );
};

export default HomeFeed;
