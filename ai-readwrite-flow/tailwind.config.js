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
          base: '#0b1221',
          raised: '#11182a',
        },
      },
      boxShadow: {
        card: '0 12px 40px -18px rgba(0,0,0,0.55)',
      },
    },
  },
  plugins: [],
}
