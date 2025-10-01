/**
 * 可访问性 Hook
 * 提供键盘导航、焦点管理、ARIA支持等功能
 */

import { useEffect, useCallback, useRef } from 'react'
import { A11Y } from '@/constants/designTokens'

// ============= 键盘事件 Hook =============

interface UseKeyboardNavigationOptions {
  onEnter?: () => void
  onSpace?: () => void
  onEscape?: () => void
  onTab?: (shiftKey: boolean) => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  disabled?: boolean
}

/**
 * 键盘导航 Hook
 * 处理常见的键盘交互
 */
export function useKeyboardNavigation(options: UseKeyboardNavigationOptions) {
  const {
    onEnter,
    onSpace,
    onEscape,
    onTab,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    disabled = false
  } = options

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (disabled) return

    switch (event.key) {
      case A11Y.KEYS.ENTER:
        onEnter?.()
        break
      case A11Y.KEYS.SPACE:
        event.preventDefault() // 防止页面滚动
        onSpace?.()
        break
      case A11Y.KEYS.ESCAPE:
        onEscape?.()
        break
      case A11Y.KEYS.TAB:
        onTab?.(event.shiftKey)
        break
      case A11Y.KEYS.ARROW_UP:
        event.preventDefault()
        onArrowUp?.()
        break
      case A11Y.KEYS.ARROW_DOWN:
        event.preventDefault()
        onArrowDown?.()
        break
      case A11Y.KEYS.ARROW_LEFT:
        onArrowLeft?.()
        break
      case A11Y.KEYS.ARROW_RIGHT:
        onArrowRight?.()
        break
    }
  }, [disabled, onEnter, onSpace, onEscape, onTab, onArrowUp, onArrowDown, onArrowLeft, onArrowRight])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// ============= 焦点陷阱 Hook =============

interface UseFocusTrapOptions {
  enabled?: boolean
  initialFocus?: HTMLElement | null
  returnFocus?: boolean
}

/**
 * 焦点陷阱 Hook
 * 用于 Modal、Dialog 等组件，限制焦点在容器内循环
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  options: UseFocusTrapOptions = {}
) {
  const { enabled = true, initialFocus, returnFocus = true } = options
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    // 保存当前焦点元素
    previousFocusRef.current = document.activeElement as HTMLElement

    // 获取可聚焦元素
    const getFocusableElements = () => {
      if (!containerRef.current) return []

      const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ].join(',')

      return Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(selector)
      )
    }

    // 设置初始焦点
    const focusableElements = getFocusableElements()
    if (initialFocus) {
      initialFocus.focus()
    } else if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    // Tab键循环焦点
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const elements = getFocusableElements()
      if (elements.length === 0) return

      const firstElement = elements[0]
      const lastElement = elements[elements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey) {
        // Shift + Tab
        if (activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      // 恢复之前的焦点
      if (returnFocus && previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [enabled, containerRef, initialFocus, returnFocus])
}

// ============= 焦点管理 Hook =============

/**
 * 焦点可见性 Hook
 * 只在键盘导航时显示焦点环
 */
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = React.useState(false)
  const isKeyboardUser = useRef(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        isKeyboardUser.current = true
        setIsFocusVisible(true)
      }
    }

    const handleMouseDown = () => {
      isKeyboardUser.current = false
      setIsFocusVisible(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return isFocusVisible
}

// ============= ARIA 实时区域 Hook =============

interface UseAriaLiveOptions {
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
}

/**
 * ARIA 实时区域 Hook
 * 用于屏幕阅读器通知
 */
export function useAriaLive(
  message: string,
  options: UseAriaLiveOptions = {}
) {
  const { politeness = 'polite', atomic = true, relevant = 'all' } = options

  useEffect(() => {
    if (!message) return

    const liveRegion = document.createElement('div')
    liveRegion.setAttribute('role', 'status')
    liveRegion.setAttribute('aria-live', politeness)
    liveRegion.setAttribute('aria-atomic', String(atomic))
    liveRegion.setAttribute('aria-relevant', relevant)
    liveRegion.className = 'sr-only' // 仅屏幕阅读器可见
    liveRegion.textContent = message

    document.body.appendChild(liveRegion)

    return () => {
      document.body.removeChild(liveRegion)
    }
  }, [message, politeness, atomic, relevant])
}

// ============= 辅助函数 =============

/**
 * 生成唯一的 ARIA ID
 */
let idCounter = 0
export function useAriaId(prefix: string = 'aria') {
  const idRef = useRef<string>()

  if (!idRef.current) {
    idRef.current = `${prefix}-${++idCounter}`
  }

  return idRef.current
}

/**
 * 创建 ARIA 属性
 */
export function createAriaProps(config: {
  label?: string
  labelledBy?: string
  describedBy?: string
  role?: string
  expanded?: boolean
  haspopup?: boolean | 'menu' | 'dialog' | 'listbox' | 'tree' | 'grid'
  controls?: string
  live?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
}) {
  const props: Record<string, any> = {}

  if (config.label) props['aria-label'] = config.label
  if (config.labelledBy) props['aria-labelledby'] = config.labelledBy
  if (config.describedBy) props['aria-describedby'] = config.describedBy
  if (config.role) props['role'] = config.role
  if (config.expanded !== undefined) props['aria-expanded'] = config.expanded
  if (config.haspopup !== undefined) props['aria-haspopup'] = config.haspopup
  if (config.controls) props['aria-controls'] = config.controls
  if (config.live) props['aria-live'] = config.live
  if (config.atomic !== undefined) props['aria-atomic'] = config.atomic

  return props
}

/**
 * 检查元素是否可聚焦
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ]

  return focusableSelectors.some(selector =>
    element.matches(selector)
  )
}

/**
 * 获取元素的所有可聚焦子元素
 */
export function getFocusableChildren(element: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',')

  return Array.from(element.querySelectorAll<HTMLElement>(selector))
}

// 添加缺失的 React 导入
import React from 'react'
