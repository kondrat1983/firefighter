/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Mission control dark theme color palette
        background: {
          DEFAULT: '#0a0b0d',
          secondary: '#0f1419',
          tertiary: '#1a1d23',
        },
        foreground: {
          DEFAULT: '#e2e8f0',
          secondary: '#94a3b8',
          muted: '#64748b',
        },
        border: {
          DEFAULT: '#1e293b',
          secondary: '#334155',
        },
        primary: {
          DEFAULT: '#0ea5e9',
          dark: '#0284c7',
          light: '#38bdf8',
        },
        // Risk level colors
        risk: {
          low: '#10b981',      // Green
          medium: '#f59e0b',   // Amber  
          high: '#ef4444',     // Red
          critical: '#dc2626', // Dark red
        },
        // Status colors
        status: {
          new: '#8b5cf6',      // Purple
          investigating: '#f59e0b', // Amber
          confirmed: '#ef4444',     // Red
          resolved: '#10b981',      // Green
          false_alarm: '#6b7280',   // Gray
        },
        // Source colors
        source: {
          reddit: '#ff4500',
          steam: '#1b2838',
          twitter: '#1da1f2',
          facebook: '#1877f2',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'monospace'],
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'critical-pulse': 'criticalPulse 2s ease-in-out infinite',
        'radar-scan': 'radarScan 3s linear infinite',
        'data-flow': 'dataFlow 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        criticalPulse: {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
            borderColor: 'rgba(239, 68, 68, 0.6)' 
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.4)',
            borderColor: 'rgba(239, 68, 68, 1)' 
          },
        },
        radarScan: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        dataFlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}