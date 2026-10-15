import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        barber: {
          dark: "#0b0f15",
          panel: "#121822",
          card: "#18212e",
          border: "#253346",
          gold: "#c89456",
          goldHover: "#d9a466",
          goldSubtle: "rgba(200, 148, 86, 0.12)",
          textPrimary: "#f3f6fa",
          textSecondary: "#99a7bc",
        },
      },
    },
  },
  plugins: [],
};
export default config;
