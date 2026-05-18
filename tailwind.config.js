/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#000000',
        panel: '#0d0d0f',
        panel2: '#18181b',
        line: '#3a3a42',
        ink: '#f4f4f5',
        muted: '#8a8a92',
        brand: '#8b4dff',
        /* Severity ramp — green (flawless) to red (dead). */
        tier: {
          platinum: '#2fe08a',
          gold: '#7fe04a',
          silver: '#c8e03a',
          bronze: '#ffd029',
          middle: '#ffa52e',
          config: '#ff7a2e',
          tweaking: '#ff4d3d',
          borked: '#d11f1f',
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', 'system-ui', 'sans-serif'],
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        hard: '5px 5px 0 0 #2c2c33',
        'hard-sm': '3px 3px 0 0 #2c2c33',
        'hard-lg': '8px 8px 0 0 #2c2c33',
      },
    },
  },
  plugins: [],
}
