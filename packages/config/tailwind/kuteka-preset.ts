import type { Config } from 'tailwindcss';

/**
 * Kuteka Design System Nº 003 — Tailwind preset
 * Primary: Kuteka Orange (#EA580C)
 * Secondary: Slate
 * Spacing scale: 4–96 (Tailwind defaults align)
 */
const kutekaPreset = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#EA580C',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
          DEFAULT: '#EA580C',
        },
        success: {
          DEFAULT: '#16a34a',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#d97706',
          foreground: '#ffffff',
        },
        danger: {
          DEFAULT: '#dc2626',
          foreground: '#ffffff',
        },
        info: {
          DEFAULT: '#2563eb',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      spacing: {
        4.5: '1.125rem',
        18: '4.5rem',
        88: '22rem',
        96: '24rem',
      },
      borderRadius: {
        kuteka: '0.5rem',
      },
    },
  },
} satisfies Partial<Config>;

export default kutekaPreset;
