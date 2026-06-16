import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#9D4EDD", 600: "#9D4EDD", 700: "#8332AC" },
        indigo2: "#8332AC",
        violet2: "#E086D3",
        mint: "#B8EBD0",
        peach: "#F2D1C9",
        positive: "#B8EBD0",
        danger: "#FF6B7A",
        warn: "#F4B860",
        neutral: "#9B94A1",
      },
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
        display: ["'Space Grotesk'", "Manrope", "sans-serif"],
      },
      borderRadius: { xl: "1rem", "2xl": "1.25rem" },
      boxShadow: {
        glow: "0 0 0 1px rgba(157,78,221,0.28), 0 8px 40px -8px rgba(157,78,221,0.5)",
        "glow-mint": "0 0 28px -4px rgba(184,235,208,0.55)",
        "glow-violet": "0 0 30px -4px rgba(224,134,211,0.55)",
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
