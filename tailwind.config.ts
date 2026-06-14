import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#0c2340',
          light: '#112d4e',
          mid: '#1a3a6c',
        },
        uc: {
          bg: '#eff6ff',
          border: '#e2e8f0',
        },
      },
    },
  },
  plugins: [],
}

export default config
