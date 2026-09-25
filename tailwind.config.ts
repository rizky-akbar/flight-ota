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
        background: "var(--background)",
        foreground: "var(--foreground)",
        ota: {
          primary: "#0284c7", // Sky 600
          dark: "#0369a1", // Sky 700
          light: "#e0f2fe", // Sky 100
          accent: "#f59e0b", // Amber 500 (Egypt desert gold / sunset)
          emerald: "#10b981",
        },
      },
    },
  },
  plugins: [],
};
export default config;
