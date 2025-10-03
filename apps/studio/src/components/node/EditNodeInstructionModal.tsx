import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'
import { MarkdownContent } from '@/components/common/MarkdownContent'
import { Sparkles, FileText, X, Pencil, Check, Loader2 } from 'lucide-react'

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
  onUpdateTitle?: (title: string) => Promise<void>
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
  onUpdateTitle,
}) => {
  const [instruction, setInstruction] = useState(defaultValue)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setInstruction(defaultValue)
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
  }, [isOpen, defaultValue])

  const normalizedTitle = nodeTitle?.trim() ?? ''
  const displayTitle = normalizedTitle || '未命名节点'
  const displayContent = nodeContent?.trim() || '当前节点暂无内容'
  const isBusy = isLoading || isSavingTitle

  useEffect(() => {
    if (isOpen) {
      setIsEditingTitle(false)
      setIsSavingTitle(false)
      setTitleDraft(normalizedTitle)
      setTitleError(null)
    }
  }, [isOpen, normalizedTitle])

  useEffect(() => {
    if (isEditingTitle) {
      requestAnimationFrame(() => titleInputRef.current?.focus())
    }
  }, [isEditingTitle])

  const handleClose = useCallback(() => {
    if (!isBusy) {
      onClose()
    }
  }, [isBusy, onClose])

  const handleSubmit = useCallback(async () => {
    const trimmed = instruction.trim()
    if (!trimmed || isBusy) return
    await onSubmit(trimmed)
  }, [instruction, isBusy, onSubmit])

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

  const handleStartEditTitle = useCallback(() => {
    if (isBusy) return
    setTitleDraft(normalizedTitle)
    setTitleError(null)
    setIsEditingTitle(true)
  }, [isBusy, normalizedTitle])

  const handleCancelEditTitle = useCallback(() => {
    if (isBusy) return
    setIsEditingTitle(false)
    setTitleDraft(normalizedTitle)
    setTitleError(null)
  }, [isBusy, normalizedTitle])

  const handleSaveTitle = useCallback(async () => {
    if (isBusy) return
    const trimmed = titleDraft.trim()

    if (!trimmed) {
      setTitleError('标题不能为空')
      return
    }

    if (trimmed === normalizedTitle) {
      setIsEditingTitle(false)
      setTitleError(null)
      return
    }

    if (!onUpdateTitle) {
      setIsEditingTitle(false)
      setTitleError(null)
      return
    }

    setIsSavingTitle(true)
    setTitleError(null)

    try {
      await onUpdateTitle(trimmed)
      setIsEditingTitle(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : '标题更新失败，请稍后重试'
      setTitleError(message)
    } finally {
      setIsSavingTitle(false)
    }
  }, [isBusy, normalizedTitle, onUpdateTitle, titleDraft])

  const handleTitleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        handleSaveTitle()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        handleCancelEditTitle()
      }
    },
    [handleCancelEditTitle, handleSaveTitle]
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isBusy ? handleClose : undefined}
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
                  disabled={isBusy}
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              <form onSubmit={handleFormSubmit} className="flex flex-1 flex-col overflow-hidden">
                <div className="flex flex-1 min-h-0 flex-col gap-6 px-6 py-6 lg:flex-row">
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
                        disabled={isBusy}
                      />
                    </div>
                    <p className="mt-3 text-xs text-sidebar-text-muted">提示：使用 Ctrl / Cmd + Enter 快速提交，Esc 关闭弹窗</p>
                  </div>

                  <aside className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-sidebar-border bg-sidebar-surface/60">
                    <div className="flex items-center justify-between gap-4 border-b border-sidebar-border px-5 py-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-sidebar-text">
                        <FileText className="h-4 w-4" />
                        当前节点内容
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        {isEditingTitle ? (
                          <>
                            <input
                              ref={titleInputRef}
                              value={titleDraft}
                              onChange={(event) => setTitleDraft(event.target.value)}
                              onKeyDown={handleTitleKeyDown}
                              disabled={isBusy}
                              className="h-8 w-48 max-w-[240px] rounded-md border border-sidebar-border bg-sidebar-bg px-2 text-sm text-sidebar-text placeholder:text-sidebar-text-muted focus:outline-none focus:ring-2 focus:ring-sidebar-accent"
                              placeholder="请输入节点标题"
                              aria-label="节点标题编辑"
                            />
                            <button
                              type="button"
                              onClick={handleSaveTitle}
                              className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-500/10 text-primary-500 transition-colors hover:bg-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isBusy}
                              aria-label="保存节点标题"
                            >
                              {isSavingTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEditTitle}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-text-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isBusy}
                              aria-label="取消编辑节点标题"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span
                              className="block max-w-[240px] truncate text-sm text-sidebar-text"
                              title={displayTitle}
                            >
                              {displayTitle}
                            </span>
                            <button
                              type="button"
                              onClick={handleStartEditTitle}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-text-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isBusy}
                              aria-label="编辑节点标题"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {titleError && (
                      <div className="px-5 text-xs text-red-400">{titleError}</div>
                    )}
                    <div className="flex-1 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-sidebar-text">
                      <MarkdownContent
                        content={displayContent}
                        className="text-sm leading-relaxed text-sidebar-text"
                      />
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
                      disabled={isBusy}
                    >
                      取消
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      icon={Sparkles}
                      disabled={!instruction.trim() || isBusy}
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
