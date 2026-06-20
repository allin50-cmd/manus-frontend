import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#0B1F3A',
          light: '#152d50',
          dark: '#071528',
        },
        fg: {
          green: '#00A86B',
          'green-hover': '#009960',
          'green-light': '#E6F7F1',
          grey: '#F7F8FA',
        },
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
}

export default config
