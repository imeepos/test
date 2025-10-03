import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'
import { Sparkles, FileText, X } from 'lucide-react'

interface EditNodeInstructionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (instruction: string) => void | Promise<void>
  title?: string
  placeholder?: string
  defaultValue?: string
  nodeTitle?: string
  nodeContent?: string
  isLoading?: boolean
}

const defaultPlaceholder = '请输入修改意见...\n例如: 添加更多技术细节\n例如: 简化表述\n例如: 补充安全性考虑'

export const EditNodeInstructionModal: React.FC<EditNodeInstructionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'AI修改节点',
  placeholder = defaultPlaceholder,
  defaultValue = '',
  nodeTitle,
  nodeContent,
  isLoading = false,
}) => {
  const [instruction, setInstruction] = useState(defaultValue)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      setInstruction(defaultValue)
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
  }, [isOpen, defaultValue])

  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose()
    }
  }, [isLoading, onClose])

  const handleSubmit = useCallback(async () => {
    const trimmed = instruction.trim()
    if (!trimmed || isLoading) return
    await onSubmit(trimmed)
  }, [instruction, isLoading, onSubmit])

  const handleFormSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      handleSubmit()
    },
    [handleSubmit]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        handleSubmit()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      }
    },
    [handleClose, handleSubmit]
  )

  const displayTitle = nodeTitle?.trim() || '未命名节点'
  const displayContent = nodeContent?.trim() || '当前节点暂无内容'

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isLoading ? handleClose : undefined}
          />

          <motion.div
            className="absolute inset-0 z-10 flex flex-col"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-surface shadow-2xl">
              <header className="flex items-center justify-between border-b border-sidebar-border px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary-500/10 p-2">
                    <Sparkles className="h-6 w-6 text-primary-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-sidebar-text">{title}</h2>
                    <p className="text-sm text-sidebar-text-muted">为节点提供修改指令，AI 将基于当前内容进行调整</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg p-2 text-sidebar-text-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text"
                  aria-label="关闭弹窗"
                  disabled={isLoading}
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              <form onSubmit={handleFormSubmit} className="flex flex-1 flex-col overflow-hidden">
                <div className="flex flex-1 flex-col gap-6 px-6 py-6 lg:flex-row">
                  <div className="flex flex-1 flex-col">
                    <label className="mb-3 text-sm font-medium text-sidebar-text">修改指令</label>
                    <div className="flex-1 overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-bg">
                      <textarea
                        ref={textareaRef}
                        value={instruction}
                        onChange={(event) => setInstruction(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="h-full min-h-[240px] w-full resize-none bg-transparent px-5 py-4 text-sm leading-relaxed text-sidebar-text placeholder:text-sidebar-text-muted focus:outline-none"
                        disabled={isLoading}
                      />
                    </div>
                    <p className="mt-3 text-xs text-sidebar-text-muted">提示：使用 Ctrl / Cmd + Enter 快速提交，Esc 关闭弹窗</p>
                  </div>

                  <aside className="flex flex-1 flex-col rounded-xl border border-sidebar-border bg-sidebar-surface/60">
                    <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-sidebar-text">
                        <FileText className="h-4 w-4" />
                        当前节点内容
                      </div>
                      <span className="truncate text-xs text-sidebar-text-muted" title={displayTitle}>
                        {displayTitle}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-sidebar-text">
                      <pre className="whitespace-pre-wrap break-words text-sm text-sidebar-text">
                        {displayContent}
                      </pre>
                    </div>
                  </aside>
                </div>

                <footer className="flex flex-col gap-4 border-t border-sidebar-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-sidebar-text-muted">
                    AI 会基于当前节点内容进行改写，请在保存前确认生成结果
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleClose}
                      disabled={isLoading}
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Sparkles}
                      disabled={!instruction.trim() || isLoading}
                      loading={isLoading}
                    >
                      开始修改
                    </Button>
                  </div>
                </footer>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default EditNodeInstructionModal
