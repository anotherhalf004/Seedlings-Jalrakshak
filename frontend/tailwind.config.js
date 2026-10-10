/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        // JalRakshak ocean-deep palette
        navy: {
          950: '#060d1f',
          900: '#0b132b',
          800: '#111d3a',
          700: '#1c2541',
          600: '#253562',
        },
        cyan: {
          glow: '#00f0ff',
          bright: '#22d3ee',
          muted: '#67e8f9',
        },
        water: {
          blue: '#3a86ff',
          teal: '#0ea5e9',
          deep: '#0369a1',
        },
        risk: {
          low: '#22c55e',
          medium: '#f59e0b',
          high: '#f97316',
          critical: '#ef4444',
        },
        glass: 'rgba(255,255,255,0.05)',
      },
      backgroundImage: {
        'ocean-gradient': 'linear-gradient(135deg, #060d1f 0%, #0b132b 40%, #1c2541 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(28,37,65,0.9) 0%, rgba(11,19,43,0.95) 100%)',
        'cyan-glow': 'radial-gradient(ellipse at center, rgba(0,240,255,0.15) 0%, transparent 70%)',
        'hero-radial': 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(58,134,255,0.2) 0%, transparent 60%)',
      },
      boxShadow: {
        'glow-cyan': '0 0 30px rgba(0,240,255,0.25), 0 0 60px rgba(0,240,255,0.1)',
        'glow-blue': '0 0 20px rgba(58,134,255,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,240,255,0.1)',
      },
      borderRadius: {
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'slide-in': 'slideIn 0.4s ease-out forwards',
        'count-up': 'countUp 1s ease-out forwards',
        'ripple': 'ripple 2s ease-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
