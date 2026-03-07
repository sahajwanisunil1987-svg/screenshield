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
        accentSoft: "#d7f4ee",
        mist: "#ecfdf5",
        sand: "#f7f4ec",
        ember: "#f97316",
        slate: "#5b6474",
        panel: "#fffdf8"
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
          "radial-gradient(circle at top, rgba(15,118,110,0.18), transparent 38%), linear-gradient(135deg, rgba(8,17,31,1), rgba(12,35,64,0.96))",
        "page-wash":
          "radial-gradient(circle at top left, rgba(15,118,110,0.08), transparent 22%), radial-gradient(circle at right top, rgba(249,115,22,0.08), transparent 24%), linear-gradient(180deg, #fbfcfd, #f3f7fb)"
      }
    }
  },
  plugins: []
};

export default config;
