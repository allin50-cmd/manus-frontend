/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold:    '#C9A64A',
          'gold-dark': '#B8954A',
          navy:    '#0F1B35',
          'navy-light': '#1A2D52',
          slate:   '#1E2A3A',
          surface: '#F4F6FA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
