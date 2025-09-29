import React, { useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { motion } from 'framer-motion'
import { 
  Star, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Tag,
  Clock,
  Zap,
  Edit,
  MoreHorizontal
} from 'lucide-react'
import { useCanvasStore, useNodeStore } from '@/stores'
import { NodeEditor } from './NodeEditor'
import type { AINodeData, ImportanceLevel, AINode } from '@/types'

export interface AINodeProps extends NodeProps<AINodeData> {}

const AINode: React.FC<AINodeProps> = ({ data, selected }) => {
  const { viewMode } = useCanvasStore()
  const { updateNode } = useNodeStore()
  
  // 编辑器状态
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // 重要性等级颜色
  const getImportanceColor = (importance: ImportanceLevel) => {
    const colors = {
      1: 'border-gray-500 bg-gray-500/10',
      2: 'border-green-500 bg-green-500/10',
      3: 'border-yellow-500 bg-yellow-500/10',
      4: 'border-orange-500 bg-orange-500/10',
      5: 'border-red-500 bg-red-500/10',
    }
    return colors[importance]
  }

  // 置信度颜色
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400'
    if (confidence >= 0.5) return 'text-yellow-400'
    return 'text-red-400'
  }

  // 状态图标
  const getStatusIcon = () => {
    switch (data.status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />
      default:
        return null
    }
  }

  // 重要性星级显示
  const renderStars = (importance: ImportanceLevel) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-3 w-3 ${
          index < importance
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-600'
        }`}
      />
    ))
  }

  // 内容预览
  const getContentPreview = () => {
    if (viewMode === 'preview' && data.content.length > 100) {
      return data.content.substring(0, 100) + '...'
    }
    return data.content
  }

  // 处理双击编辑
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditorOpen(true)
  }

  // 处理节点更新
  const handleNodeUpdate = (updates: Partial<AINode>) => {
    updateNode(data.id, updates)
    setIsEditorOpen(false)
  }

  // 快速操作按钮
  const renderQuickActions = () => {
    if (!isHovered && !selected) return null

    return (
      <motion.div
        className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
      >
        <button
          onClick={() => setIsEditorOpen(true)}
          className="p-1 rounded-md bg-sidebar-bg/80 hover:bg-sidebar-hover text-sidebar-text-muted hover:text-sidebar-text transition-colors"
          title="编辑节点"
        >
          <Edit className="h-3 w-3" />
        </button>
        
        <button
          className="p-1 rounded-md bg-sidebar-bg/80 hover:bg-sidebar-hover text-sidebar-text-muted hover:text-sidebar-text transition-colors"
          title="更多选项"
        >
          <MoreHorizontal className="h-3 w-3" />
        </button>
      </motion.div>
    )
  }

  return (
    <>
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !border-2"
        style={{ background: '#6366f1' }}
      />

      {/* 节点主体 */}
      <motion.div
        className={`
          group relative min-w-[200px] max-w-[300px] rounded-lg border-2 bg-canvas-node shadow-lg cursor-pointer
          ${getImportanceColor(data.importance)}
          ${selected ? 'ring-2 ring-sidebar-accent' : ''}
          ${isHovered ? 'shadow-xl' : ''}
          transition-all duration-200
        `}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        layout
      >
        {/* 快速操作按钮 */}
        {renderQuickActions()}
        {/* 头部 */}
        <div className="flex items-center justify-between p-3 pb-2">
          {/* 标题和状态 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {data.title && (
              <h3 className="text-sm font-medium text-sidebar-text truncate">
                {data.title}
              </h3>
            )}
            {getStatusIcon()}
          </div>

          {/* 版本和时间 */}
          <div className="flex items-center gap-2 text-xs text-sidebar-text-muted">
            <Clock className="h-3 w-3" />
            <span>v{data.version}</span>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="px-3 pb-2">
          <p className="text-sm text-sidebar-text leading-relaxed whitespace-pre-wrap break-words">
            {getContentPreview()}
          </p>
        </div>

        {/* 元信息 */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-canvas-node-border">
          {/* 重要性星级 */}
          <div className="flex items-center gap-1">
            {renderStars(data.importance)}
          </div>

          {/* 置信度 */}
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span className={`text-xs font-medium ${getConfidenceColor(data.confidence)}`}>
              {Math.round(data.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* 标签 */}
        {data.tags.length > 0 && (
          <div className="px-3 pb-3">
            <div className="flex flex-wrap gap-1">
              {data.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-sidebar-accent/10 text-sidebar-accent"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag}
                </span>
              ))}
              {data.tags.length > 3 && (
                <span className="text-xs text-sidebar-text-muted">
                  +{data.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 处理状态遮罩 */}
        {data.status === 'processing' && (
          <motion.div
            className="absolute inset-0 bg-canvas-node/50 backdrop-blur-sm rounded-lg flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-sidebar-accent" />
              <p className="text-xs text-sidebar-text-muted">AI生成中...</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !border-2"
        style={{ background: '#6366f1' }}
      />

      {/* 节点编辑器 */}
      <NodeEditor
        nodeId={data.id}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleNodeUpdate}
      />
    </>
  )
}

export { AINode }