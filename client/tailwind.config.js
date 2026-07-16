/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'ruam-navy': '#0f172a',
        'ruam-slate': '#1e293b',
        'ruam-dark': '#0a0f1e',
        'ruam-gold': '#f59e0b',
        'ruam-emerald': '#10b981',
        'ruam-amber': '#f59e0b',
        'ruam-red': '#ef4444',
        'ruam-blue': '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(245, 158, 11, 0.15)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.15)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.15)',
      }
    },
  },
  plugins: [],
};
