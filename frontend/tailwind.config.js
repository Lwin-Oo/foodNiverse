module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        pulseSlow: "pulse 4s ease-in-out infinite",
        floatSlow: "floatSlow 6s ease-in-out infinite",
        fadeInSlow: "fadeInSlow 1.5s ease-out forwards",
        twinkle: "twinkle 2s ease-in-out infinite",
      },
      keyframes: {
        floatSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeInSlow: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "1" },
        },
      },
    },
    
    
  },
  plugins: [],
};
