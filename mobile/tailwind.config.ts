import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E8883A",
          dark: "#D47828",
          light: "#F09E56",
          50: "rgba(232, 136, 58, 0.08)",
        },
        background: "#0B0B0F",
        foreground: "#EEEAE4",
        muted: "#7A7A8A",
        surface: "#14141B",
        border: "#2A2A38",
        "border-hover": "#3A3A4A",
        accent: {
          DEFAULT: "#FF4757",
          dark: "#E6253A",
        },
        success: "#00D68F",
        error: "#FF4757",
        warning: "#FFB800",
        card: {
          DEFAULT: "#1C1C26",
          hover: "#242430",
        },
      },
      fontFamily: {
        sans: ["Outfit"],
        display: ["PlayfairDisplay"],
      },
    },
  },
  plugins: [],
} satisfies Config;
