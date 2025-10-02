/**
 * 提示词输入对话框组件
 * 用于双击画布时弹出,让用户输入AI生成提示词
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { Button } from './Button'

export interface PromptDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (prompt: string) => void | Promise<void>
  title?: string
  placeholder?: string
  defaultValue?: string
  isLoading?: boolean
}

export const PromptDialog: React.FC<PromptDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = '创建新节点',
  placeholder = '在此输入你的想法...',
  defaultValue = '',
  isLoading = false,
}) => {
  const [prompt, setPrompt] = useState(defaultValue)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 自动聚焦
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isOpen])

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setPrompt(defaultValue)
    }
  }, [isOpen, defaultValue])

  // 处理提交
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!prompt.trim() || isLoading) return

    await onSubmit(prompt.trim())
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose()
    }

    // Ctrl/Cmd + Enter 提交
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* 背景遮罩 */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isLoading ? onClose : undefined}
        />

        {/* 对话框 */}
        <motion.div
          className="relative bg-sidebar-surface border border-sidebar-border rounded-xl shadow-2xl w-full max-w-2xl mx-4"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-sidebar-text">{title}</h2>
            </div>
            {!isLoading && (
              <button
                onClick={onClose}
                className="text-sidebar-text-muted hover:text-sidebar-text transition-colors"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* 内容 */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* 输入框 */}
              <div>
                <textarea
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  disabled={isLoading}
                  rows={6}
                  className={`
                    w-full px-4 py-3
                    bg-canvas-bg border border-sidebar-border
                    text-sidebar-text placeholder-sidebar-text-muted
                    rounded-lg resize-none
                    focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    transition-all
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                />
              </div>

              {/* 提示文本 */}
              <div className="flex items-start gap-2 text-xs text-sidebar-text-muted">
                <div className="flex-1">
                  <p>💡 提示: 输入你的想法,AI将为你生成内容</p>
                  <p className="mt-1">例如: "分析电商平台的技术架构"</p>
                </div>
                <div className="text-right">
                  <p>快捷键: Ctrl+Enter 提交</p>
                  <p className="mt-1">Esc 取消</p>
                </div>
              </div>

              {/* 按钮组 */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  variant="secondary"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={!prompt.trim() || isLoading}
                  variant="primary"
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      AI生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      生成节点
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default PromptDialog
