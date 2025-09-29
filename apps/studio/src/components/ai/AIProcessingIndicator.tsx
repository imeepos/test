import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pause, Play, Square } from 'lucide-react'
import { AILoading, InlineLoading } from '@/components/ui/Loading'
import { useUIStore, useNodeStore } from '@/stores'
import { cn } from '@/utils'

interface AIProcessingJob {
  id: string
  nodeId: string
  type: 'create' | 'update' | 'optimize' | 'expand' | 'fusion'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  stage: 'connecting' | 'processing' | 'generating' | 'optimizing' | 'finalizing'
  progress: number
  startTime: Date
  estimatedDuration?: number
  canCancel: boolean
  description: string
}

interface AIProcessingIndicatorProps {
  className?: string
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'center'
  compact?: boolean
}

export const AIProcessingIndicator: React.FC<AIProcessingIndicatorProps> = ({
  className,
  position = 'bottom-right',
  compact = false,
}) => {
  const { isLoading } = useUIStore()
  const { getNode } = useNodeStore()
  const [jobs, setJobs] = useState<AIProcessingJob[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  // 模拟AI处理任务管理（实际应用中应该从aiStore获取）
  const activeJobs = jobs.filter(job => ['pending', 'processing'].includes(job.status))
  const hasActiveJobs = activeJobs.length > 0

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  }

  // 监听AI处理状态
  useEffect(() => {
    // 这里应该订阅AI处理事件
    // 例如从aiStore或通过WebSocket监听

    // 模拟添加任务的函数
    const addJob = (job: Omit<AIProcessingJob, 'id' | 'startTime' | 'status' | 'progress'>) => {
      const newJob: AIProcessingJob = {
        ...job,
        id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        startTime: new Date(),
        status: 'pending',
        progress: 0,
      }
      setJobs(prev => [...prev, newJob])
    }

    // 模拟更新任务进度
    const updateJob = (jobId: string, updates: Partial<AIProcessingJob>) => {
      setJobs(prev => prev.map(job =>
        job.id === jobId ? { ...job, ...updates } : job
      ))
    }

    // 暴露到全局供其他组件使用
    ;(window as any).__aiProcessing = { addJob, updateJob }

    return () => {
      delete (window as any).__aiProcessing
    }
  }, [])

  // 取消任务
  const cancelJob = (jobId: string) => {
    setJobs(prev => prev.map(job =>
      job.id === jobId ? { ...job, status: 'cancelled' } : job
    ))
  }

  // 暂停/恢复任务
  const toggleJob = (jobId: string) => {
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          status: job.status === 'processing' ? 'pending' : 'processing'
        }
      }
      return job
    }))
  }

  // 清理已完成的任务
  const clearCompletedJobs = () => {
    setJobs(prev => prev.filter(job => !['completed', 'failed', 'cancelled'].includes(job.status)))
  }

  if (!hasActiveJobs && !compact) {
    return null
  }

  // 紧凑模式 - 只显示一个简单的指示器
  if (compact) {
    return hasActiveJobs ? (
      <div className={cn('inline-flex items-center', className)}>
        <InlineLoading size="sm" text="AI处理中..." />
      </div>
    ) : null
  }

  // 完整模式 - 显示详细的处理面板
  return (
    <div className={cn('fixed z-40', positionClasses[position], className)}>
      <AnimatePresence>
        {hasActiveJobs && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-sidebar-surface border border-sidebar-border rounded-lg shadow-xl overflow-hidden max-w-sm"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-3 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <InlineLoading size="sm" />
                <span className="text-sm font-medium text-sidebar-text">
                  AI处理中 ({activeJobs.length})
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 rounded hover:bg-sidebar-hover text-sidebar-text-muted hover:text-sidebar-text transition-colors"
                  title={isExpanded ? '收起' : '展开'}
                >
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    ↓
                  </motion.div>
                </button>
                <button
                  onClick={clearCompletedJobs}
                  className="p-1 rounded hover:bg-sidebar-hover text-sidebar-text-muted hover:text-sidebar-text transition-colors"
                  title="清理已完成"
                >
                  <Square className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* 任务列表 */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="max-h-80 overflow-y-auto">
                    {activeJobs.map((job) => (
                      <AIJobItem
                        key={job.id}
                        job={job}
                        onCancel={job.canCancel ? () => cancelJob(job.id) : undefined}
                        onToggle={() => toggleJob(job.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 快速预览（收起时） */}
            {!isExpanded && activeJobs.length > 0 && (
              <div className="px-3 pb-3">
                <div className="text-xs text-sidebar-text-muted">
                  {activeJobs[0].description}
                  {activeJobs.length > 1 && ` +${activeJobs.length - 1} 更多`}
                </div>
                {activeJobs[0].progress > 0 && (
                  <div className="mt-2 w-full bg-sidebar-border rounded-full h-1">
                    <div
                      className="bg-sidebar-accent h-1 rounded-full transition-all duration-300"
                      style={{ width: `${activeJobs[0].progress}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// 单个AI任务项组件
interface AIJobItemProps {
  job: AIProcessingJob
  onCancel?: () => void
  onToggle: () => void
}

const AIJobItem: React.FC<AIJobItemProps> = ({ job, onCancel, onToggle }) => {
  const { getNode } = useNodeStore()
  const node = getNode(job.nodeId)

  const typeLabels = {
    create: '创建节点',
    update: '更新节点',
    optimize: '优化内容',
    expand: '扩展节点',
    fusion: '融合节点',
  }

  const statusColors = {
    pending: 'text-yellow-400',
    processing: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
    cancelled: 'text-gray-400',
  }

  return (
    <motion.div
      layout
      className="p-3 border-b border-sidebar-border last:border-b-0 hover:bg-sidebar-hover/50 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs font-medium', statusColors[job.status])}>
              {typeLabels[job.type]}
            </span>
            {node && (
              <span className="text-xs text-sidebar-text-muted truncate">
                {node.title || '未命名节点'}
              </span>
            )}
          </div>

          <p className="text-xs text-sidebar-text-muted mb-2">
            {job.description}
          </p>

          {job.status === 'processing' && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-sidebar-text-muted">{job.stage}</span>
                <span className="text-sidebar-text-muted">{Math.round(job.progress)}%</span>
              </div>
              <div className="w-full bg-sidebar-border rounded-full h-1">
                <motion.div
                  className="bg-sidebar-accent h-1 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${job.progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-sidebar-hover text-sidebar-text-muted hover:text-sidebar-text transition-colors"
            title={job.status === 'processing' ? '暂停' : '继续'}
          >
            {job.status === 'processing' ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1 rounded hover:bg-sidebar-hover text-sidebar-text-muted hover:text-red-400 transition-colors"
              title="取消"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// 全屏AI处理遮罩
export const AIProcessingOverlay: React.FC<{
  isVisible: boolean
  title?: string
  description?: string
  stage?: 'connecting' | 'processing' | 'generating' | 'optimizing' | 'finalizing'
  progress?: number
  canCancel?: boolean
  onCancel?: () => void
}> = ({
  isVisible,
  title = 'AI处理中',
  description = '请稍候，AI正在为您处理内容...',
  stage = 'processing',
  progress,
  canCancel = false,
  onCancel,
}) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-sidebar-surface border border-sidebar-border rounded-xl p-8 max-w-md w-full mx-4 text-center"
      >
        <AILoading
          stage={stage}
          progress={progress}
          text={description}
          className="mb-6"
        />

        <h3 className="text-lg font-medium text-sidebar-text mb-2">
          {title}
        </h3>

        {canCancel && onCancel && (
          <button
            onClick={onCancel}
            className="mt-6 px-4 py-2 text-sm text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-hover rounded transition-colors"
          >
            取消操作
          </button>
        )}
      </motion.div>
    </div>
  )
}

export default AIProcessingIndicator