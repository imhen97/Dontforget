/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff0f5',
          100: '#ffe0ec',
          200: '#ffb3ce',
          300: '#ff80ad',
          400: '#ff4d8d',
          500: '#FF6B9D',
          600: '#e6005c',
          700: '#b30047',
          800: '#800033',
          900: '#4d001f',
        },
        purple: {
          400: '#A78BFA',
          500: '#8B5CF6',
        },
        mint: {
          400: '#34D399',
          500: '#10B981',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
