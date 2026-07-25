/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D4522A',
          hover: '#B8431F',
          light: '#FCEEE8',
        },
        secondary: {
          DEFAULT: '#1A3C34',
          light: '#E8F0EE',
        },
        accent: {
          DEFAULT: '#E8A838',
          light: '#FFF4D6',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};