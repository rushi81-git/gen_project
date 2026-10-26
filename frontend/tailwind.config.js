/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lumen: {
          bg: '#060606',
          charcoal: '#111111',
          panel: '#171717',
          panelHover: '#1f1f1f',
          border: '#303030',
          borderLight: '#444444',
          ivory: '#F1D7AE',
          ivoryDim: '#dfc69e',
          grey: '#A5A19C',
          greyDark: '#6b6762',
          bronze: '#C6915A',
          bronzeHover: '#B4804B',
          bronzeLight: '#E8B987',
          bronzeDark: '#281c12',
          bronzeMuted: '#3d2b1d',
          emeraldMuted: '#1b3323',
          emeraldText: '#78c291',
          roseMuted: '#381c1c',
          roseText: '#e07d7d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Cinzel', 'Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      },
      boxShadow: {
        'lumen': '0 4px 20px -2px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
        'lumen-glow': '0 0 25px -5px rgba(198, 145, 90, 0.15)',
        'lumen-card': '0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px -1px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
