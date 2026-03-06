/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        fineguard: {
          navy: '#1e3a5f',
          blue: '#2563eb',
          'blue-light': '#3b82f6',
          'blue-pale': '#eff6ff',
          teal: '#0891b2',
          green: '#16a34a',
          'green-light': '#dcfce7',
          amber: '#d97706',
          'amber-light': '#fef3c7',
          red: '#dc2626',
          'red-light': '#fee2e2',
          gray: '#6b7280',
          'gray-light': '#f3f4f6',
          dark: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
