/**
 * AI 节点组件 - 优化版本
 * 修复了信息层级混乱、添加了可访问性支持、优化了性能
 */

import React, { useState, useCallback, useMemo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { motion } from 'framer-motion'
import {
  Star,
  Loader2,
  CheckCircle,
  AlertCircle,
  Tag,
  Zap,
  Clock,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useCanvasStore, useNodeStore } from '@/stores'
import { NodeEditor } from './NodeEditor'
import { createAriaProps, useKeyboardNavigation } from '@/hooks/useAccessibility'
import {
  getImportanceColor,
  getConfidenceColor,
  STATUS_COLORS,
  ANIMATION_DURATION
} from '@/constants/designTokens'
import type { AINodeData, AINode as AINodeType } from '@/types'

export interface AINodeProps extends NodeProps<AINodeData> {}

const AINode: React.FC<AINodeProps> = ({ data, selected }) => {
  const { viewMode } = useCanvasStore()
  const { updateNode } = useNodeStore()

  // 状态管理
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false) // 默认折叠

  // 键盘导航支持
  useKeyboardNavigation({
    onEnter: () => {
      if (selected) {
        setIsEditorOpen(true)
      }
    },
    onSpace: () => {
      if (selected) {
        setIsEditorOpen(true)
      }
    },
    disabled: !selected
  })

  // ============= 渲染辅助函数 =============

  /**
   * 获取状态图标
   */
  const statusIcon = useMemo(() => {
    switch (data.status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" aria-label="处理中" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" aria-label="已完成" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" aria-label="错误" />
      default:
        return null
    }
  }, [data.status])

  /**
   * 渲染重要性星级
   */
  const renderStars = useCallback((importance: number) => {
    return (
      <div className="flex items-center gap-0.5" role="img" aria-label={`重要性等级 ${importance} 星`}>
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={`h-3 w-3 ${
              index < importance
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-600'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
    )
  }, [])

  /**
   * 智能内容预览 - 按单词边界截断
   */
  const contentPreview = useMemo(() => {
    if (viewMode !== 'preview' || data.content.length <= 100) {
      return data.content
    }

    // 找到第100个字符附近的单词边界
    const truncated = data.content.substring(0, 100)
    const lastSpaceIndex = truncated.lastIndexOf(' ')

    if (lastSpaceIndex > 80) {
      return truncated.substring(0, lastSpaceIndex) + '...'
    }

    return truncated + '...'
  }, [data.content, viewMode])

  /**
   * 节点更新处理
   */
  const handleNodeUpdate = useCallback((updates: Partial<AINodeType>) => {
    updateNode(data.id, updates)
    setIsEditorOpen(false)
  }, [data.id, updateNode])

  /**
   * 双击编辑处理
   */
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsEditorOpen(true)
  }, [])

  /**
   * 切换折叠/展开状态
   */
  const toggleExpanded = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }, [isExpanded])


  // ============= 样式计算 =============

  const importanceColors = useMemo(() => {
    // 确保 importance 是有效值,否则使用默认值 3
    const validImportance = (data.importance >= 1 && data.importance <= 5) ? data.importance : 3
    return getImportanceColor(validImportance as 1 | 2 | 3 | 4 | 5)
  }, [data.importance])

  const confidenceInfo = useMemo(() => {
    // 确保 confidence 是有效数值,否则使用默认值 0.5
    const validConfidence = (typeof data.confidence === 'number' && !isNaN(data.confidence)) ? data.confidence : 0.5
    return getConfidenceColor(validConfidence)
  }, [data.confidence])

  // 版本信息 tooltip
  const versionTooltip = useMemo(() => {
    const editCount = data.metadata?.editCount || 0
    const createdDate = new Date(data.createdAt).toLocaleString('zh-CN')
    const updatedDate = new Date(data.updatedAt).toLocaleString('zh-CN')

    return `版本 ${data.version} | 编辑 ${editCount} 次\n创建: ${createdDate}\n更新: ${updatedDate}${data.metadata?.autoSaved ? '\n自动保存' : ''}`
  }, [data.version, data.metadata, data.createdAt, data.updatedAt])

  // ARIA 属性
  const nodeAriaProps = createAriaProps({
    role: 'article',
    label: `AI节点: ${data.title || '未命名节点'}`,
    describedBy: `node-content-${data.id}`
  })

  return (
    <>
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !border-2"
        style={{ background: '#6366f1' }}
        aria-label="节点输入连接点"
      />

      {/* 节点主体 */}
      <motion.div
        {...nodeAriaProps}
        className={`
          group relative min-w-[200px] max-w-[300px] rounded-lg border-2 bg-canvas-node cursor-pointer
          ${importanceColors.border} ${importanceColors.bg}
          ${selected ? 'ring-2 ring-sidebar-accent shadow-xl' : 'shadow-lg'}
          transition-shadow duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent focus-visible:ring-offset-2
        `}
        style={{ willChange: 'box-shadow' }}
        onDoubleClick={handleDoubleClick}
        tabIndex={selected ? 0 : -1}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: ANIMATION_DURATION.fast / 1000 }}
      >
        {/* 头部 - 统一的信息栏 */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-canvas-node-border">
          {/* 折叠/展开按钮 + 标题和状态 */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={toggleExpanded}
              className="p-0.5 hover:bg-sidebar-accent/10 rounded transition-colors"
              aria-label={isExpanded ? "折叠详细信息" : "展开详细信息"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-sidebar-text-muted" />
              ) : (
                <ChevronRight className="h-4 w-4 text-sidebar-text-muted" />
              )}
            </button>
            {data.title && (
              <h3 className="text-sm font-medium text-sidebar-text truncate">
                {data.title}
              </h3>
            )}
            {statusIcon}
          </div>
        </div>

        {/* 详细信息区域 - 仅在展开时显示 */}
        {isExpanded && (
          <>
            {/* 版本信息 - 仅展开时显示 */}
            <div className="flex items-center justify-end px-3 py-2 border-b border-canvas-node-border">
              <div
                className="flex items-center gap-2 cursor-help"
                title={versionTooltip}
                aria-label={versionTooltip}
              >
                <div className="flex items-center gap-1 text-xs text-sidebar-text-muted">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <span aria-label={`版本 ${data.version}`}>v{data.version}</span>
                </div>

                {data.metadata?.autoSaved && (
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                             bg-green-500/20 text-green-400 border border-green-500/30"
                    title="自动保存"
                    aria-label="自动保存"
                  >
                    AS
                  </span>
                )}
              </div>
            </div>

            {/* 内容区域 - 增加padding */}
            <div className="px-4 py-3">
              <p
                id={`node-content-${data.id}`}
                className="text-sm text-sidebar-text leading-relaxed whitespace-pre-wrap break-words"
              >
                {contentPreview}
              </p>
            </div>

            {/* 元信息栏 */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-canvas-node-border">
              {/* 重要性星级 */}
              {renderStars(data.importance)}

              {/* 置信度 */}
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" aria-hidden="true" />
                <span
                  className={`text-xs font-medium ${confidenceInfo.text}`}
                  aria-label={`置信度 ${Math.round(data.confidence * 100)}%`}
                >
                  {Math.round(data.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* 标签 - 最多显示2个 */}
            {data.tags.length > 0 && (
              <div className="px-3 pb-3">
                <div className="flex flex-wrap gap-1" role="list" aria-label="节点标签">
                  {data.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      role="listitem"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-sidebar-accent/10 text-sidebar-accent"
                    >
                      <Tag className="h-2.5 w-2.5" aria-hidden="true" />
                      {tag}
                    </span>
                  ))}
                  {data.tags.length > 2 && (
                    <span
                      className="text-xs text-sidebar-text-muted self-center"
                      aria-label={`还有 ${data.tags.length - 2} 个标签`}
                    >
                      +{data.tags.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}


        {/* 处理状态遮罩 - 使用透明度而非全屏遮罩 */}
        {data.status === 'processing' && (
          <motion.div
            className="absolute inset-0 bg-canvas-node/80 backdrop-blur-[2px] rounded-lg
                     flex flex-col items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: ANIMATION_DURATION.normal / 1000 }}
            role="status"
            aria-live="polite"
            aria-label="AI生成中"
          >
            <Loader2 className="h-5 w-5 animate-spin text-sidebar-accent" aria-hidden="true" />
            <p className="text-xs text-sidebar-text">AI生成中...</p>
          </motion.div>
        )}
      </motion.div>

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !border-2"
        style={{ background: '#6366f1' }}
        aria-label="节点输出连接点"
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

/**
 * 自定义比较函数 - 仅在关键数据变化时重新渲染
 */
const areNodesEqual = (
  prevProps: AINodeProps,
  nextProps: AINodeProps
): boolean => {
  // 如果选中状态变化,需要重新渲染
  if (prevProps.selected !== nextProps.selected) {
    return false
  }

  // 如果ID变化,需要重新渲染
  if (prevProps.id !== nextProps.id) {
    return false
  }

  // 检查data中的关键字段
  const prevData = prevProps.data
  const nextData = nextProps.data

  // 内容相关
  if (prevData.content !== nextData.content) return false
  if (prevData.title !== nextData.title) return false
  if (prevData.status !== nextData.status) return false

  // 样式相关
  if (prevData.importance !== nextData.importance) return false
  if (prevData.confidence !== nextData.confidence) return false

  // 标签数量或内容变化
  if (prevData.tags?.length !== nextData.tags?.length) return false
  if (prevData.tags?.join(',') !== nextData.tags?.join(',')) return false

  // 版本变化
  if (prevData.version !== nextData.version) return false

  // 时间戳(仅在实际变化时比较)
  if (prevData.updatedAt !== nextData.updatedAt) return false

  // 如果以上都没变化,则不需要重新渲染
  return true
}

// 使用React.memo优化性能
const MemoizedAINode = React.memo(AINode, areNodesEqual)

export default MemoizedAINode
export { MemoizedAINode as AINode }
