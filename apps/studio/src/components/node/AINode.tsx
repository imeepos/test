/**
 * AI 节点组件 - 优化版本
 * 修复了信息层级混乱、添加了可访问性支持、优化了性能
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
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
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import { useCanvasStore, useNodeStore } from '@/stores'
import { MarkdownContent } from '@/components/common/MarkdownContent'
import { NodeEditor } from './NodeEditor'
import { createAriaProps, useKeyboardNavigation } from '@/hooks/useAccessibility'
import {
  getConfidenceColor,
  STATUS_COLORS,
  ANIMATION_DURATION
} from '@/constants/designTokens'
import type { AINodeData, AINode as AINodeType } from '@/types'
import { shallow } from 'zustand/shallow'

export interface AINodeProps extends NodeProps<AINodeData> {}

interface PortTheme {
  color: string
  border: string
  label: string
}

interface PortSlot {
  key: string
  type: string
  bidirectional?: boolean
}

const PORT_STYLE_PRESETS: Record<string, PortTheme> = {
  default: { color: '#6366f1', border: '#4338ca', label: '数据' },
  input: { color: '#6366f1', border: '#4338ca', label: '输入' },
  output: { color: '#22c55e', border: '#15803d', label: '输出' },
  related: { color: '#14b8a6', border: '#0f766e', label: '关联' },
  fusion: { color: '#f59e0b', border: '#d97706', label: '融合' },
  synthesis: { color: '#fb7185', border: '#f43f5e', label: '综合' },
  summary: { color: '#a855f7', border: '#7c3aed', label: '总结' },
  comparison: { color: '#f97316', border: '#ea580c', label: '对比' },
  analysis: { color: '#38bdf8', border: '#0284c7', label: '分析' },
  plan: { color: '#34d399', border: '#059669', label: '计划' },
  decision: { color: '#f472b6', border: '#db2777', label: '决策' },
}

const resolvePortTheme = (portType: string | undefined, direction: 'input' | 'output'): PortTheme => {
  const normalized = (portType || '').toLowerCase()
  if (normalized && PORT_STYLE_PRESETS[normalized]) {
    return PORT_STYLE_PRESETS[normalized]
  }
  if (PORT_STYLE_PRESETS[direction]) {
    return PORT_STYLE_PRESETS[direction]
  }
  return PORT_STYLE_PRESETS.default
}

const AINode: React.FC<AINodeProps> = ({ data, selected }) => {
  const { viewMode } = useCanvasStore()
  const { updateNode } = useNodeStore()

  // 状态管理
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false) // 预览模式下的手动展开

  const isOverview = viewMode === 'overview'
  const isPreview = viewMode === 'preview'
  const isDetail = viewMode === 'detail'

  useEffect(() => {
    if (isDetail) {
      setIsManuallyExpanded(true)
    } else if (isOverview) {
      setIsManuallyExpanded(false)
    }
  }, [isDetail, isOverview])

  // 监听画布发出的“打开节点编辑器”事件
  useEffect(() => {
    const handleOpenNodeEditor = (event: Event) => {
      const customEvent = event as CustomEvent<{ nodeId: string }>
      if (customEvent.detail?.nodeId === data.id) {
        setIsEditorOpen(true)
      }
    }

    window.addEventListener('open-node-editor', handleOpenNodeEditor)
    return () => {
      window.removeEventListener('open-node-editor', handleOpenNodeEditor)
    }
  }, [data.id])

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

  const { inputPorts, outputPorts } = useNodeStore(
    useCallback((state) => {
      const node = state.nodes.get(data.id)
      if (!node) {
        return {
          inputPorts: [] as PortSlot[],
          outputPorts: [] as PortSlot[],
        }
      }

      const connections = Array.isArray(node.connections) ? node.connections : []

      const inputs = connections
        .filter((conn) => conn.type === 'input')
        .map((conn, index) => ({
          key: conn.id || `${node.id}-input-${index}`,
          type: conn.metadata?.type ?? conn.type ?? 'input',
          bidirectional: conn.metadata?.bidirectional ?? false,
        }))

      const outputs = connections
        .filter((conn) => conn.type !== 'input')
        .map((conn, index) => ({
          key: conn.id || `${node.id}-output-${index}`,
          type: conn.metadata?.type ?? conn.type ?? 'output',
          bidirectional: conn.metadata?.bidirectional ?? false,
        }))

      return {
        inputPorts: inputs,
        outputPorts: outputs,
      }
    }, [data.id]),
    shallow
  )

  const fallbackInputPorts = useMemo<PortSlot[]>(() => {
    const semanticPrimary = data.metadata?.semantic?.[0]?.toLowerCase()
    return [
      {
        key: `${data.id}-input-fallback`,
        type: semanticPrimary ?? 'input',
      },
    ]
  }, [data.id, data.metadata?.semantic])

  const fallbackOutputPorts = useMemo<PortSlot[]>(() => {
    const semanticPrimary = data.metadata?.semantic?.[0]?.toLowerCase()
    return [
      {
        key: `${data.id}-output-fallback`,
        type: semanticPrimary ?? 'output',
      },
    ]
  }, [data.id, data.metadata?.semantic])

  type PortVisual = {
    id: string
    label: string
    color: string
    border: string
    top: string
    shadow?: string
  }

  const inputPortVisuals = useMemo<PortVisual[]>(() => {
    const ports = (inputPorts.length > 0 ? inputPorts : fallbackInputPorts)
    const total = ports.length || 1

    return ports.map((port, index) => {
      const theme = resolvePortTheme(port.type, 'input')
      const labelBase = theme.label || '输入'
      const label = ports.length > 1 ? `${labelBase} ${index + 1}` : labelBase
      const top = `${((index + 1) / (total + 1)) * 100}%`

      return {
        id: port.key,
        label: port.bidirectional ? `${label} ↔` : label,
        color: theme.color,
        border: port.bidirectional ? '#f97316' : theme.border,
        top,
        shadow: port.bidirectional ? '0 0 0 2px rgba(249, 115, 22, 0.25)' : undefined,
      }
    })
  }, [fallbackInputPorts, inputPorts])

  const outputPortVisuals = useMemo<PortVisual[]>(() => {
    const ports = (outputPorts.length > 0 ? outputPorts : fallbackOutputPorts)
    const total = ports.length || 1

    return ports.map((port, index) => {
      const theme = resolvePortTheme(port.type, 'output')
      const labelBase = theme.label || '输出'
      const label = ports.length > 1 ? `${labelBase} ${index + 1}` : labelBase
      const top = `${((index + 1) / (total + 1)) * 100}%`

      return {
        id: port.key,
        label: port.bidirectional ? `${label} ↔` : label,
        color: theme.color,
        border: port.bidirectional ? '#f97316' : theme.border,
        top,
        shadow: port.bidirectional ? '0 0 0 2px rgba(249, 115, 22, 0.25)' : undefined,
      }
    })
  }, [fallbackOutputPorts, outputPorts])

  const baseHandleClassName = 'w-3 h-3 !border-2 transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent shadow-md'
  const showPortLabels = !isOverview

  // ============= 渲染辅助函数 =============

  const statusColors = useMemo(() => {
    return STATUS_COLORS[data.status] ?? STATUS_COLORS.idle
  }, [data.status])

  /**
   * 获取状态图标
   */
  const statusIcon = useMemo(() => {
    switch (data.status) {
      case 'processing':
        return (
          <Loader2
            className={`h-4 w-4 animate-spin ${statusColors.icon}`}
            aria-label="处理中"
          />
        )
      case 'completed':
        return (
          <CheckCircle
            className={`h-4 w-4 ${statusColors.icon}`}
            aria-label="已完成"
          />
        )
      case 'error':
        return (
          <AlertCircle
            className={`h-4 w-4 ${statusColors.icon}`}
            aria-label="错误"
          />
        )
      default:
        return null
    }
  }, [data.status, statusColors.icon])

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
   * 双击编辑处理 - 弹出提示词输入让AI修改
   */
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    // 触发编辑节点事件，由CanvasPage处理
    const editEvent = new CustomEvent('edit-node', {
      detail: { nodeId: data.id, currentContent: data.content, currentTitle: data.title }
    })
    window.dispatchEvent(editEvent)
  }, [data.id, data.content, data.title])

  /**
   * 切换折叠/展开状态
   */
  const toggleExpanded = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isPreview) {
      return
    }

    setIsManuallyExpanded((prev) => !prev)
  }, [isPreview])

  /**
   * 重试AI生成
   */
  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    // 触发重试事件
    const retryEvent = new CustomEvent('retry-ai-generation', {
      detail: { nodeId: data.id }
    })
    window.dispatchEvent(retryEvent)
  }, [data.id])

  const handleContentWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const container = event.currentTarget
    const { scrollHeight, clientHeight, scrollTop } = container

    const isScrollable = scrollHeight > clientHeight + 1

    if (!isScrollable) {
      return
    }

    const atTop = scrollTop <= 0
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1
    const isScrollingUp = event.deltaY < 0
    const isScrollingDown = event.deltaY > 0

    if ((isScrollingUp && atTop) || (isScrollingDown && atBottom)) {
      return
    }

    event.stopPropagation()
  }, [])


  // ============= 样式计算 =============

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

  const showFullDetail = isDetail || isManuallyExpanded
  const displayContent = showFullDetail ? data.content : contentPreview
  const cardSizeClasses = isOverview ? 'min-w-[160px] max-w-[220px]' : 'min-w-[220px] max-w-[320px]'
  const nodeTitle = data.title || '未命名节点'
  const previewContentClassNames = 'text-sm text-sidebar-text leading-relaxed break-words'
  const showUserRating = typeof data.user_rating === 'number' && data.user_rating > 0

  // ARIA 属性
  const nodeAriaProps = createAriaProps({
    role: 'article',
    label: `AI节点: ${nodeTitle}`,
    describedBy: `node-content-${data.id}`
  })

  return (
    <>
      {inputPortVisuals.map((port) => (
        <React.Fragment key={`input-${port.id}`}>
          <Handle
            id={`input-${port.id}`}
            type="target"
            position={Position.Left}
            className={baseHandleClassName}
            style={{
              top: port.top,
              background: port.color,
              borderColor: port.border,
              boxShadow: port.shadow,
              transform: 'translateY(-50%)',
              opacity: selected ? 1 : 0.9,
            }}
            aria-label={`输入端口 ${port.label}`}
          />
          {showPortLabels && (
            <div
              className="absolute -left-28 flex items-center justify-end pointer-events-none select-none"
              style={{ top: port.top, transform: 'translateY(-50%)' }}
            >
              <span className="text-[10px] font-medium uppercase tracking-wide text-sidebar-text-muted bg-sidebar-surface/80 px-2 py-0.5 rounded-md border border-sidebar-border/60">
                {port.label}
              </span>
            </div>
          )}
        </React.Fragment>
      ))}

      {outputPortVisuals.map((port) => (
        <React.Fragment key={`output-${port.id}`}>
          <Handle
            id={`output-${port.id}`}
            type="source"
            position={Position.Right}
            className={baseHandleClassName}
            style={{
              top: port.top,
              background: port.color,
              borderColor: port.border,
              boxShadow: port.shadow,
              transform: 'translateY(-50%)',
              opacity: selected ? 1 : 0.9,
            }}
            aria-label={`输出端口 ${port.label}`}
          />
          {showPortLabels && (
            <div
              className="absolute -right-28 flex items-center pointer-events-none select-none"
              style={{ top: port.top, transform: 'translateY(-50%)' }}
            >
              <span className="text-[10px] font-medium uppercase tracking-wide text-sidebar-text-muted bg-sidebar-surface/80 px-2 py-0.5 rounded-md border border-sidebar-border/60">
                {port.label}
              </span>
            </div>
          )}
        </React.Fragment>
      ))}

      {/* 节点主体 */}
      <motion.div
        {...nodeAriaProps}
        className={`
          group relative ${cardSizeClasses} rounded-lg border-2 cursor-pointer
          ${statusColors.border} ${statusColors.bg} ${statusColors.text}
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
        {/* 头部信息 */}
        <div
          className={`px-3 py-2 border-b border-canvas-node-border ${
            isOverview ? 'flex flex-col gap-1' : 'flex items-center justify-between gap-2'
          }`}
        >
          <div className={`flex items-center ${isOverview ? 'gap-1' : 'gap-2'} flex-1 min-w-0`}>
            {isPreview && (
              <button
                onClick={toggleExpanded}
                className="p-0.5 hover:bg-sidebar-accent/10 rounded transition-colors"
                aria-label={showFullDetail ? '折叠详细信息' : '展开详细信息'}
              >
                {showFullDetail ? (
                  <ChevronDown className="h-4 w-4 text-sidebar-text-muted" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-sidebar-text-muted" />
                )}
              </button>
            )}

            <h3 className="text-sm font-medium text-sidebar-text truncate">
              {nodeTitle}
            </h3>
          </div>

          {!isOverview && statusIcon}

          {isOverview && (
            <div className="flex items-center gap-1" aria-label={`重要性等级 ${data.importance}`}>
              {renderStars(data.importance)}
            </div>
          )}
        </div>

        {/* 内容区域 */}
        {isOverview ? (
          <>
            <div className="px-3 py-2 text-xs text-sidebar-text-muted flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" aria-hidden="true" />
                <span aria-label={`置信度 ${Math.round(data.confidence * 100)}%`}>
                  {Math.round(data.confidence * 100)}%
                </span>
              </div>
              <span className="text-[11px]" aria-label={`版本 ${data.version}`}>
                v{data.version}
              </span>
            </div>
            {showUserRating && (
              <div className="px-3 pb-2 text-[11px] text-amber-400 flex items-center gap-1">
                <Star className="h-3 w-3" aria-hidden="true" />
                <span aria-label={`用户评分 ${data.user_rating} / 5`}>
                  {data.user_rating}/5
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            {showFullDetail && (
              <div className="flex items-center justify-between px-3 py-2 border-b border-canvas-node-border">
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
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30"
                      title="自动保存"
                      aria-label="自动保存"
                    >
                      AS
                    </span>
                  )}
                </div>
              </div>
            )}

            <div
              id={`node-content-${data.id}`}
              className={`px-4 py-3 ${showFullDetail ? 'max-h-72 overflow-y-auto pr-1' : ''}`}
              onWheel={handleContentWheel}
            >
              {showFullDetail ? (
                <MarkdownContent content={displayContent} />
              ) : (
                <p className={previewContentClassNames}>
                  {displayContent || '暂无内容'}
                </p>
              )}
            </div>

            {showFullDetail && data.metadata?.lastEditReason && (
              <div className="px-4 pb-2 text-xs text-sidebar-text-muted italic">
                变更原因：{data.metadata.lastEditReason}
              </div>
            )}

            <div className="flex items-center justify-between px-3 py-2 border-t border-canvas-node-border">
              <div className="flex items-center gap-3">
                {renderStars(data.importance)}
                {showUserRating && (
                  <div
                    className="flex items-center gap-1 text-xs text-amber-400"
                    aria-label={`用户评分 ${data.user_rating} / 5`}
                  >
                    <Star className="h-3 w-3" aria-hidden="true" />
                    <span>{data.user_rating}/5</span>
                  </div>
                )}
              </div>

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

            {showFullDetail && data.tags.length > 0 && (
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


        {/* 处理状态遮罩 - 完全不透明 */}
        {data.status === 'processing' && (
          <motion.div
            className="absolute inset-0 bg-canvas-node backdrop-blur-sm rounded-lg
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

        {/* 错误状态重试按钮 - 悬浮在节点右上角 */}
        {data.status === 'error' && (
          <motion.button
            onClick={handleRetry}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full shadow-lg
                     flex items-center justify-center transition-colors z-10"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="重试AI生成"
            aria-label="重试AI生成"
          >
            <RefreshCw className="h-3 w-3 text-white" />
          </motion.button>
        )}
      </motion.div>

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
