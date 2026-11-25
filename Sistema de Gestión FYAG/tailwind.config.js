/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <-- ESTO ES OBLIGATORIO
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}