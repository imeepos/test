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
        // MVP深色主题色彩系统
        sidebar: {
          bg: '#1a1b23',
          surface: '#252631',
          border: '#343640',
          text: '#e2e4e9',
          'text-muted': '#9ca3af',
          accent: '#6366f1',
          hover: '#2d2e3a',
        },
        canvas: {
          bg: '#0f1015',
          grid: '#1a1b23',
          node: '#252631',
          'node-border': '#343640',
          connection: '#6366f1',
        },
        component: {
          // 重要性等级颜色
          importance: {
            1: '#6b7280', // 灰色 - 低重要性
            2: '#84cc16', // 绿色 - 较低重要性
            3: '#f59e0b', // 黄色 - 中等重要性
            4: '#f97316', // 橙色 - 较高重要性
            5: '#dc2626', // 红色 - 高重要性
          },
          confidence: {
            low: '#ef4444',    // 红色 - 低置信度
            medium: '#f59e0b', // 黄色 - 中等置信度
            high: '#10b981',   // 绿色 - 高置信度
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}