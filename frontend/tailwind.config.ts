import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { primary: 'var(--bg-primary)', secondary: 'var(--bg-secondary)', card: 'var(--bg-card)', hover: 'var(--bg-hover)' },
        border: { DEFAULT: 'var(--border)', subtle: 'var(--border-subtle)' },
        text: { primary: 'var(--text-primary)', secondary: 'var(--text-secondary)', muted: 'var(--text-muted)' },
        accent: { DEFAULT: 'var(--accent)', light: 'var(--accent-light)', dark: 'var(--accent-dark)' },
        income: 'var(--income)',
        expense: 'var(--expense)',
        transfer: 'var(--transfer)',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'], display: ['Space Grotesk', 'sans-serif'] },
      animation: { 'fade-in': 'fadeIn 0.3s ease forwards', 'pulse-glow': 'pulse-glow 2s ease infinite', shimmer: 'shimmer 1.5s infinite' },
    },
  },
  plugins: [],
} satisfies Config;
