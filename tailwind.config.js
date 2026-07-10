/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101318",
        paper: "#f7f4ef",
        line: "#d8d3ca",
        mint: "#58b894",
        coral: "#e86f5c",
        saffron: "#e4ad42",
        ocean: "#3e78b2",
        plum: "#7b5ea7"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(16, 19, 24, 0.10)"
      }
    },
  },
  plugins: [],
};
