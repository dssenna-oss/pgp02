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
        // Azul institucional usado em botões/realces
        brand: {
          50: "#E3F2FD",
          100: "#bbdefb",
          500: "#1565C0",
          600: "#1565C0",
          700: "#0d47a1",
          900: "#0D1B4B",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
