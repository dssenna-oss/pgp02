import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta do curso — neutra com selo amarelo "TREINAMENTO"
        training: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          900: "#78350F",
        },
        // Cores institucionais (herdadas do app de prod)
        brand: {
          50: "#EFF6FF",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          900: "#1E3A8A",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      keyframes: {
        "pulse-strong": {
          "0%, 100%": { opacity: "1", transform: "scale(1)", boxShadow: "0 0 0 0 rgba(245, 158, 11, 0.7)" },
          "50%": { opacity: "0.85", transform: "scale(1.03)", boxShadow: "0 0 30px 10px rgba(245, 158, 11, 0.4)" },
        },
      },
      animation: {
        "pulse-strong": "pulse-strong 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
