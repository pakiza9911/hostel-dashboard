/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dae6ff',
          200: '#bcd1ff',
          300: '#8eb1ff',
          400: '#5a87ff',
          500: '#3563ff',
          600: '#1f43f5',
          700: '#1a33db',
          800: '#1c2db1',
          900: '#1d2d8c',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5d9e2',
          300: '#b1b9c8',
          400: '#8590a6',
          500: '#67738a',
          600: '#525c71',
          700: '#434b5c',
          800: '#3a404e',
          900: '#1f2230',
          950: '#0e1019',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 16px -2px rgba(15,23,42,0.08), 0 2px 6px -1px rgba(15,23,42,0.04)',
        glow: '0 0 0 4px rgba(53,99,255,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
      },
    },
  },
  plugins: [],
}
