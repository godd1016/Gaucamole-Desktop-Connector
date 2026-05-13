/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#1a1a1a',
          raised: '#242424',
          overlay: '#2e2e2e',
        },
        border: {
          DEFAULT: '#333333',
          subtle: '#2a2a2a',
        },
        text: {
          primary: '#e8e8e1',
          secondary: '#9b9b9b',
          muted: '#666666',
        },
        accent: {
          DEFAULT: '#3d8ef0',
          hover: '#5a9ff5',
          active: '#2878de',
        },
        success: '#3dba64',
        warning: '#f0a030',
        error: '#e05252',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Cascadia Code"', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
