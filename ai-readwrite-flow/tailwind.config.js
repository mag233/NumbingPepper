/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          base: 'rgb(var(--surface-base) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
        },
        ink: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
        chrome: {
          border: 'rgb(var(--border) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
        },
        writer: {
          insert: {
            flash: 'rgb(var(--writer-insert-flash) / <alpha-value>)',
          },
        },
      },
      keyframes: {
        'writer-insert-flash': {
          '0%, 100%': { backgroundColor: 'rgb(var(--writer-insert-flash) / 0.12)' },
          '50%': { backgroundColor: 'rgb(var(--writer-insert-flash) / 0.28)' },
        },
      },
      animation: {
        'writer-insert-flash': 'writer-insert-flash 2.6s ease-in-out infinite',
      },
      boxShadow: {
        card: '0 12px 40px -18px rgba(0,0,0,0.55)',
      },
    },
  },
  plugins: [],
}
