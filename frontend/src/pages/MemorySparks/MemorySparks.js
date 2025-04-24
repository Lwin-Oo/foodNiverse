import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";
import GlobalHeader from "../../components/GlobalHeader/GlobalHeader";
import MemoryForm from "../../components/MemoryForm/MemoryForm";
import PostSparkForm from "../../components/PostSparkForm/PostSparkForm";
import SparkCard from "../../components/SparkCard/SparkCard";

const MemorySparks = () => {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [sparks, setSparks] = useState([]);
  const [reflectsMap, setReflectsMap] = useState({});
  const [userMap, setUserMap] = useState({});
  const [expandedSparkId, setExpandedSparkId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReply, setActiveReply] = useState(null);
  const [replyingToSpark, setReplyingToSpark] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const sparkRes = await API.get("/sparks");
        const sparksFetched = Array.isArray(sparkRes.data)
          ? sparkRes.data
          : sparkRes.data.sparks || [];
        setSparks(sparksFetched);

        const reflectData = {};
        const uids = new Set();

        for (const spark of sparksFetched) {
          const reflectRes = await API.get(`/sparks/${spark.id}/reflects`);
          const reflects = reflectRes.data.reflects || [];
          reflectData[spark.id] = reflects;
          reflects.forEach((mem) => {
            if (mem.userId) uids.add(mem.userId);
          });
        }

        setReflectsMap(reflectData);

        const uidArray = Array.from(uids);
        if (uidArray.length) {
          const userRes = await API.post("/user/uid-map", { uids: uidArray });
          setUserMap(userRes.data.users);
        }
      } catch (err) {
        console.error("❌ Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleToggleReflect = (sparkId) => {
    setExpandedSparkId((prev) => (prev === sparkId ? null : sparkId));
  };

  const handlePostSpark = async (data) => {
    try {
      const res = await API.post("/sparks", data);
      const newSpark = res.data.spark;
      setSparks((prev) => [newSpark, ...prev]);
      setReflectsMap((prev) => ({ ...prev, [newSpark.id]: [] }));
    } catch (err) {
      console.error("❌ Failed to post spark:", err);
    }
  };

  const handleReplySubmit = (newReply, sparkId) => {
    setReflectsMap((prev) => ({
      ...prev,
      [sparkId]: [newReply, ...(prev[sparkId] || [])],
    }));
    setActiveReply(null);
    setReplyingToSpark(null);
  };

  const handleLove = async (sparkId) => {
    try {
      const res = await API.post("/sparks/love", { sparkId });
      const { loved } = res.data;
      setSparks((prev) =>
        prev.map((s) => {
          if (s.id !== sparkId) return s;
          const alreadyLoved = s.lovedBy?.includes(currentUser.uid);
          let updatedLovedBy = [...(s.lovedBy || [])];
          if (loved && !alreadyLoved) updatedLovedBy.push(currentUser.uid);
          if (!loved && alreadyLoved)
            updatedLovedBy = updatedLovedBy.filter((uid) => uid !== currentUser.uid);
          return {
            ...s,
            lovedBy: updatedLovedBy,
            loveCount: loved ? (s.loveCount || 0) + 1 : (s.loveCount || 1) - 1,
          };
        })
      );
    } catch (err) {
      console.error("❌ Love error:", err);
    }
  };

  const handleShare = async (sparkId) => {
    try {
      await API.post("/sparks/share", { sparkId });
      setSparks((prev) =>
        prev.map((s) => (s.id === sparkId ? { ...s, shareCount: (s.shareCount || 0) + 1 } : s))
      );
    } catch (err) {
      console.error("❌ Share error:", err);
    }
  };

  return (
    <>
      <GlobalHeader />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm shadow hover:bg-blue-700 transition"
          >
            ✨ Leave a Spark
          </button>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md rounded-xl bg-white p-6">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-2 right-3 text-gray-400 hover:text-red-500 text-lg"
              >
                &times;
              </button>
              <PostSparkForm
                onSubmit={(spark) => {
                  handlePostSpark(spark);
                  setShowModal(false);
                }}
                onClose={() => setShowModal(false)}
              />
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-500">Loading sparks...</p>
        ) : sparks.length === 0 ? (
          <p className="text-center text-gray-500">No sparks yet</p>
        ) : (
          <div className="space-y-6">
            {sparks.map((spark) => {
              const sparkId = spark.id;
              const loved = spark.lovedBy?.includes(currentUser.uid);
              const reflects = reflectsMap[sparkId] || [];

              return (
                <div key={sparkId} className="max-w-md mx-auto bg-white shadow-md rounded-xl p-4">
                  <SparkCard spark={spark} userMap={userMap} navigate={navigate} />

                  <div className="flex justify-between text-xs font-medium pt-2 border-t mt-2">
                    <button
                      className={`flex-1 py-2 transition flex items-center justify-center gap-1 ${
                        loved ? "text-red-600 font-bold" : ""
                      }`}
                      onClick={() => handleLove(sparkId)}
                    >
                      ❤️ Love {spark.loveCount > 0 && <span className="text-gray-500">({spark.loveCount})</span>}
                    </button>
                    <button
                      className="flex-1 py-2 hover:bg-gray-100 transition flex items-center justify-center gap-1"
                      onClick={() => handleShare(sparkId)}
                    >
                      🔁 Share {spark.shareCount > 0 && <span className="text-gray-500">({spark.shareCount})</span>}
                    </button>
                    <button
                      className="flex-1 py-2 hover:bg-gray-100 transition font-semibold flex items-center justify-center gap-1"
                      onClick={() => handleToggleReflect(sparkId)}
                    >
                      🪞 Reflect {reflects.length > 0 && <span className="text-blue-500">({reflects.length})</span>}
                    </button>
                  </div>

                  {expandedSparkId === sparkId && (
                    <div className="mt-3 space-y-3 border-t pt-3 border-dashed">
                      <button
                        onClick={() => {
                          setActiveReply(sparkId);
                          setReplyingToSpark(spark);
                        }}
                        className="text-[12px] text-indigo-600 hover:underline font-semibold mb-2"
                      >
                        ➕ Add Your Reflection
                      </button>
                      {reflects.map((mem, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <img
                            src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${mem.name}`}
                            alt={mem.name}
                            className="w-7 h-7 rounded-full border"
                          />
                          <div className="text-xs text-gray-700 flex-1">
                            <div className="flex justify-between">
                              <p className="font-semibold">
                                {userMap[mem.userId] || mem.name || mem.email?.split("@")[0]}
                              </p>
                              {mem.meaning && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px]">
                                  Meaning: {mem.meaning}/5
                                </span>
                              )}
                            </div>
                            {mem.image && (
                              <img
                                src={mem.image}
                                alt="Memory"
                                className="my-2 w-full h-32 object-cover rounded-md shadow"
                              />
                            )}
                            <p className="italic text-gray-600 line-clamp-2">“{mem.journal.slice(0, 200)}...”</p>
                            <p className="text-[10px] text-gray-400 mt-1">{mem.location?.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {activeReply && replyingToSpark && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <button
              onClick={() => {
                setActiveReply(null);
                setReplyingToSpark(null);
              }}
              className="absolute top-2 right-3 text-gray-400 hover:text-red-500 text-lg"
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold text-gray-800 text-center mb-3">
              Reflect on this Spark ✨
            </h2>
            <MemoryForm
              replyingTo={replyingToSpark.id}
              onAddMemory={(mem) => handleReplySubmit(mem, replyingToSpark.id)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MemorySparks;
