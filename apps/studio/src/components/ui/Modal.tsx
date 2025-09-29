import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/utils'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  keyboard?: boolean
  centered?: boolean
  footer?: React.ReactNode
  className?: string
  overlayClassName?: string
  destroyOnClose?: boolean
  resizable?: boolean
  draggable?: boolean
  children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  keyboard = true,
  centered = true,
  footer,
  className,
  overlayClassName,
  destroyOnClose = false,
  resizable = false,
  draggable = false,
  children,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)
  const [isMaximized, setIsMaximized] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  }

  // 键盘事件处理
  useEffect(() => {
    if (!isOpen || !keyboard) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, keyboard, onClose])

  // 焦点管理
  useEffect(() => {
    if (!isOpen) return

    const previousActiveElement = document.activeElement as HTMLElement
    const modalElement = modalRef.current

    if (modalElement) {
      modalElement.focus()
    }

    return () => {
      if (previousActiveElement && previousActiveElement.focus) {
        previousActiveElement.focus()
      }
    }
  }, [isOpen])

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // 拖拽功能
  const handleMouseDown = (event: React.MouseEvent) => {
    if (!draggable || isMaximized) return

    setIsDragging(true)
    setDragStart({
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    })
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (event: MouseEvent) => {
      setPosition({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y,
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  // 最大化切换
  const handleToggleMaximize = () => {
    setIsMaximized(!isMaximized)
    if (!isMaximized) {
      setPosition({ x: 0, y: 0 })
    }
  }

  if (!isOpen && destroyOnClose) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* 背景遮罩 */}
          <motion.div
            className={cn(
              "fixed inset-0 bg-black/50 backdrop-blur-sm",
              overlayClassName
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOverlayClick}
          />

          {/* 模态框容器 */}
          <div className={cn(
            'fixed inset-0 flex',
            centered ? 'items-center justify-center p-4' : 'p-4'
          )}>
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.15 }}
              style={{
                transform: draggable && !isMaximized ?
                  `translate(${position.x}px, ${position.y}px)` : undefined,
              }}
              className={cn(
                'relative w-full bg-sidebar-surface rounded-lg shadow-2xl',
                'border border-sidebar-border overflow-hidden',
                'focus:outline-none flex flex-col',
                isMaximized ? 'h-full max-w-full max-h-full rounded-none' : `${sizes[size]} max-h-[90vh]`,
                isDragging ? 'cursor-grabbing' : '',
                className
              )}
            >
              {/* 标题栏 */}
              {(title || showCloseButton || resizable) && (
                <div
                  className={cn(
                    'flex items-center justify-between px-6 py-4',
                    'border-b border-sidebar-border bg-sidebar-surface',
                    draggable ? 'cursor-grab' : '',
                    isDragging ? 'cursor-grabbing' : ''
                  )}
                  onMouseDown={handleMouseDown}
                >
                  <div>
                    {title && (
                      <h2 className="text-lg font-semibold text-sidebar-text">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="mt-1 text-sm text-sidebar-text-muted">
                        {description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 最大化按钮 */}
                    {resizable && (
                      <button
                        onClick={handleToggleMaximize}
                        className="p-1 rounded hover:bg-sidebar-hover text-sidebar-text-muted hover:text-sidebar-text transition-colors"
                        aria-label={isMaximized ? '还原' : '最大化'}
                      >
                        {isMaximized ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    {/* 关闭按钮 */}
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-sidebar-hover text-sidebar-text-muted hover:text-sidebar-text transition-colors"
                        aria-label="关闭"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 内容区域 */}
              <div className="flex-1 overflow-auto">
                <div className="px-6 py-4">
                  {children}
                </div>
              </div>

              {/* 底部区域 */}
              {footer && (
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-sidebar-border bg-sidebar-surface">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

// 模态框组件的组合部分
const ModalHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-4">{children}</div>
)

const ModalBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-6">{children}</div>
)

const ModalFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex justify-end gap-3 pt-4 border-t border-sidebar-border">
    {children}
  </div>
)

// 确认对话框
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  content?: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'danger'
  loading?: boolean
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = '确认操作',
  content = '您确定要执行此操作吗？',
  confirmText = '确认',
  cancelText = '取消',
  type = 'info',
  loading = false,
}) => {
  const [isConfirming, setIsConfirming] = React.useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('确认操作失败:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  const typeColors = {
    info: 'text-blue-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
  }

  const confirmButtonColors = {
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      centered
      className="max-w-md"
    >
      <div className="text-center">
        <div className={cn('mb-4 text-6xl', typeColors[type])}>
          {type === 'danger' ? '⚠️' : type === 'warning' ? '⚡' : 'ℹ️'}
        </div>
        <p className="text-sidebar-text mb-6">
          {content}
        </p>
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={isConfirming}
        >
          {cancelText}
        </Button>
        <button
          onClick={handleConfirm}
          disabled={isConfirming}
          className={cn(
            'px-4 py-2 rounded transition-colors disabled:opacity-50',
            'flex items-center gap-2',
            confirmButtonColors[type]
          )}
        >
          {isConfirming && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {confirmText}
        </button>
      </div>
    </Modal>
  )
}

// 便捷的Modal hooks
export const useModal = () => {
  const [modals, setModals] = React.useState<Map<string, any>>(new Map())

  const openModal = (id: string, props: any) => {
    setModals(prev => new Map(prev.set(id, { ...props, isOpen: true })))
  }

  const closeModal = (id: string) => {
    setModals(prev => {
      const newMap = new Map(prev)
      const modal = newMap.get(id)
      if (modal) {
        newMap.set(id, { ...modal, isOpen: false })
      }
      return newMap
    })
  }

  const confirm = (options: Omit<ConfirmModalProps, 'isOpen' | 'onClose'>) => {
    return new Promise<boolean>((resolve) => {
      const id = `confirm-${Date.now()}`
      openModal(id, {
        ...options,
        onConfirm: async () => {
          await options.onConfirm?.()
          resolve(true)
        },
        onClose: () => {
          closeModal(id)
          resolve(false)
        }
      })
    })
  }

  const alert = (message: string, title?: string) => {
    return new Promise<void>((resolve) => {
      const id = `alert-${Date.now()}`
      openModal(id, {
        title: title || '提示',
        content: message,
        confirmText: '知道了',
        type: 'info',
        onConfirm: () => resolve(),
        onClose: () => {
          closeModal(id)
          resolve()
        }
      })
    })
  }

  const ModalRenderer = () => (
    <>
      {Array.from(modals.entries()).map(([id, props]) => (
        <ConfirmModal
          key={id}
          {...props}
          onClose={() => closeModal(id)}
        />
      ))}
    </>
  )

  return {
    openModal,
    closeModal,
    confirm,
    alert,
    ModalRenderer,
  }
}

export { Modal, ModalHeader, ModalBody, ModalFooter }