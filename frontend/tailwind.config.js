/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", 
  ],
  theme: {
    extend: {
      animation: {
        pulseSlow: "pulse 4s ease-in-out infinite", 
      },
    },
  },
  plugins: [],
};
