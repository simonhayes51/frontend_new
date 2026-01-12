/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Transfer Traders brand colors (from logo)
        brand: {
          cyan: '#00D4FF',
          blue: '#0099FF',
          purple: '#A855F7',
          pink: '#EC4899',
          magenta: '#FF00FF',
        },
        // Dark theme
        dark: {
          bg: '#0A0E1A',
          card: '#121828',
          elevated: '#1A2036',
          hover: '#1E2843',
        },
        // Tier colors
        tier: {
          free: '#6B7280',
          basic: '#3B82F6',
          premium: '#A855F7',
          elite: '#F59E0B',
        }
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #00D4FF 0%, #0099FF 50%, #A855F7 100%)',
        'gradient-purple': 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #00D4FF 0%, #0099FF 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0A0E1A 0%, #121828 100%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 30px rgba(0, 212, 255, 0.4)',
        'glow-purple': '0 0 30px rgba(168, 85, 247, 0.4)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
    }
  },
  plugins: []
};