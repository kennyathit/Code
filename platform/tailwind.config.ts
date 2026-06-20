import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2F5597",
          dark: "#1f3a66",
        },
      },
    },
  },
  plugins: [],
};

export default config;
