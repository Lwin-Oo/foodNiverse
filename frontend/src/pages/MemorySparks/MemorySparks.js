import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../utils/api";
import GlobalHeader from "../../components/GlobalHeader/GlobalHeader";
import MemoryForm from "../../components/MemoryForm/MemoryForm";
import PostSparkForm from "../../components/PostSparkForm/PostSparkForm";
import SparkCard from "../../components/SparkCard/SparkCard";
import ReplyForm from "../../components/ReplyForm/ReplyForm";

const MemorySparks = () => {
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const [sparks, setSparks] = useState([]);
  const [reflectsMap, setReflectsMap] = useState({});
  const [repliesMap, setRepliesMap] = useState({});
  const [userMap, setUserMap] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
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
        const replyData = {};
        const uids = new Set();

        for (const spark of sparksFetched) {
          const reflectRes = await API.get(`/sparks/${spark.id}/reflects`);
          const reflects = reflectRes.data.reflects || [];
          reflectData[spark.id] = reflects;

          const replyRes = await API.get(`/sparks/${spark.id}/replies`);
          const replies = replyRes.data.replies || [];
          replyData[spark.id] = replies;

          reflects.forEach((mem) => { if (mem.userId) uids.add(mem.userId); });
          replies.forEach((r) => { if (r.userId) uids.add(r.userId); });
        }

        setReflectsMap(reflectData);
        setRepliesMap(replyData);

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

  const handleToggleReplies = (sparkId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [sparkId]: !prev[sparkId]
    }));
  };

  const handlePostSpark = async (data) => {
    try {
      const res = await API.post("/sparks", data);
      const newSpark = res.data.spark;
      setSparks((prev) => [newSpark, ...prev]);
      setReflectsMap((prev) => ({ ...prev, [newSpark.id]: [] }));
      setRepliesMap((prev) => ({ ...prev, [newSpark.id]: [] }));
    } catch (err) {
      console.error("❌ Failed to post spark:", err);
    }
  };

  const handleReplySubmit = (newReply, sparkId) => {
    setRepliesMap((prev) => ({
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
              const replies = repliesMap[sparkId] || [];

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
                      className="flex-1 py-2 hover:bg-gray-100 transition flex items-center justify-center gap-1"
                      onClick={() => handleToggleReplies(sparkId)}
                    >
                      💬 Reply {replies.length > 0 && <span className="text-blue-500">({replies.length})</span>}
                    </button>
                  </div>

                  {expandedReplies[sparkId] && (
                    <div className="mt-3 space-y-3 border-t pt-3 border-dashed">
                      {replies.map((r, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <img
                            src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${r.name}`}
                            alt={r.name}
                            className="w-7 h-7 rounded-full border"
                          />
                          <div className="text-xs text-gray-700 flex-1">
                            <p className="font-semibold">
                              {userMap[r.userId] || r.name || r.email?.split("@")[0]}
                            </p>
                            <p className="italic text-gray-600">
                                {r.journal.split(/(\[.*?\]\(.*?\))/g).map((part, idx) => {
                                    const match = part.match(/\[(.*?)\]\((.*?)\)/);
                                    if (match) {
                                        return (
                                                    <a
                                                        key={idx}
                                                        href={match[2]}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 underline hover:text-blue-800"
                                                    >
                                                {match[1]}
                                            </a>
                                        );
                                    }
                                        return <span key={idx}>{part}</span>;
                                    })}
                                </p>
                            </div>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          setActiveReply(sparkId);
                          setReplyingToSpark(spark);
                        }}
                        className="text-xs text-indigo-600 hover:underline font-semibold"
                      >
                        ➕ Leave a Reply
                      </button>
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
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
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
              Leave a Reply ✨
            </h2>
            <ReplyForm
              replyingTo={replyingToSpark.id}
              onAddReply={(reply, sparkId) => handleReplySubmit(reply, sparkId)}
              onClose={() => {
                setActiveReply(null);
                setReplyingToSpark(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MemorySparks;
