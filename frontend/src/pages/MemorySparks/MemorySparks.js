import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../utils/api";
import GlobalHeader from "../../components/GlobalHeader/GlobalHeader";
import MemoryForm from "../../components/MemoryForm/MemoryForm";

const MemorySparks = () => {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const { username } = useParams();
  const navigate = useNavigate();
  const [sparks, setSparks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReply, setActiveReply] = useState(null);
  const [replyMap, setReplyMap] = useState({});

  useEffect(() => {
    const fetchSparks = async () => {
      try {
        const res = await API.get("/memories/sparks");
        const otherSparks = res.data.sparks.filter(
          (spark) => spark.userId !== currentUser?.uid
        );
        setSparks(otherSparks);

        const replyData = {};
        for (const spark of otherSparks) {
          const threadRes = await API.get(`/memories/replies/${spark.id}`);
          replyData[spark.id] = threadRes.data.replies;
        }
        setReplyMap(replyData);
      } catch (err) {
        console.error("❌ Failed to fetch sparks or replies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSparks();
  }, []);

  const handleReplySubmit = (newReply, sparkId) => {
    setReplyMap((prev) => ({
      ...prev,
      [sparkId]: [newReply, ...(prev[sparkId] || [])],
    }));
    setActiveReply(null);
  };

  return (
    <>
      <GlobalHeader />
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          ✨ Memory Sparks
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">Loading sparks...</p>
        ) : sparks.length === 0 ? (
          <p className="text-center text-gray-500">No sparks near you</p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {sparks.map((spark) => (
              <div
                key={spark.id}
                className="bg-white/90 backdrop-blur-md border border-blue-100 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition duration-300 flex flex-col"
              >
                <img
                  src={spark.image}
                  alt="Memory Preview"
                  className="w-full h-48 object-cover rounded-xl mb-3"
                />

                <p className="text-sm text-gray-600 italic mb-2">
                  “{spark.journal.slice(0, 120)}
                  {spark.journal.length > 120 ? "..." : ""}”
                </p>

                <div className="text-xs text-blue-700 font-semibold mb-2">
                  Vibe: {spark.vibe} • Mood: {spark.mood}
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {spark.city}, {spark.country} • {spark.time}
                </p>

                {/* 👤 Creator */}
                <div
                  className="flex items-center gap-2 mt-2 cursor-pointer"
                  onClick={() => navigate(`/profile/${spark.creatorName}`)}
                >
                  <img
                    src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${spark.creatorName}`}
                    alt={spark.creatorName}
                    className="w-6 h-6 rounded-full border shadow-sm"
                  />
                  <span className="text-xs text-gray-700 font-medium">
                    {spark.creatorName}
                  </span>
                </div>

                {/* 🏷️ Tagged Partner */}
                {Array.isArray(spark.tags) && spark.tags.length > 0 && (
                  <div className="mt-1 text-[11px] text-blue-700 font-medium">
                    {spark.tags.some((tag) => tag.userId === currentUser?.uid) ? (
                      <span className="text-pink-600 animate-pulse font-semibold">
                        👀 Someone’s thinking of you!
                      </span>
                    ) : (
                      <>
                        with{" "}
                        <span
                          onClick={() => navigate(`/profile/${spark.tags[0].name}`)}
                          className="hover:underline cursor-pointer"
                        >
                          @{spark.tags[0].name}
                        </span>
                      </>
                    )}
                  </div>
                )}

                <button
                  className="mt-4 w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 rounded-full font-semibold hover:from-green-600 hover:to-blue-600 transition"
                  onClick={() => setActiveReply(spark.id)}
                >
                  Respond
                </button>

                {/* 🔁 Reply Thread */}
                {activeReply === spark.id && (
                  <div className="mt-6">
                    <MemoryForm
                      onAddMemory={(mem) => handleReplySubmit(mem, spark.id)}
                      replyingTo={spark.id}
                      isInline
                    />
                  </div>
                )}

                {/* 🧵 Replies */}
                {replyMap[spark.id] && replyMap[spark.id].length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Responses
                    </h4>
                    {replyMap[spark.id].map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm shadow-sm flex flex-col gap-2"
                      >
                        <div className="flex items-start gap-3">
                          {reply.image && (
                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-300">
                              <img
                                src={reply.image}
                                alt="reply"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-gray-700 italic line-clamp-3">
                              “{reply.journal}”
                            </p>

                            {/* 👤 Creator */}
                            <p
                              className="text-[11px] text-indigo-600 mt-1 font-medium cursor-pointer hover:underline"
                              onClick={() => navigate(`/profile/${reply.name}`)}
                            >
                              — @{reply.name}
                            </p>

                            {/* 🏷️ Tagged Partner */}
                            {Array.isArray(reply.tags) && reply.tags.length > 0 && (
                              <div className="mt-1 text-[10px] text-blue-700 font-medium">
                                {reply.tags.some((tag) => tag.userId === currentUser?.uid) ? (
                                  <span className="text-pink-600 animate-pulse font-semibold">
                                    🌟 You were part of this moment!
                                  </span>
                                ) : (
                                  <>
                                    with{" "}
                                    <span
                                      onClick={() => navigate(`/profile/${reply.tags[0].name}`)}
                                      className="hover:underline cursor-pointer"
                                    >
                                      @{reply.tags[0].name}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default MemorySparks;
