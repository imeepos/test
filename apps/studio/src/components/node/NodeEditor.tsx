import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save,
  X,
  Zap,
  Star,
  Tag,
  Loader2,
  AlertCircle,
  CheckCircle,
  Edit3,
  Eye,
  Split
} from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useNodeStore, useUIStore } from '@/stores'
import { nodeService } from '@/services'
import type { AINode, ImportanceLevel } from '@/types'

interface NodeEditorProps {
  nodeId: string
  isOpen: boolean
  onClose: () => void
  onSave: (updates: Partial<AINode>) => void
}

export const NodeEditor: React.FC<NodeEditorProps> = ({
  nodeId,
  isOpen,
  onClose,
  onSave,
}) => {
  const { getNode } = useNodeStore()
  const { addToast } = useUIStore()
  
  const node = getNode(nodeId)
  
  // 编辑状态
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [importance, setImportance] = useState<ImportanceLevel>(3)
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  // 编辑器模式
  const [editorMode, setEditorMode] = useState<'edit' | 'preview' | 'split'>('edit')

  // 操作状态
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // 初始化编辑器
  useEffect(() => {
    if (node && isOpen) {
      setContent(node.content)
      setTitle(node.title || '')
      setImportance(node.importance)
      setTags([...node.tags])
      setHasChanges(false)
    }
  }, [node, isOpen])

  // 检测变更
  useEffect(() => {
    if (!node) return

    const hasContentChanged = content !== node.content
    const hasTitleChanged = title !== (node.title || '')
    const hasImportanceChanged = importance !== node.importance
    const hasTagsChanged = JSON.stringify(tags.sort()) !== JSON.stringify([...node.tags].sort())

    setHasChanges(hasContentChanged || hasTitleChanged || hasImportanceChanged || hasTagsChanged)
  }, [content, title, importance, tags, node])

  // 自动保存
  const handleAutoSave = useCallback(async () => {
    if (!node || !hasChanges || !content.trim()) return

    try {
      const updates: Partial<AINode> = {
        content: content.trim(),
        title: title.trim() || undefined,
        importance,
        tags,
        metadata: {
          ...node.metadata,
          lastModified: new Date(),
          autoSaved: true
        }
      }

      onSave(updates)
      setHasChanges(false)
      setLastSaved(new Date())

      addToast({
        type: 'info',
        title: '自动保存',
        message: '内容已自动保存',
        duration: 2000
      })
    } catch (error) {
      console.error('自动保存失败:', error)
    }
  }, [node, hasChanges, content, title, importance, tags, onSave, addToast])

  // 自动保存功能
  useEffect(() => {
    if (!autoSaveEnabled || !hasChanges || isSaving || isOptimizing) return

    const autoSaveTimer = setTimeout(() => {
      if (content.trim() && hasChanges) {
        handleAutoSave()
      }
    }, 5000) // 5秒后自动保存

    return () => clearTimeout(autoSaveTimer)
  }, [hasChanges, content, autoSaveEnabled, isSaving, isOptimizing, handleAutoSave])

  // 保存更改
  const handleSave = async () => {
    if (!node || !hasChanges) return

    // 验证内容
    if (!content.trim()) {
      addToast({
        type: 'warning',
        title: '内容不能为空',
        message: '请输入节点内容后再保存',
      })
      return
    }

    setIsSaving(true)
    try {
      // 创建版本记录
      // const versionRecord = {
      //   id: Date.now().toString(),
      //   content: content.trim(),
      //   title: title.trim() || undefined,
      //   timestamp: new Date().toISOString(),
      //   type: 'user_edit' as const,
      //   reason: '手动编辑保存',
      //   importance,
      //   tags: [...tags]
      // }

      const updates: Partial<AINode> = {
        content: content.trim(),
        title: title.trim() || undefined,
        importance,
        tags,
        // 更新最后修改时间
        metadata: {
          ...node.metadata,
          lastModified: new Date(),
          editCount: (node.metadata?.editCount || 0) + 1
        }
      }

      onSave(updates)
      setHasChanges(false)

      // 如果内容很长，提供简短预览
      const contentPreview = content.length > 50
        ? content.substring(0, 50) + '...'
        : content

      addToast({
        type: 'success',
        title: '保存成功',
        message: `节点内容已更新: "${contentPreview}"`,
        duration: 3000
      })

      onClose()
    } catch (error) {
      console.error('保存失败:', error)
      addToast({
        type: 'error',
        title: '保存失败',
        message: error instanceof Error ? error.message : '请稍后重试',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // AI优化
  const handleOptimize = async () => {
    if (!node || !content.trim()) return

    setIsOptimizing(true)
    try {
      // 保存当前内容到版本历史
      // const currentVersion = {
      //   id: Date.now().toString(),
      //   content: content,
      //   title: title,
      //   timestamp: new Date().toISOString(),
      //   type: 'user_edit' as const,
      //   reason: 'AI优化前备份'
      // }

      const updates = await nodeService.updateNode(nodeId, node, {
        content: content.trim(),
        title: title.trim() || undefined,
        useAI: true,
      })

      if (updates.content) {
        setContent(updates.content)
        // 自动生成标题如果为空
        if (!title.trim() && updates.title) {
          setTitle(updates.title)
        }
      }
      if (updates.title && !title.trim()) setTitle(updates.title)
      if (updates.tags) setTags(updates.tags)

      // 添加优化后的版本记录
      // const optimizedVersion = {
      //   id: (Date.now() + 1).toString(),
      //   content: updates.content || content,
      //   title: updates.title || title,
      //   timestamp: new Date().toISOString(),
      //   type: 'ai_optimize' as const,
      //   reason: 'AI内容优化',
      //   confidence: updates.confidence || 0.8
      // }

      addToast({
        type: 'success',
        title: 'AI优化完成',
        message: `内容已优化（置信度: ${Math.round((updates.confidence || 0.8) * 100)}%），请检查并保存`,
        duration: 4000
      })

    } catch (error) {
      console.error('AI优化失败:', error)
      addToast({
        type: 'error',
        title: 'AI优化失败',
        message: error instanceof Error ? error.message : '请检查网络连接后重试',
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  // 添加标签
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  // 移除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  // 简单的Markdown渲染器
  const renderMarkdown = (text: string): string => {
    return text
      // 标题
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-sidebar-text mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-sidebar-text mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-sidebar-text mb-4">$1</h1>')
      // 粗体和斜体
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // 代码块
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-sidebar-bg border border-sidebar-border rounded p-3 my-2 overflow-x-auto"><code class="text-sm">$1</code></pre>')
      .replace(/`(.*?)`/g, '<code class="bg-sidebar-bg px-1 py-0.5 rounded text-sm">$1</code>')
      // 列表
      .replace(/^\* (.+)$/gim, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\d+\. (.+)$/gim, '<li class="ml-4 list-decimal">$1</li>')
      // 链接
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-sidebar-accent underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // 换行
      .replace(/\n/g, '<br>')
  }

  // 键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Tab' && e.ctrlKey) {
      e.preventDefault()
      setEditorMode(current => {
        switch (current) {
          case 'edit': return 'preview'
          case 'preview': return 'split'
          case 'split': return 'edit'
          default: return 'edit'
        }
      })
    } else if (e.key === 's' && e.ctrlKey && e.shiftKey) {
      e.preventDefault()
      setAutoSaveEnabled(!autoSaveEnabled)
      addToast({
        type: 'info',
        title: autoSaveEnabled ? '自动保存已关闭' : '自动保存已开启',
        message: autoSaveEnabled ? '将不再自动保存更改' : '5秒后自动保存更改',
        duration: 2000
      })
    } else if (e.key === 'o' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      if (!isOptimizing && content.trim()) {
        handleOptimize()
      }
    }
  }

  if (!node) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-2xl mx-4 bg-sidebar-surface rounded-lg shadow-2xl border border-sidebar-border"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* 编辑器头部 */}
            <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-sidebar-text">编辑节点</h3>
                {hasChanges && (
                  <div className="flex items-center text-sm text-yellow-400">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    有未保存的更改
                  </div>
                )}
                {lastSaved && (
                  <div className="flex items-center text-sm text-green-400">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {lastSaved.toLocaleTimeString()} 已保存
                  </div>
                )}
                <button
                  onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                  className={`text-xs px-2 py-1 rounded ${
                    autoSaveEnabled
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}
                >
                  {autoSaveEnabled ? '自动保存开启' : '自动保存关闭'}
                </button>
              </div>

              {/* 编辑器模式切换 */}
              <div className="flex items-center space-x-1 mx-4">
                <Button
                  variant={editorMode === 'edit' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setEditorMode('edit')}
                  icon={Edit3}
                  className="text-xs"
                >
                  编辑
                </Button>
                <Button
                  variant={editorMode === 'preview' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setEditorMode('preview')}
                  icon={Eye}
                  className="text-xs"
                >
                  预览
                </Button>
                <Button
                  variant={editorMode === 'split' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setEditorMode('split')}
                  icon={Split}
                  className="text-xs"
                >
                  分栏
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOptimize}
                  disabled={isOptimizing || !content.trim()}
                  icon={isOptimizing ? Loader2 : Zap}
                  className={isOptimizing ? 'animate-spin' : ''}
                >
                  {isOptimizing ? '优化中...' : 'AI优化'}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  icon={X}
                />
              </div>
            </div>

            {/* 编辑器内容 */}
            <div className="p-4 space-y-4">
              {/* 标题编辑 */}
              <div>
                <label className="block text-sm font-medium text-sidebar-text mb-2">
                  标题
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="节点标题（可选）"
                  className="w-full"
                />
              </div>

              {/* 内容编辑 */}
              <div>
                <label className="block text-sm font-medium text-sidebar-text mb-2">
                  内容
                  <span className="text-xs text-sidebar-text-muted ml-2">
                    (支持Markdown格式，Ctrl+Tab切换模式)
                  </span>
                </label>

                <div className="border border-sidebar-border rounded-md overflow-hidden">
                  {editorMode === 'edit' && (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="请输入节点内容...&#10;&#10;支持Markdown格式：&#10;# 标题&#10;**粗体** *斜体*&#10;```代码块```&#10;- 列表项&#10;[链接](URL)"
                      rows={12}
                      className="w-full px-3 py-2 bg-sidebar-bg text-sidebar-text placeholder-sidebar-text-muted resize-none
                               focus:outline-none focus:ring-2 focus:ring-sidebar-accent focus:border-transparent border-none"
                    />
                  )}

                  {editorMode === 'preview' && (
                    <div
                      className="w-full px-3 py-2 bg-sidebar-surface text-sidebar-text min-h-[300px] overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(content || '请输入内容以查看预览...') }}
                    />
                  )}

                  {editorMode === 'split' && (
                    <div className="flex">
                      <div className="w-1/2 border-r border-sidebar-border">
                        <div className="px-2 py-1 bg-sidebar-bg border-b border-sidebar-border text-xs text-sidebar-text-muted font-medium">
                          编辑
                        </div>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="请输入内容..."
                          rows={12}
                          className="w-full px-3 py-2 bg-sidebar-bg text-sidebar-text placeholder-sidebar-text-muted resize-none
                                   focus:outline-none border-none"
                        />
                      </div>
                      <div className="w-1/2">
                        <div className="px-2 py-1 bg-sidebar-surface border-b border-sidebar-border text-xs text-sidebar-text-muted font-medium">
                          预览
                        </div>
                        <div
                          className="px-3 py-2 bg-sidebar-surface text-sidebar-text min-h-[300px] overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(content || '请输入内容以查看预览...') }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 重要性设置 */}
              <div>
                <label className="block text-sm font-medium text-sidebar-text mb-2">
                  重要性等级
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setImportance(level as ImportanceLevel)}
                      className={`p-2 rounded-md transition-colors ${
                        importance >= level
                          ? 'text-yellow-400 bg-yellow-400/20'
                          : 'text-sidebar-text-muted hover:text-sidebar-text'
                      }`}
                    >
                      <Star className="h-4 w-4" fill={importance >= level ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                  <span className="text-sm text-sidebar-text-muted ml-2">
                    {importance}/5
                  </span>
                </div>
              </div>

              {/* 标签管理 */}
              <div>
                <label className="block text-sm font-medium text-sidebar-text mb-2">
                  标签
                </label>
                
                {/* 现有标签 */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <motion.span
                      key={`${tag}-${index}`}
                      className="inline-flex items-center px-2 py-1 text-xs rounded-md 
                               bg-sidebar-accent/20 text-sidebar-accent border border-sidebar-accent/20"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.span>
                  ))}
                </div>

                {/* 添加标签 */}
                <div className="flex items-center space-x-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="添加新标签..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!newTag.trim() || tags.includes(newTag.trim())}
                  >
                    添加
                  </Button>
                </div>
              </div>
            </div>

            {/* 编辑器底部 */}
            <div className="flex items-center justify-between p-4 border-t border-sidebar-border">
              <div className="text-sm text-sidebar-text-muted">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>Esc 取消</span>
                  <span>Ctrl+Enter 保存</span>
                  <span>Ctrl+Tab 切换模式</span>
                  <span>Ctrl+O AI优化</span>
                  <span>Ctrl+Shift+S 切换自动保存</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={onClose}
                >
                  取消
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  loading={isSaving}
                  icon={isSaving ? Loader2 : CheckCircle}
                >
                  {isSaving ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}