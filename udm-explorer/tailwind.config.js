/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Solarized Dark Color Palette
        solarized: {
          base03:  '#002b36', // darkest background
          base02:  '#073642', // dark background
          base01:  '#586e75', // secondary content
          base00:  '#657b83', // secondary text
          base0:   '#839496', // primary text
          base1:   '#93a1a2', // lighter text
          yellow:  '#b58900',
          orange:  '#cb4b16',
          red:     '#dc322f',
          magenta: '#d33682',
          violet:  '#6c71c4',
          blue:    '#268bd2',
          cyan:    '#2aa198',
          green:   '#859900',
        }
      }
    },
  },
  plugins: [],
}