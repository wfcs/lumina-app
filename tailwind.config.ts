import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#00D2FF", 600: "#00B8E0", 700: "#0096B8" },
        indigo2: "#1C1747",
        violet2: "#FFD2B3",
        mint: "#4FCE9A",
        peach: "#FFD2B3",
        positive: "#4FCE9A",
        danger: "#F0839F",
        warn: "#FFB37A",
        neutral: "#A9A5CF",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Manrope", "sans-serif"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem" },
      boxShadow: {
        glow: "0 0 0 1px rgba(0,210,255,0.30), 0 8px 40px -8px rgba(0,210,255,0.45)",
        "glow-mint": "0 0 28px -4px rgba(79,206,154,0.5)",
        "glow-violet": "0 0 30px -4px rgba(0,210,255,0.45)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 32px -16px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        float: { "0%,100%": { transform: "translate(0,0)" }, "50%": { transform: "translate(8px,-12px)" } },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        float: "float 9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
