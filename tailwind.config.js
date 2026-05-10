/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Epilogue"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0b0b0f',
          2: '#111118',
          3: '#18181f',
          4: '#1e1e28',
        },
        cream: '#f2ede4',
        muted: 'rgba(242,237,228,0.55)',
        sage: '#6dbf8a',
        clay: '#e0784a',
        dusk: '#9b8fd4',
        sand: '#d4b896',
        teal: '#4ec9b8',
        rose: '#e8607a',
        amber: '#f0a24a',
      },
      backdropBlur: {
        glass: '40px',
      },
    },
  },
  plugins: [],
}
