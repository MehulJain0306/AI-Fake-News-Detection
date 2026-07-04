/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#06060B",
        surface: "#0D0D16",
        "surface-raised": "#12121D",
        border: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.14)",
        },
        violet: {
          DEFAULT: "#8B5CF6",
          soft: "#A78BFA",
          dim: "#6D28D9",
        },
        azure: {
          DEFAULT: "#4F7CFF",
          soft: "#7B9CFF",
          dim: "#2F52C9",
        },
        ink: {
          DEFAULT: "#EDEDF3",
          muted: "#9A9BB0",
          faint: "#6C6D82",
        },
        verdict: {
          real: "#34D399",
          fake: "#FB7185",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "grad-primary": "linear-gradient(135deg, #8B5CF6 0%, #4F7CFF 100%)",
        "grad-radial-violet":
          "radial-gradient(circle, rgba(139,92,246,0.35) 0%, rgba(139,92,246,0) 70%)",
        "grad-radial-azure":
          "radial-gradient(circle, rgba(79,124,255,0.30) 0%, rgba(79,124,255,0) 70%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(139,92,246,0.25)",
        "glow-sm": "0 0 20px rgba(139,92,246,0.18)",
        card: "0 8px 40px rgba(0,0,0,0.45)",
      },
      animation: {
        "spin-slow": "spin 14s linear infinite",
        "spin-slower": "spin 22s linear infinite reverse",
        float: "float 6s ease-in-out infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
