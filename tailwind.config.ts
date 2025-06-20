/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'excel-green': '#1D6F42',
      },
    },
  },
  plugins: [],
} satisfies import('tailwindcss').Config;