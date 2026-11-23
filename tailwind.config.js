/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        bgMain: '#0D1117',
        cardMain: '#161B22',
        cardHover: '#1C2128',
        borderMain: '#30363D',
        borderSubtle: '#21262D',
        textPrimary: '#F0F6FC',
        textSecondary: '#8B949E',
        accentBlue: '#2F81F7',
        accentGreen: '#3FB950',
        accentAmber: '#D29922',
        accentRed: '#F85149',
      }
    },
  },
  plugins: [],
}
