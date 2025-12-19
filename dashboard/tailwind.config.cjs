/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: '#0d1117',
          fg: '#e6edf3',
          accent: '#1f6feb'
        }
      }
    },
  },
  plugins: [],
};

