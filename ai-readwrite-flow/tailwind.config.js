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
        status: {
          warning: 'rgb(var(--status-warning) / <alpha-value>)',
          success: 'rgb(var(--status-success) / <alpha-value>)',
          danger: 'rgb(var(--status-danger) / <alpha-value>)',
        },
        action: {
          attention: 'rgb(var(--action-attention) / <alpha-value>)',
          positive: 'rgb(var(--action-positive) / <alpha-value>)',
        },
        highlight: {
          yellow: 'rgb(var(--highlight-yellow) / <alpha-value>)',
          red: 'rgb(var(--highlight-red) / <alpha-value>)',
          blue: 'rgb(var(--highlight-blue) / <alpha-value>)',
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
