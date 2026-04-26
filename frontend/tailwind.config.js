/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        crisis: {
          bg: '#0a0e1a',
          surface: '#111827',
          card: '#1a2236',
          border: '#1e2d4a',
          primary: '#f97316',
          'primary-dark': '#ea580c',
          accent: '#ef4444',
          teal: '#14b8a6',
          blue: '#3b82f6',
          gold: '#f59e0b',
          success: '#22c55e',
          muted: '#64748b',
          text: '#e2e8f0',
          'text-dim': '#94a3b8',
        },
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(249, 115, 22, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(249, 115, 22, 0.7)' },
        },
      },
      boxShadow: {
        'crisis': '0 4px 24px rgba(249, 115, 22, 0.15)',
        'crisis-lg': '0 8px 40px rgba(249, 115, 22, 0.25)',
        'card': '0 2px 16px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
