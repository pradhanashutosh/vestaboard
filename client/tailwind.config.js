/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        board: {
          bg: "#0b0b0d",
          tile: "#151517",
          tileLight: "#1e1e21",
          char: "#f4f2ea",
        },
      },
      fontFamily: {
        board: ["Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
