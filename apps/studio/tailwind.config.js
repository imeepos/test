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
        // 统一的深色主题色彩系统
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
        // 重要性等级颜色（统一管理）
        importance: {
          1: '#6b7280',  // 灰色 - 低优先级
          2: '#10b981',  // 绿色 - 较低优先级
          3: '#f59e0b',  // 黄色 - 中等优先级
          4: '#f97316',  // 橙色 - 较高优先级
          5: '#dc2626',  // 红色 - 高优先级
        },
        // 置信度颜色
        confidence: {
          low: '#ef4444',     // 红色 - 低置信度
          medium: '#f59e0b',  // 黄色 - 中等置信度
          high: '#10b981',    // 绿色 - 高置信度
        },
        // 状态颜色
        status: {
          idle: '#6b7280',      // 灰色 - 待处理
          processing: '#3b82f6', // 蓝色 - 处理中
          completed: '#10b981',  // 绿色 - 已完成
          error: '#ef4444',      // 红色 - 错误
        },
        // 语义类型颜色
        semantic: {
          requirement: '#8b5cf6',
          solution: '#10b981',
          plan: '#3b82f6',
          analysis: '#f59e0b',
          idea: '#ec4899',
          question: '#06b6d4',
          answer: '#84cc16',
          decision: '#f97316',
          fusion: '#6366f1',
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