/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C1A17',
        surface: '#262320',
        surface2: '#2E2A25',
        parchment: '#F0EBE1',
        walnut: '#8B5A2B',
        walnut2: '#A6673A',
        brass: '#C9A227',
        line: '#4A443C',
        muted: '#9A9186',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Work Sans"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
