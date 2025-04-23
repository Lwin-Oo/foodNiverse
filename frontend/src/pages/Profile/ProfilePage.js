import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../utils/api";
import GlobalHeader from "../../components/GlobalHeader/GlobalHeader";

const ProfilePage = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [memories, setMemories] = useState([]);
  const [vibeSummary, setVibeSummary] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await API.get(`/user/${username}`);
        setUser(res.data);

        const memoriesRes = await API.get(`/memories/public?uid=${res.data.uid}`);
        setMemories(memoriesRes.data);

        const vibeRes = await API.get(`/user/${username}/vibe-summary`);
        setVibeSummary(vibeRes.data);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }
    };

    fetchUserProfile();
  }, [username]);

  if (!user) return <div className="text-center mt-20">Loading...</div>;

  return (
    <>
        <GlobalHeader/>
        <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto rounded-3xl shadow-xl bg-white/80 backdrop-blur-md p-10 border border-blue-100">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full overflow-hidden shadow-md ring-4 ring-blue-300">
            <img
              src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${user.name}`}
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-800">{user.name}</h1>
            <p className="text-sm text-gray-500 italic">@{username}</p>
            <p className="mt-2 text-blue-600 font-medium">
              Based in {user.city}, {user.country} • Vibe:{" "}
              <span className="font-bold text-pink-600">
                {vibeSummary?.topVibe || "?"}
              </span>
            </p>
            {vibeSummary?.vibeStats?.length > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                🧠 Vibe history:{" "}
                {vibeSummary.vibeStats
                  .slice(0, 3)
                  .map((v) => `${v.vibe} (${v.count})`)
                  .join(", ")}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">🌟 Public Memories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {memories.length === 0 && <p className="text-sm text-gray-500 italic">No public memories yet.</p>}
            {memories.map((memory) => (
              <div
                key={memory.id}
                className="p-4 rounded-2xl border border-gray-200 bg-white/70 shadow-md backdrop-blur-md hover:shadow-lg transition-all"
              >
                <div className="h-40 w-full rounded-xl overflow-hidden border mb-3">
                  <img
                    src={memory.image}
                    alt="memory"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[13px] text-gray-600 italic">
                  "{memory.journal.length > 100 ? memory.journal.slice(0, 100) + "..." : memory.journal}"
                </p>
                <p className="mt-2 text-[12px] text-pink-600 font-semibold">
                  {memory.pairedWith?.length > 0
                    ? `✨ Shared with ${memory.pairedWith.map(p => p.name || p.email).join(", ")}`
                    : "🧍 Solo memory"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ProfilePage;
