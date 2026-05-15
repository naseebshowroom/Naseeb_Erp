/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
    './src/components/ui/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        /* ── ERP Brand Colors ── */
        primary: {
          DEFAULT: '#2563EB',
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          foreground: '#ffffff',
        },

        /* ── Sidebar ── */
        sidebar: {
          DEFAULT:  '#0f172a',
          hover:    '#1e293b',
          active:   '#2563eb',
          border:   '#1e293b',
          muted:    '#334155',
          text:     '#94a3b8',
          'text-active': '#ffffff',
        },

        /* ── Semantic / Status ── */
        success: { DEFAULT: '#22c55e', light: '#dcfce7', dark: '#15803d' },
        warning: { DEFAULT: '#f59e0b', light: '#fef3c7', dark: '#b45309' },
        danger:  { DEFAULT: '#ef4444', light: '#fee2e2', dark: '#b91c1c' },
        info:    { DEFAULT: '#3b82f6', light: '#dbeafe', dark: '#1d4ed8' },

        /* ── ShadCN design tokens (required) ── */
        border:     'hsl(214.3 31.8% 91.4%)',
        input:      'hsl(214.3 31.8% 91.4%)',
        ring:       'hsl(221.2 83.2% 53.3%)',
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(222.2 84% 4.9%)',
        muted: {
          DEFAULT:    'hsl(210 40% 96.1%)',
          foreground: 'hsl(215.4 16.3% 46.9%)',
        },
        accent: {
          DEFAULT:    'hsl(210 40% 96.1%)',
          foreground: 'hsl(222.2 47.4% 11.2%)',
        },
        popover: {
          DEFAULT:    'hsl(0 0% 100%)',
          foreground: 'hsl(222.2 84% 4.9%)',
        },
        card: {
          DEFAULT:    'hsl(0 0% 100%)',
          foreground: 'hsl(222.2 84% 4.9%)',
        },
        secondary: {
          DEFAULT:    'hsl(210 40% 96.1%)',
          foreground: 'hsl(222.2 47.4% 11.2%)',
        },
        destructive: {
          DEFAULT:    'hsl(0 84.2% 60.2%)',
          foreground: 'hsl(210 40% 98%)',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },

      borderRadius: {
        lg: '0.625rem',
        md: '0.5rem',
        sm: '0.375rem',
      },

      boxShadow: {
        card:       '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md':  '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
        'card-lg':  '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)',
        sidebar:    '4px 0 24px 0 rgb(0 0 0 / 0.12)',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'slide-in-from-left': {
          from: { transform: 'translateX(-100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down':       'accordion-down 0.2s ease-out',
        'accordion-up':         'accordion-up 0.2s ease-out',
        'slide-in-from-left':   'slide-in-from-left 0.25s ease-out',
        'fade-in':              'fade-in 0.15s ease-out',
        'slide-up':             'slide-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
