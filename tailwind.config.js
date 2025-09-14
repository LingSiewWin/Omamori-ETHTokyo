/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', 'sans-serif'],
        japanese: ['Noto Sans JP', 'serif'],
      },
      colors: {
        omamori: {
          red: '#b71c1c',
          pink: '#d81b60',
          gold: '#f57f17',
          seal: '#8b0000',
        }
      },
      animation: {
        'gentle-pulse': 'gentle-pulse 4s ease-in-out infinite',
        'seal-float': 'seal-float 6s ease-in-out infinite',
        'light-reveal': 'light-reveal 1.2s ease-out forwards',
      },
      keyframes: {
        'gentle-pulse': {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.5' },
        },
        'seal-float': {
          '0%, 100%': { transform: 'translate(-50%, -50%) rotate(-12deg)' },
          '50%': { transform: 'translate(-50%, -50%) rotate(8deg)' },
        },
        'light-reveal': {
          '0%': {
            transform: 'scale(0.8)',
            opacity: '0'
          },
          '50%': {
            transform: 'scale(1.4)',
            opacity: '0.9'
          },
          '100%': {
            transform: 'scale(1.8)',
            opacity: '0'
          },
        }
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
}