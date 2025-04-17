import React from "react";

const DateStream = ({ memories }) => {
  return (
    <div className="flex flex-col items-end gap-12 pr-6 pt-12 w-32 shrink-0">
      {memories.map((memory, i) => (
        <div key={i} className="text-right text-xs text-blue-700 font-medium whitespace-nowrap opacity-80">
          <div className="bg-blue-100 px-2 py-1 rounded-full shadow-sm">
            {memory.dateFormatted}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DateStream;
