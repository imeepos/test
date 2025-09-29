import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Clock, Copy, ExternalLink } from 'lucide-react'
import { useUIStore } from '@/stores'

export interface ToastAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  actions?: ToastAction[]
  persistent?: boolean  // 是否持久显示（不自动关闭）
  timestamp?: Date
  copyable?: boolean   // 是否可复制内容
  link?: string        // 外部链接
  onClose?: () => void
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  actions = [],
  persistent = false,
  timestamp,
  copyable = false,
  link,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isHovered, setIsHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const colors = {
    success: {
      bg: 'bg-green-900/20 border-green-500/20',
      icon: 'text-green-400',
      text: 'text-green-100',
    },
    error: {
      bg: 'bg-red-900/20 border-red-500/20',
      icon: 'text-red-400',
      text: 'text-red-100',
    },
    warning: {
      bg: 'bg-yellow-900/20 border-yellow-500/20',
      icon: 'text-yellow-400',
      text: 'text-yellow-100',
    },
    info: {
      bg: 'bg-blue-900/20 border-blue-500/20',
      icon: 'text-blue-400',
      text: 'text-blue-100',
    },
  }

  const Icon = icons[type]
  const colorScheme = colors[type]

  // 倒计时效果
  useEffect(() => {
    if (persistent || !duration || isHovered) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          onClose?.()
          return 0
        }
        return prev - 100
      })
    }, 100)

    return () => clearInterval(interval)
  }, [duration, persistent, isHovered, onClose])

  // 复制功能
  const handleCopy = async () => {
    if (!copyable || !message) return

    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  // 打开链接
  const handleLinkClick = () => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative flex w-full max-w-sm flex-col gap-3 rounded-lg border p-4
        backdrop-blur-sm shadow-lg transition-all duration-200
        ${isHovered ? 'scale-[1.02]' : ''} ${colorScheme.bg}
      `}
    >
      {/* 进度条 */}
      {!persistent && duration > 0 && (
        <div className="absolute top-0 left-0 h-1 bg-white/10 rounded-t-lg overflow-hidden w-full">
          <motion.div
            className="h-full bg-white/30"
            initial={{ width: '100%' }}
            animate={{ width: isHovered ? '100%' : `${(timeLeft / duration) * 100}%` }}
            transition={{ ease: 'linear', duration: isHovered ? 0 : 0.1 }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* 图标 */}
        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${colorScheme.icon}`} />

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h4 className={`text-sm font-medium ${colorScheme.text}`}>
              {title}
            </h4>

            {/* 时间戳 */}
            {timestamp && (
              <span className={`text-xs opacity-60 flex items-center gap-1 ${colorScheme.text}`}>
                <Clock className="h-3 w-3" />
                {new Intl.DateTimeFormat('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(timestamp)}
              </span>
            )}
          </div>

          {message && (
            <p className={`mt-1 text-sm opacity-90 whitespace-pre-wrap ${colorScheme.text}`}>
              {message}
            </p>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center gap-2 mt-3">
            {/* 复制按钮 */}
            {copyable && message && (
              <button
                onClick={handleCopy}
                className={`
                  flex items-center gap-1 px-2 py-1 text-xs rounded
                  hover:bg-white/10 transition-colors
                  ${colorScheme.text}
                `}
                title="复制内容"
              >
                <Copy className="h-3 w-3" />
                {copied ? '已复制' : '复制'}
              </button>
            )}

            {/* 外部链接 */}
            {link && (
              <button
                onClick={handleLinkClick}
                className={`
                  flex items-center gap-1 px-2 py-1 text-xs rounded
                  hover:bg-white/10 transition-colors
                  ${colorScheme.text}
                `}
                title="打开链接"
              >
                <ExternalLink className="h-3 w-3" />
                查看详情
              </button>
            )}

            {/* 自定义操作 */}
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`
                  px-2 py-1 text-xs rounded transition-colors
                  ${action.variant === 'primary'
                    ? 'bg-white/20 hover:bg-white/30'
                    : 'hover:bg-white/10'
                  }
                  ${colorScheme.text}
                `}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className={`
            flex-shrink-0 rounded-md p-1.5
            hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20
            transition-colors
            ${colorScheme.text}
          `}
          title="关闭"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}

// Toast容器组件
const ToastContainer: React.FC = () => {
  const { toasts, removeToast, clearToasts } = useUIStore()
  const [position, setPosition] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('top-right')

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  // 键盘快捷键：清空所有Toast
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'k') {
        event.preventDefault()
        clearToasts()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [clearToasts])

  return (
    <>
      <div className={`fixed ${positionClasses[position]} z-50 flex flex-col gap-2 pointer-events-none max-h-screen overflow-hidden`}>
        {/* 批量操作按钮 */}
        {toasts.length > 2 && (
          <div className="pointer-events-auto flex justify-end mb-2">
            <button
              onClick={clearToasts}
              className="
                px-3 py-1 text-xs bg-gray-900/80 text-white rounded-full
                hover:bg-gray-800/90 transition-colors border border-gray-700
                backdrop-blur-sm shadow-lg
              "
              title="清空所有通知 (Ctrl+K)"
            >
              清空全部 ({toasts.length})
            </button>
          </div>
        )}

        {/* Toast列表 */}
        <AnimatePresence mode="popLayout">
          {toasts.map((toast, index) => (
            <motion.div
              key={toast.id}
              className="pointer-events-auto"
              style={{ zIndex: toasts.length - index }}
              layout
            >
              <Toast
                {...toast}
                onClose={() => removeToast(toast.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 位置切换器 */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <div className="flex gap-1 bg-gray-900/80 rounded-full p-1 backdrop-blur-sm border border-gray-700">
            {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => setPosition(pos)}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-colors
                  ${position === pos
                    ? 'bg-white/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }
                `}
                title={`移动到${pos.replace('-', '')}`}
              >
                <div className={`w-2 h-2 rounded-full bg-current ${
                  pos.includes('top') ? 'mb-1' : 'mt-1'
                } ${
                  pos.includes('right') ? 'ml-1' : 'mr-1'
                }`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// Promise toast helper function
const promiseToast = async <T extends any>(
  promise: Promise<T>,
  messages: {
    loading: string,
    success: string | ((data: T) => string),
    error: string | ((error: Error) => string)
  }
): Promise<T> => {
  const { addToast } = useUIStore.getState()

  const loadingId = addToast({
    type: 'info',
    title: messages.loading,
    persistent: true,
    duration: 0
  })

  try {
    const result = await promise
    const { removeToast } = useUIStore.getState()
    removeToast(loadingId)

    const successMessage = typeof messages.success === 'function'
      ? messages.success(result)
      : messages.success

    addToast({
      type: 'success',
      title: successMessage
    })

    return result
  } catch (error) {
    const { removeToast } = useUIStore.getState()
    removeToast(loadingId)

    const errorMessage = typeof messages.error === 'function'
      ? messages.error(error as Error)
      : messages.error

    addToast({
      type: 'error',
      title: errorMessage,
      persistent: true
    })

    throw error
  }
}

// 便捷的Toast hooks
export const useToast = () => {
  const { addToast } = useUIStore()

  return {
    success: (title: string, message?: string, options?: Partial<ToastProps>) =>
      addToast({ type: 'success', title, message, ...options }),

    error: (title: string, message?: string, options?: Partial<ToastProps>) =>
      addToast({ type: 'error', title, message, persistent: true, ...options }),

    warning: (title: string, message?: string, options?: Partial<ToastProps>) =>
      addToast({ type: 'warning', title, message, ...options }),

    info: (title: string, message?: string, options?: Partial<ToastProps>) =>
      addToast({ type: 'info', title, message, ...options }),

    // 特殊Toast类型
    loading: (title: string, message?: string) =>
      addToast({
        type: 'info',
        title,
        message: message || '处理中...',
        persistent: true,
        duration: 0
      }),

    promise: promiseToast
  }
}

export { Toast, ToastContainer }