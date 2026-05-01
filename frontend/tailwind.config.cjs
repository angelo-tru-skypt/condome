/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      colors: {
        orange: {
          400: "#FF7A30",
          500: "#D94F10",
          600: "#C04010",
        },
        cream: {
          100: "#F7F5F2",
          200: "#EFEDE9",
          300: "#E5E0D8",
        },
        ink: {
          200: "#C8C0B4",
          300: "#A89E94",
          500: "#6B6158",
          800: "#1A1612",
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:   '0 2px 4px rgba(26,22,18,0.04), 0 12px 40px rgba(26,22,18,0.09)',
        btn:    '0 4px 14px rgba(217,79,16,0.35)',
        'btn-lg': '0 8px 20px rgba(217,79,16,0.4)',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.55s cubic-bezier(0.4,0,0.2,1) both',
        'spin-slow': 'spin 0.7s linear infinite',
      },
    },
  },
  plugins: [],
}