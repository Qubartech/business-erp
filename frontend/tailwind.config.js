/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff", 100: "#dbe6ff", 200: "#bcd0ff", 300: "#8fb0ff",
          400: "#5d87fb", 500: "#3a64f0", 600: "#2549d8", 700: "#1f3aae",
          800: "#1f348a", 900: "#1f306f",
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
