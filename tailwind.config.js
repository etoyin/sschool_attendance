/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.{html,ejs,pug,hbs}",
    "./public/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#29176e',
          light: '#3a2285',
          dark: '#1e1050',
        },
        secondary: {
          DEFAULT: '#fe0005',
          light: '#ff3338',
          dark: '#d10004',
        },
      },
    },
  },
  plugins: [],
}
