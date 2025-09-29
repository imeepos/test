import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useUIStore } from '@/stores'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose?: () => void
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  onClose,
}) => {
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`
        relative flex w-full max-w-sm items-start gap-3 rounded-lg border p-4
        backdrop-blur-sm shadow-lg ${colorScheme.bg}
      `}
    >
      {/* 图标 */}
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${colorScheme.icon}`} />

      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-medium ${colorScheme.text}`}>
          {title}
        </h4>
        {message && (
          <p className={`mt-1 text-sm opacity-90 ${colorScheme.text}`}>
            {message}
          </p>
        )}
      </div>

      {/* 关闭按钮 */}
      {onClose && (
        <button
          onClick={onClose}
          className={`
            flex-shrink-0 rounded-md p-1.5 
            hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20
            ${colorScheme.text}
          `}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  )
}

// Toast容器组件
const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              {...toast}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export { Toast, ToastContainer }