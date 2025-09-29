import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Save, 
  X, 
  Zap, 
  Star,
  Tag,
  Loader2,
  AlertCircle,
  CheckCircle 
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
  
  // 操作状态
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

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

  // 保存更改
  const handleSave = async () => {
    if (!node || !hasChanges) return

    setIsSaving(true)
    try {
      const updates: Partial<AINode> = {
        content: content.trim(),
        title: title.trim() || undefined,
        importance,
        tags,
      }

      onSave(updates)
      setHasChanges(false)
      
      addToast({
        type: 'success',
        title: '保存成功',
        message: '节点内容已更新',
      })

      onClose()
    } catch (error) {
      console.error('保存失败:', error)
      addToast({
        type: 'error',
        title: '保存失败',
        message: '请稍后重试',
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
      const updates = await nodeService.updateNode(nodeId, node, {
        content: content.trim(),
        useAI: true,
      })

      if (updates.content) setContent(updates.content)
      if (updates.title) setTitle(updates.title)
      if (updates.tags) setTags(updates.tags)
      
      addToast({
        type: 'success',
        title: 'AI优化完成',
        message: '内容已优化，请检查并保存',
      })

    } catch (error) {
      console.error('AI优化失败:', error)
      addToast({
        type: 'error',
        title: 'AI优化失败',
        message: '请检查网络连接后重试',
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

  // 键盘快捷键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave()
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
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请输入节点内容..."
                  rows={8}
                  className="w-full px-3 py-2 bg-sidebar-bg border border-sidebar-border rounded-md 
                           text-sidebar-text placeholder-sidebar-text-muted resize-none
                           focus:outline-none focus:ring-2 focus:ring-sidebar-accent focus:border-transparent"
                />
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
                按 Esc 取消，Ctrl+Enter 保存
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