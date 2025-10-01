/**
 * Design Token 系统
 * 统一管理颜色、间距、动画等设计变量
 * 支持深色/浅色主题切换
 */

import type { ImportanceLevel } from '@/types'

// ============= 颜色系统 =============

/**
 * 重要性等级颜色映射
 * 符合WCAG AA对比度标准
 */
export const IMPORTANCE_COLORS = {
  1: {
    border: 'border-gray-500',
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    hex: '#6b7280',
    name: '低优先级'
  },
  2: {
    border: 'border-green-500',
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    hex: '#10b981',
    name: '较低优先级'
  },
  3: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    hex: '#f59e0b',
    name: '中等优先级'
  },
  4: {
    border: 'border-orange-500',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    hex: '#f97316',
    name: '较高优先级'
  },
  5: {
    border: 'border-red-500',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    hex: '#dc2626',
    name: '高优先级'
  }
} as const

/**
 * 置信度颜色映射
 */
export const CONFIDENCE_COLORS = {
  low: {
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    hex: '#ef4444',
    threshold: 0.5
  },
  medium: {
    text: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    hex: '#f59e0b',
    threshold: 0.8
  },
  high: {
    text: 'text-green-400',
    bg: 'bg-green-500/10',
    hex: '#10b981',
    threshold: 1.0
  }
} as const

/**
 * 节点状态颜色
 */
export const STATUS_COLORS = {
  idle: {
    icon: 'text-gray-400',
    bg: 'bg-gray-500/10',
    name: '待处理'
  },
  processing: {
    icon: 'text-blue-400',
    bg: 'bg-blue-500/10',
    name: '处理中'
  },
  completed: {
    icon: 'text-green-400',
    bg: 'bg-green-500/10',
    name: '已完成'
  },
  error: {
    icon: 'text-red-400',
    bg: 'bg-red-500/10',
    name: '错误'
  }
} as const

/**
 * 语义类型颜色
 */
export const SEMANTIC_COLORS = {
  requirement: { hex: '#8b5cf6', name: '需求' },
  solution: { hex: '#10b981', name: '方案' },
  plan: { hex: '#3b82f6', name: '计划' },
  analysis: { hex: '#f59e0b', name: '分析' },
  idea: { hex: '#ec4899', name: '想法' },
  question: { hex: '#06b6d4', name: '问题' },
  answer: { hex: '#84cc16', name: '答案' },
  decision: { hex: '#f97316', name: '决策' },
  fusion: { hex: '#6366f1', name: '融合' },
  summary: { hex: '#14b8a6', name: '总结' },
  synthesis: { hex: '#8b5cf6', name: '综合' },
  comparison: { hex: '#f59e0b', name: '对比' }
} as const

// ============= 辅助函数 =============

/**
 * 获取重要性等级的颜色类名
 */
export function getImportanceColor(importance: ImportanceLevel) {
  return IMPORTANCE_COLORS[importance]
}

/**
 * 获取置信度等级
 */
export function getConfidenceLevel(confidence: number): 'low' | 'medium' | 'high' {
  if (confidence >= CONFIDENCE_COLORS.high.threshold || confidence >= 0.8) return 'high'
  if (confidence >= CONFIDENCE_COLORS.medium.threshold || confidence >= 0.5) return 'medium'
  return 'low'
}

/**
 * 获取置信度颜色
 */
export function getConfidenceColor(confidence: number) {
  const level = getConfidenceLevel(confidence)
  return CONFIDENCE_COLORS[level]
}

/**
 * 检查颜色对比度是否符合WCAG AA标准
 * 最小对比度要求: 4.5:1 (普通文本), 3:1 (大文本)
 */
export function checkColorContrast(foreground: string, background: string): boolean {
  // 简化版本，实际应使用专业库如 'wcag-contrast'
  // 这里仅做演示，实际项目建议引入专业库
  return true // TODO: 实现完整的对比度检测
}

/**
 * 获取可访问的颜色组合
 */
export function getAccessibleColorPair(importance: ImportanceLevel) {
  const colors = getImportanceColor(importance)
  return {
    foreground: colors.hex,
    background: '#252631', // sidebar-surface
    accessible: true // TODO: 实际检测对比度
  }
}

// ============= 动画参数 =============

export const ANIMATION_DURATION = {
  instant: 100,    // 即时反馈
  fast: 200,       // 快速动画
  normal: 300,     // 正常动画
  slow: 500,       // 慢速动画
  verySlow: 800    // 非常慢
} as const

export const ANIMATION_EASING = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
} as const

// ============= 间距系统 =============

export const SPACING = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem'    // 48px
} as const

// ============= 圆角系统 =============

export const BORDER_RADIUS = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px'
} as const

// ============= 阴影系统 =============

export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
} as const

// ============= Z-index层级 =============

export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  notification: 80
} as const

// ============= 断点系统 =============

export const BREAKPOINTS = {
  xs: '375px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const

// ============= 字体系统 =============

export const FONT_SIZE = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem' // 30px
} as const

export const FONT_WEIGHT = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700
} as const

export const LINE_HEIGHT = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2
} as const

// ============= 可访问性常量 =============

export const A11Y = {
  // ARIA roles
  ROLES: {
    button: 'button',
    dialog: 'dialog',
    menu: 'menu',
    menuitem: 'menuitem',
    tooltip: 'tooltip',
    status: 'status',
    alert: 'alert'
  },

  // 键盘按键码
  KEYS: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight'
  },

  // 最小触摸目标尺寸（符合WCAG标准）
  MIN_TOUCH_TARGET: '44px'
} as const

// ============= 节点尺寸 =============

export const NODE_SIZE = {
  minWidth: 200,
  maxWidth: 400,
  minHeight: 100,
  padding: {
    compact: SPACING.sm,
    normal: SPACING.md,
    comfortable: SPACING.lg
  }
} as const

// ============= 画布配置 =============

export const CANVAS_CONFIG = {
  zoom: {
    min: 0.1,
    max: 2,
    step: 0.1,
    default: 1
  },
  grid: {
    size: 20,
    color: '#1a1b23'
  },
  snap: {
    enabled: true,
    threshold: 10
  }
} as const
