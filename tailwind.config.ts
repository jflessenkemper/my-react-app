/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'excel-green': '#008000',
      },
    },
  },
  plugins: [],
} satisfies import('tailwindcss').Config;