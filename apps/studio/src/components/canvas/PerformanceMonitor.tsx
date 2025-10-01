/**
 * 性能监控面板
 * 实时显示画布性能指标
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useCanvasPerformance, PerformanceMetrics, usePerformanceRecommendations } from './PerformanceOptimizer'

interface PerformanceMonitorProps {
  isOpen?: boolean
  onClose?: () => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isOpen: controlledIsOpen,
  onClose,
  position = 'bottom-right',
}) => {
  const [isOpen, setIsOpen] = useState(controlledIsOpen ?? true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { metrics } = useCanvasPerformance()
  const recommendations = usePerformanceRecommendations(metrics)

  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen)
    }
  }, [controlledIsOpen])

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  if (!isOpen) return null

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  const getFPSColor = (fps: number) => {
    if (fps >= 50) return 'text-green-500'
    if (fps >= 30) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getPerformanceLevel = (fps: number) => {
    if (fps >= 50) return '优秀'
    if (fps >= 30) return '良好'
    if (fps >= 20) return '一般'
    return '较差'
  }

  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-50`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div className="bg-sidebar-surface/95 backdrop-blur-md border border-sidebar-border rounded-lg shadow-lg overflow-hidden min-w-[280px]">
        {/* 头部 */}
        <div className="flex items-center justify-between p-3 border-b border-sidebar-border bg-sidebar-bg/50">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-500" />
            <span className="text-sm font-semibold text-sidebar-text">性能监控</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-sidebar-border rounded transition-colors"
              aria-label={isCollapsed ? '展开' : '收起'}
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 text-sidebar-text-muted" />
              ) : (
                <ChevronUp className="w-4 h-4 text-sidebar-text-muted" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-sidebar-border rounded transition-colors"
              aria-label="关闭"
            >
              <X className="w-4 h-4 text-sidebar-text-muted" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* 性能指标 */}
              <div className="p-3 space-y-3">
                {/* FPS */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-sidebar-text-muted">FPS</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${getFPSColor(metrics.fps)}`}>
                      {metrics.fps}
                    </span>
                    <span className="text-xs text-sidebar-text-muted">
                      ({getPerformanceLevel(metrics.fps)})
                    </span>
                  </div>
                </div>

                {/* 节点数量 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-sidebar-text-muted">节点总数</span>
                  <span className="text-sm font-medium text-sidebar-text">
                    {metrics.nodeCount}
                  </span>
                </div>

                {/* 可见节点 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-sidebar-text-muted">视口内节点</span>
                  <span className="text-sm font-medium text-sidebar-text">
                    {metrics.visibleNodeCount}
                  </span>
                </div>

                {/* 边数量 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-sidebar-text-muted">连接数</span>
                  <span className="text-sm font-medium text-sidebar-text">
                    {metrics.edgeCount}
                  </span>
                </div>

                {/* 图规模 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-sidebar-text-muted">图规模</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      metrics.isLargeGraph
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-green-500/20 text-green-500'
                    }`}
                  >
                    {metrics.isLargeGraph ? '大' : '小'}
                  </span>
                </div>
              </div>

              {/* 优化建议 */}
              {recommendations.length > 0 && (
                <div className="border-t border-sidebar-border p-3 bg-yellow-500/5">
                  <div className="text-xs font-medium text-sidebar-text mb-2">
                    💡 优化建议
                  </div>
                  <ul className="space-y-1">
                    {recommendations.map((rec, index) => (
                      <li
                        key={index}
                        className="text-xs text-sidebar-text-muted leading-relaxed"
                      >
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 性能状态栏 */}
              <div className="px-3 py-2 bg-sidebar-bg/30 border-t border-sidebar-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sidebar-text-muted">虚拟化</span>
                  <span className="text-green-500 font-medium">已启用</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/**
 * 性能监控开关按钮
 */
export const PerformanceToggle: React.FC<{
  isOpen: boolean
  onToggle: () => void
}> = ({ isOpen, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="
        fixed bottom-4 left-4 z-40
        p-2 bg-sidebar-surface/90 backdrop-blur-md
        border border-sidebar-border rounded-lg
        hover:bg-sidebar-bg transition-colors
        shadow-lg
      "
      title={isOpen ? '隐藏性能监控' : '显示性能监控'}
    >
      <Activity className={`w-5 h-5 ${isOpen ? 'text-primary-500' : 'text-sidebar-text-muted'}`} />
    </button>
  )
}

export default PerformanceMonitor
