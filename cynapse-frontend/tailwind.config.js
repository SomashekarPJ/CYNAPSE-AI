/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: "#0052FF",
        danger: "#ef4444",
        warning: "#f59e0b",
        safe: "#10b981",
        surface: "#0f172a",
        panel: "#1e293b",
        border: "#334155",
        "text-primary": "#e2e2e8",
        "text-muted": "#bbc9cf",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        sans: ["'Inter'", "sans-serif"],
        display: ["'Space Grotesk'", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        ticker: "ticker 20s linear infinite",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [],
};
