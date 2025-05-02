import React from "react";
import clsx from "clsx";

const LunrAvatar = ({ emotion = "NEUTRAL", size = 6 }) => {
  const baseSize = `${size * 8}px`; // Tailwind size (6 → 96px)

  const emotionStyles = {
    NEUTRAL: "animate-floatSlow",
    HAPPY: "animate-floatSlow",
    FRIENDLY: "animate-floatSlow",
    EXCITED: "animate-floatSlow",
    SAD: "animate-sadFloat",
    MAD: "animate-none",
    LOVING: "animate-floatSlow",
  };

  const faceExpressions = {
    NEUTRAL: "M20,25 q10,-10 20,0",
    HAPPY: "M20,28 q10,10 20,0",
    SAD: "M20,35 q10,-10 20,0",
    MAD: "M20,28 q10,0 20,0",
    LOVING: "M20,26 q10,8 20,0",
    EXCITED: "M20,30 q10,10 20,0",
    FRIENDLY: "M20,27 q10,7 20,0",
  };

  return (
    <div
      className={clsx(
        "relative rounded-full bg-yellow-50 flex items-center justify-center shadow-md transition-all duration-500",
        emotionStyles[emotion]
      )}
      style={{ width: baseSize, height: baseSize, padding: 0 }}
    >
      <svg viewBox="0 0 60 60" className="w-full h-full">
        {/* Face */}
        <circle cx="30" cy="30" r="28" fill="#fffdf0" stroke="#e2e8f0" strokeWidth="2" />

        {/* Eyes */}
        <circle cx="20" cy="22" r="3" fill="#111">
          <animate attributeName="r" values="3;3;3;1;3" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="40" cy="22" r="3" fill="#111">
          <animate attributeName="r" values="3;3;3;1;3" dur="3s" repeatCount="indefinite" begin="0.2s" />
        </circle>

        {/* Mouth */}
        <path
          d={faceExpressions[emotion]}
          stroke="#333"
          strokeWidth="2"
          fill="transparent"
        />
      </svg>
    </div>
  );
};

export default LunrAvatar;
