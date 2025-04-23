import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../utils/api";
import GlobalHeader from "../../components/GlobalHeader/GlobalHeader";

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [user, setUser] = useState(null);
  const [memories, setMemories] = useState([]);
  const [vibeSummary, setVibeSummary] = useState(null);
  const [hasConnectionThread, setHasConnectionThread] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userRes = await API.get(`/user/${username}`);
        setUser(userRes.data);

        const memoriesRes = await API.get(`/memories/public?uid=${userRes.data.uid}`);
        setMemories(memoriesRes.data);

        const vibeRes = await API.get(`/user/${username}/vibe-summary`);
        setVibeSummary(vibeRes.data);

        // 🧠 Check thread access, but DO NOT redirect
        if (
          currentUser?.uid &&
          userRes.data?.uid &&
          currentUser.uid !== userRes.data.uid
        ) {
          const threadRes = await API.post("/ai/threads/check", {
            userId: currentUser.uid,
            email: currentUser.email,
            partnerEmail: userRes.data.email,
          });
          setHasConnectionThread(threadRes.data.hasThread);
        }
      } catch (err) {
        console.error("❌ Failed to fetch user profile or thread check:", err);
      }
    };

    fetchUserProfile();
  }, [username]);

  if (!user) return <div className="text-center mt-20">Loading...</div>;

  return (
    <>
      <GlobalHeader />
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

          {/* 🔗 Memory Thread Access Section */}
          {hasConnectionThread && (
            <div
              onClick={() => navigate(`/${user.name}/feed`)}
              className="mt-10 p-6 bg-gradient-to-br from-blue-100 via-white to-purple-100 border border-blue-200 rounded-3xl shadow-inner hover:shadow-xl transition cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-blue-800 mb-2">🌌 Enter Shared Memory Thread</h3>
              <p className="text-sm text-gray-600">
                You and <span className="font-bold text-blue-700">{user.name}</span> have shared meaningful moments.
                Step into the thread of memories that only the two of you can access.
              </p>
              <p className="mt-2 text-xs text-blue-500 italic">Click to enter their private memory stream ➜</p>
            </div>
          )}

          {/* 🌟 Public Memories */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">🌟 Public Memories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {memories.length === 0 && (
                <p className="text-sm text-gray-500 italic">No public memories yet.</p>
              )}
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
                    "{memory.journal.length > 100
                      ? memory.journal.slice(0, 100) + "..."
                      : memory.journal}"
                  </p>
                  <p className="mt-2 text-[12px] text-pink-600 font-semibold">
                    {memory.pairedWith?.length > 0
                      ? `✨ Shared with ${memory.pairedWith.map((p) => p.name || p.email).join(", ")}`
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
