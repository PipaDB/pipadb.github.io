/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        panel: 'rgb(var(--color-panel) / <alpha-value>)',
        panel2: 'rgb(var(--color-panel2) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        brand: 'rgb(var(--color-brand) / <alpha-value>)',
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
        hard: '5px 5px 0 0 rgb(var(--shadow-hard) / 1)',
        'hard-sm': '3px 3px 0 0 rgb(var(--shadow-hard) / 1)',
        'hard-lg': '8px 8px 0 0 rgb(var(--shadow-hard) / 1)',
      },
    },
  },
  plugins: [],
}
