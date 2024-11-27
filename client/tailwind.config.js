/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js"
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0D1526',
        darkText: '#E0E0E0',
        darkBorder: '#333333',
      }
    },
  },
  variants: {
    extend: {
      backgroundColor: ['dark'],
      textColor: ['dark'],
      borderColor: ['dark'],
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-transparent::-webkit-scrollbar': {
          width: '8px',
        },
        '.scrollbar-transparent::-webkit-scrollbar-thumb': {
          backgroundColor: "#bbc7c9",
        },
        '.scrollbar-transparent::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
      });
    },
  ],
}

