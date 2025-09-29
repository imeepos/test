import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Star, Zap, Hash } from 'lucide-react'
import { useNodeStore } from '@/stores'

const CanvasStats: React.FC = () => {
  const { getNodeStats, getNodes } = useNodeStore()

  // 获取实时统计数据
  const stats = React.useMemo(() => {
    return getNodeStats()
  }, [getNodeStats, getNodes()]) // 依赖节点变化重新计算

  // 格式化百分比
  const formatPercentage = (value: number) => {
    return Math.round(value * 100)
  }

  // 获取主要重要性等级
  const getPrimaryImportance = () => {
    const { byImportance } = stats
    let maxCount = 0
    let primaryLevel = 3

    Object.entries(byImportance).forEach(([level, count]) => {
      if (count > maxCount) {
        maxCount = count
        primaryLevel = parseInt(level)
      }
    })

    return primaryLevel
  }

  const primaryImportance = getPrimaryImportance()

  return (
    <div className="space-y-4">
      {/* 基础统计卡片 */}
      <div className="grid grid-cols-1 gap-3">
        {/* 总组件数 */}
        <motion.div
          className="flex items-center gap-3 p-3 bg-sidebar-surface rounded-lg border border-sidebar-border"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex-shrink-0">
            <Hash className="h-5 w-5 text-sidebar-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-text">
              {stats.total} 个组件
            </p>
            <p className="text-xs text-sidebar-text-muted">
              总计创建
            </p>
          </div>
        </motion.div>

        {/* 平均重要性 */}
        <motion.div
          className="flex items-center gap-3 p-3 bg-sidebar-surface rounded-lg border border-sidebar-border"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex-shrink-0">
            <Star className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < primaryImportance
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-sidebar-text-muted">
              主要重要性
            </p>
          </div>
        </motion.div>

        {/* 平均置信度 */}
        <motion.div
          className="flex items-center gap-3 p-3 bg-sidebar-surface rounded-lg border border-sidebar-border"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex-shrink-0">
            <Zap className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-text">
              {formatPercentage(stats.averageConfidence)}%
            </p>
            <p className="text-xs text-sidebar-text-muted">
              平均置信度
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-12 h-2 bg-sidebar-border rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 transition-all duration-500"
                style={{ width: `${formatPercentage(stats.averageConfidence)}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* 状态分布 */}
      {stats.total > 0 && (
        <div className="p-3 bg-sidebar-surface rounded-lg border border-sidebar-border">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-sidebar-text" />
            <span className="text-sm font-medium text-sidebar-text">状态分布</span>
          </div>
          
          <div className="space-y-2">
            {Object.entries(stats.byStatus).map(([status, count]) => {
              const percentage = (count / stats.total) * 100
              const statusColors = {
                idle: 'bg-gray-500',
                processing: 'bg-blue-500',
                completed: 'bg-green-500',
                error: 'bg-red-500',
              }
              
              const statusLabels = {
                idle: '待处理',
                processing: '处理中',
                completed: '已完成',
                error: '错误',
              }

              return (
                <div key={status} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div 
                      className={`w-2 h-2 rounded-full ${statusColors[status as keyof typeof statusColors]}`} 
                    />
                    <span className="text-xs text-sidebar-text-muted truncate">
                      {statusLabels[status as keyof typeof statusLabels]}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-sidebar-text">
                    {count}
                  </span>
                  <span className="text-xs text-sidebar-text-muted w-10 text-right">
                    {Math.round(percentage)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {stats.total === 0 && (
        <div className="text-center p-6 text-sidebar-text-muted">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无组件</p>
          <p className="text-xs mt-1">双击画布创建第一个组件</p>
        </div>
      )}
    </div>
  )
}

export { CanvasStats }