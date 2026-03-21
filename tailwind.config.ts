import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // FineGuard brand palette
        fg: {
          // Neutrals
          bg: '#0D0F14',
          surface: '#13161E',
          border: '#1E2230',
          muted: '#8B92A5',
          // Accent
          gold: '#C9A64A',
          'gold-hover': '#B8954A',
          // Status
          safe: '#22C55E',
          'safe-bg': '#052E16',
          warning: '#F59E0B',
          'warning-bg': '#1C1400',
          urgent: '#EF4444',
          'urgent-bg': '#1F0707',
          overdue: '#DC2626',
          'overdue-bg': '#1F0707',
          handled: '#6B7280',
          'handled-bg': '#111827',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};

export default config;
