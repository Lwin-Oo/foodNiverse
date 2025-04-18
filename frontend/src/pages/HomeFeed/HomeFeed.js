import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import API from "../../utils/api";
import MemoryCard from "../../components/MemoryCard/MemoryCard";
// import MemoryModal from "../../components/MemoryModal/MemoryModal";
import MemoryPlayback from "../../components/MemoryPlayBack/MemoryPlayBack";

const HomeFeed = () => {
  const [memories, setMemories] = useState([]);
  const [activeMemory, setActiveMemory] = useState(null);

  const groupRefs = useRef({});
  const threadRefs = useRef({});

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

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const res = await API.get("/memories");
        const formatted = res.data.memories.map((m) => {
          const createdAt = new Date(m.createdAt._seconds * 1000);
          return {
            ...m,
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
        setMemories(formatted); // chronological
      } catch (err) {
        console.error("❌ Failed to load memories:", err);
      }
    };

    fetchMemories();
  }, []);

  const groupedMemories = memories.reduce((acc, mem) => {
    if (!acc[mem.dateFormatted]) acc[mem.dateFormatted] = [];
    acc[mem.dateFormatted].push(mem);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-24 max-w-7xl mx-auto px-4 pt-10">
      {Object.entries(groupedMemories).map(([date, group], i) => {
        const sortedGroup = [...group].sort((a, b) => a.createdAt - b.createdAt); // oldest to newest

        return (
          <div
            key={i}
            className="relative w-full"
            ref={(el) => (groupRefs.current[date] = el)}
          >
            {/* Single horizontal thread */}
            <div
              className="absolute top-1/2 left-[7.5rem] h-[2px] bg-blue-300 opacity-70 z-0 rounded-full"
              ref={(el) => (threadRefs.current[date] = el)}
            />

            <div className="flex items-center relative w-full overflow-x-auto">
              {/* Date */}
              <div className="shrink-0 w-[7.5rem] flex justify-end pr-2 z-10">
                <div className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full shadow-md">
                  {date}
                </div>
              </div>

              {/* Timeline: time -> card */}
              <div className="overflow-x-auto">
                <div className="flex items-center gap-12 pl-2 z-10 min-w-max timeline-sequence">
                  {sortedGroup.map((memory, j) => (
                    <React.Fragment key={j}>
                      <div className="relative flex flex-col items-center w-fit">
                        <div className="mb-2 text-[11px] text-gray-500 font-medium whitespace-nowrap">
                          {memory.timeFormatted}
                        </div>
                      </div>

                      <div onClick={() => setActiveMemory(memory)} className="cursor-pointer">
                        <MemoryCard memory={memory} />
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
        <MemoryPlayback
          memory={activeMemory}
          onClose={() => setActiveMemory(null)}
        />
      )}
    </div>
  );
};

export default HomeFeed;
