import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../../utils/api";
import GlobalHeader from "../../components/GlobalHeader/GlobalHeader";
import MemoryCard from "../../components/MemoryCard/MemoryCard";
import MemoryPlayback from "../../components/MemoryPlayBack/MemoryPlayBack";

const HomeFeed = () => {
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [memories, setMemories] = useState([]);
  const [activeMemory, setActiveMemory] = useState(null);
  const groupRefs = useRef({});
  const threadRefs = useRef({});

  const mapEmailsToNames = async (emails) => {
    try {
      const res = await API.post("/user/map", { emails });
      return res.data || {};
    } catch (err) {
      console.error("❌ Failed to map emails to names:", err);
      return {};
    }
  };

  useEffect(() => {
    const fetchFeedData = async () => {
      try {
        const userRes = await API.get(`/user/${username}`);
        const partner = userRes.data;
  
        // ✅ Check thread only if not viewing own feed
        if (currentUser?.uid && partner?.uid && currentUser.uid !== partner.uid) {
          const threadRes = await API.post("ai/threads/check", {
            userId: currentUser.uid,
            email: currentUser.email,
            partnerEmail: partner.email,
          });
  
          if (!threadRes.data.hasThread) {
            navigate(`/${currentUser.name}/feed`, { replace: true });
            return;
          }
  
          // ✅ Now fetch partner's memories
          const [createdRes, featuredRes] = await Promise.all([
            API.get(`/memories/public?uid=${partner.uid}`), // new for partner
            API.get("/memories/paired"),
          ]);
  
          const all = [...(createdRes.data || []), ...(featuredRes.data.memories || [])];
          const unique = Array.from(new Map(all.map((m) => [m.id, m])).values());
  
          const emails = Array.from(new Set(unique.map(m => m.email).filter(Boolean)));
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
        } else {
          // ✅ Default: Load current user feed
          const [createdRes, featuredRes] = await Promise.all([
            API.get("/memories"),
            API.get("/memories/paired"),
          ]);
  
          const all = [...(createdRes.data.memories || []), ...(featuredRes.data.memories || [])];
          const unique = Array.from(new Map(all.map((m) => [m.id, m])).values());
  
          const emails = Array.from(new Set(unique.map(m => m.email).filter(Boolean)));
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
        }
      } catch (err) {
        console.error("❌ Failed to fetch feed:", err);
        navigate(`/${currentUser.name}/feed`, { replace: true });
      }
    };
  
    fetchFeedData();
  }, [username]);
  

  const formatAndSetMemories = async (memoryList) => {
    const emails = Array.from(new Set(memoryList.map(m => m.email).filter(Boolean)));
    const emailToName = await mapEmailsToNames(emails);

    const formatted = memoryList.map((m) => {
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
  };

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
              <div
                className="absolute top-1/2 left-[7.5rem] h-[2px] bg-blue-300 opacity-70 z-0 rounded-full"
                ref={(el) => (threadRefs.current[date] = el)}
              />
              <div className="flex items-center relative w-full overflow-x-auto">
                <div className="shrink-0 w-[7.5rem] flex justify-end pr-2 z-10">
                  <div className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full shadow-md">
                    {date}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <div className="flex items-center gap-12 pl-2 z-10 min-w-max timeline-sequence">
                    {sortedGroup.map((memory, j) => (
                      <React.Fragment key={j}>
                        <div className="relative flex flex-col items-center w-fit">
                          <div className="mb-2 text-center">
                            <div className="text-[11px] text-gray-500 font-medium whitespace-nowrap">
                              {memory.timeFormatted}
                            </div>
                          </div>
                        </div>
                        <div onClick={() => setActiveMemory({ ...memory, name: memory.name })} className="cursor-pointer">
                          <MemoryCard memory={memory} currentUser={currentUser} />
                        </div>
                      </React.Fragment>
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
