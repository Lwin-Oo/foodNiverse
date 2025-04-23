import React, { useEffect, useState, useRef, useLayoutEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../utils/api";
import GlobalHeader from "../../components/GlobalHeader/GlobalHeader";
import MemoryCard from "../../components/MemoryCard/MemoryCard";
import MemoryPlayback from "../../components/MemoryPlayBack/MemoryPlayBack";

const HomeFeed = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [memories, setMemories] = useState([]);
  const [replyCountMap, setReplyCountMap] = useState({});
  const [activeMemory, setActiveMemory] = useState(null);
  const [visibleReplies, setVisibleReplies] = useState({});
  const [replyMap, setReplyMap] = useState({});

  const groupRefs = useRef({});
  const threadRefs = useRef({});

  const mapEmailsToNames = async (emails) => {
    try {
      const res = await API.post("/user/map", { emails });
      return res.data || {};
    } catch {
      return {};
    }
  };

  const handleToggleReplies = async (sparkId) => {
    setVisibleReplies((prev) => ({
      ...prev,
      [sparkId]: !prev[sparkId],
    }));

    if (!replyMap[sparkId]) {
      try {
        const res = await API.get(`/memories/replies/${sparkId}`);
        setReplyMap((prev) => ({
          ...prev,
          [sparkId]: res.data.replies || [],
        }));
      } catch (err) {
        console.error("❌ Failed to fetch replies:", err);
      }
    }
  };

  useEffect(() => {
    const fetchFeedData = async () => {
      try {
        const [createdRes, pairedRes, replyCountRes] = await Promise.all([
          API.get("/memories"),
          API.get("/memories/paired"),
          API.get("/memories/replyCounts"),
        ]);

        const all = [...(createdRes.data.memories || []), ...(pairedRes.data.memories || [])];
        const unique = Array.from(new Map(all.map((m) => [m.id, m])).values());

        const emails = Array.from(new Set(unique.map((m) => m.email).filter(Boolean)));
        const emailToName = await mapEmailsToNames(emails);

        const formatted = unique.map((m) => {
          const createdAt = new Date(m.createdAt._seconds * 1000);
          return {
            ...m,
            name: emailToName[m.email] || m.email?.split("@")[0] || "Someone",
            createdAt,
            dateFormatted: createdAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            timeFormatted: createdAt.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }),
          };
        });

        setMemories(formatted);
        setReplyCountMap(replyCountRes.data.counts || {});
      } catch (err) {
        console.error("❌ Failed to fetch feed:", err);
      }
    };

    fetchFeedData();
  }, [username]);

  useLayoutEffect(() => {
    Object.entries(groupRefs.current).forEach(([date, groupEl]) => {
      const container = groupEl.querySelector(".timeline-sequence");
      const thread = threadRefs.current[date];
      if (container && thread) {
        const dateStart = groupEl.getBoundingClientRect().left + 120;
        const end = container.getBoundingClientRect().right;
        const width = end - dateStart;
        thread.style.width = `${width}px`;
      }
    });
  }, [memories]);

  const sparkOwnerMap = useMemo(() => {
    const map = {};
    memories.forEach((mem) => {
      if (!mem.respondingTo) {
        map[mem.id] = mem.name || mem.email?.split("@")[0] || "someone";
      }
    });
    return map;
  }, [memories]);

  const groupedMemories = memories.reduce((acc, mem) => {
    if (!acc[mem.dateFormatted]) acc[mem.dateFormatted] = [];
    acc[mem.dateFormatted].push(mem);
    return acc;
  }, {});

  return (
    <>
      <GlobalHeader />
      <div className="flex flex-col gap-24 max-w-7xl mx-auto px-4 pt-10">
        {Object.entries(groupedMemories).map(([date, group], i) => {
          const sortedGroup = [...group].sort((a, b) => a.createdAt - b.createdAt);

          return (
            <div key={i} className="relative w-full" ref={(el) => (groupRefs.current[date] = el)}>
              {/* Timeline Line */}
              <div
                className="absolute top-1/2 left-[7.5rem] h-[2px] bg-blue-300 opacity-70 z-0 rounded-full"
                ref={(el) => (threadRefs.current[date] = el)}
              />

              <div className="flex items-center relative w-full overflow-x-auto">
                {/* Date label */}
                <div className="shrink-0 w-[7.5rem] flex justify-end pr-2 z-10">
                  <div className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full shadow-md">
                    {date}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="flex items-start gap-12 pl-2 z-10 min-w-max timeline-sequence">
                    {sortedGroup.map((memory, j) => (
                      <div key={j} className="flex flex-col items-center">
                        {/* ⏰ TimeStamp ABOVE horizontal line */}
                        <div className="mb-2 text-[11px] text-gray-500 font-medium whitespace-nowrap">
                          {memory.timeFormatted}
                        </div>

                        {/* MemoryCard */}
                        <div
                          onClick={() => setActiveMemory({ ...memory, name: memory.name })}
                          className="cursor-pointer"
                        >
                          <MemoryCard
                            memory={memory}
                            currentUser={currentUser}
                            sparkOwnerMap={sparkOwnerMap}
                            replyCountMap={replyCountMap}
                          />
                        </div>

                        {/* 💬 Toggle Replies */}
                        {!memory.respondingTo &&
                          memory.userId === currentUser?.uid &&
                          replyCountMap[memory.id] > 0 && (
                            <button
                              onClick={() => handleToggleReplies(memory.id)}
                              className="mt-2 text-[11px] text-indigo-600 font-semibold hover:underline"
                            >
                              {visibleReplies[memory.id]
                                ? "Hide"
                                : `💬 ${replyCountMap[memory.id]}`}
                            </button>
                          )}

                        {/* 🧵 Replies */}
                        {visibleReplies[memory.id] &&
                          replyMap[memory.id] &&
                          replyMap[memory.id].length > 0 && (
                            <div className="relative mt-20 flex flex-col gap-3 pl-4">
                              <div className="absolute top-6 left-0 h-full border-l-2 border-gray-300" />

                              {replyMap[memory.id].map((reply) => (
                                <div
                                  key={reply.id}
                                  className="bg-white/80 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 italic w-[12rem]"
                                >
                                  {reply.image && (
                                    <img
                                      src={reply.image}
                                      alt="reply"
                                      className="w-full h-28 object-cover rounded-md mb-2"
                                    />
                                  )}
                                  “{reply.journal}”
                                  <p
                                    onClick={() => navigate(`/profile/${reply.name}`)}
                                    className="text-[10px] text-indigo-600 mt-1 font-medium cursor-pointer hover:underline"
                                  >
                                    — @{reply.name}
                                  </p>
                                  {Array.isArray(reply.tags) && reply.tags.length > 0 && (
                                    <div className="mt-1 text-[10px] text-blue-600 font-medium">
                                      with{" "}
                                      <span
                                        onClick={() => navigate(`/profile/${reply.tags[0].name}`)}
                                        className="hover:underline cursor-pointer"
                                      >
                                        {reply.tags[0].name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {activeMemory && (
          <MemoryPlayback memory={activeMemory} onClose={() => setActiveMemory(null)} />
        )}
      </div>
    </>
  );
};

export default HomeFeed;
