import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta institucional do Comitê (do mockup comite-plano-trabalho.html)
        navy: {
          DEFAULT: "#0D1B4B",
          800: "#15246b",
        },
        // Azul institucional do TCE-ES (cabeçalho do portal tcees.tc.br) — menu lateral
        tcees: {
          DEFAULT: "#1C5598",
          dark: "#15406f",
          light: "#2E6FB5",
        },
        // Azul institucional usado em botões/realces — alinhado ao azul do TCE-ES
        brand: {
          50: "#eaf2fb",
          100: "#d4e4f4",
          500: "#1C5598",
          600: "#1C5598",
          700: "#15406f",
          900: "#0D1B4B",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
