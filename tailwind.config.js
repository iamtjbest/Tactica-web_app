/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:    "#0D1317",
        bg2:   "#0A0F13",
        sur:   "#1A242B",
        sur2:  "#223040",
        bd:    "#2A3B47",
        bd2:   "#34495a",
        volt:  "#CCFF00",
        volt2: "#E8FF66",
        cyan:  "#00E5FF",
        cyan2: "#6FF0FF",
        mt:    "#8E9BAE",
        mt2:   "#5C6B7C",
        grn:   "#00E676",
        red:   "#FF4757",
        amber: "#FFB830",
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'Space Mono'", "monospace"],
      },
      boxShadow: {
        volt: "0 8px 32px rgba(204,255,0,0.22)",
        cyan: "0 8px 32px rgba(0,229,255,0.22)",
      },
    },
  },
  plugins: [],
};
