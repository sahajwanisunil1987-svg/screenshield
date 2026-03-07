import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#08111f",
        accent: "#0f766e",
        mist: "#ecfdf5",
        ember: "#f97316",
        slate: "#5b6474"
      },
      fontFamily: {
        sans: ["Manrope", "Avenir Next", "Segoe UI", "sans-serif"],
        display: ["Space Grotesk", "Trebuchet MS", "sans-serif"]
      },
      boxShadow: {
        card: "0 24px 60px rgba(8, 17, 31, 0.08)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top, rgba(15,118,110,0.18), transparent 38%), linear-gradient(135deg, rgba(8,17,31,1), rgba(12,35,64,0.96))"
      }
    }
  },
  plugins: []
};

export default config;
