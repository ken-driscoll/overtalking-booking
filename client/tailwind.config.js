/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ot: {
          yellow: '#FDC02F',
          black: 'rgb(26 26 26 / <alpha-value>)',
          onbg: 'rgb(var(--ot-on-bg) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Lilita One"', 'cursive'],
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};
