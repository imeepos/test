/**
 * 骨架屏组件
 * 用于内容加载时的占位显示，提升用户体验
 */

import React from 'react'
import { motion } from 'framer-motion'

export interface SkeletonProps {
  /**
   * 宽度
   */
  width?: string | number
  /**
   * 高度
   */
  height?: string | number
  /**
   * 形状
   */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  /**
   * 动画类型
   */
  animation?: 'pulse' | 'wave' | 'none'
  /**
   * 自定义类名
   */
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  variant = 'text',
  animation = 'pulse',
  className = ''
}) => {
  // 获取形状类名
  const getVariantClass = () => {
    switch (variant) {
      case 'text':
        return 'rounded'
      case 'circular':
        return 'rounded-full'
      case 'rectangular':
        return 'rounded-none'
      case 'rounded':
        return 'rounded-lg'
      default:
        return 'rounded'
    }
  }

  // 获取动画类名
  const getAnimationClass = () => {
    switch (animation) {
      case 'pulse':
        return 'animate-pulse-subtle'
      case 'wave':
        return 'animate-wave'
      case 'none':
        return ''
      default:
        return 'animate-pulse-subtle'
    }
  }

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height
  }

  return (
    <div
      className={`
        bg-sidebar-border/30
        ${getVariantClass()}
        ${getAnimationClass()}
        ${className}
      `}
      style={style}
      role="status"
      aria-label="加载中"
      aria-live="polite"
    >
      <span className="sr-only">加载中...</span>
    </div>
  )
}

// ============= 预设骨架屏组件 =============

/**
 * 节点骨架屏
 */
export const NodeSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`min-w-[200px] max-w-[300px] rounded-lg border-2 border-sidebar-border bg-canvas-node p-3 ${className}`}
      role="status"
      aria-label="节点加载中"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between mb-2">
        <Skeleton width="60%" height="1rem" />
        <Skeleton width="2rem" height="1rem" variant="rounded" />
      </div>

      {/* 内容 */}
      <div className="space-y-2 mb-3">
        <Skeleton width="100%" height="0.875rem" />
        <Skeleton width="90%" height="0.875rem" />
        <Skeleton width="80%" height="0.875rem" />
      </div>

      {/* 底部元信息 */}
      <div className="flex items-center justify-between pt-2 border-t border-sidebar-border">
        <Skeleton width="5rem" height="0.75rem" />
        <Skeleton width="3rem" height="0.75rem" />
      </div>
    </div>
  )
}

/**
 * 文本骨架屏
 */
export const TextSkeleton: React.FC<{
  lines?: number
  className?: string
}> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`} role="status" aria-label="文本加载中">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '60%' : '100%'}
          height="0.875rem"
        />
      ))}
    </div>
  )
}

/**
 * 列表骨架屏
 */
export const ListSkeleton: React.FC<{
  items?: number
  className?: string
}> = ({ items = 5, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="列表加载中">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3">
          <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
          <div className="flex-1 space-y-2">
            <Skeleton width="80%" height="1rem" />
            <Skeleton width="60%" height="0.75rem" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 卡片骨架屏
 */
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`rounded-lg border border-sidebar-border bg-sidebar-surface p-4 ${className}`}
      role="status"
      aria-label="卡片加载中"
    >
      {/* 头部图片 */}
      <Skeleton variant="rounded" width="100%" height="10rem" className="mb-3" />

      {/* 标题 */}
      <Skeleton width="70%" height="1.25rem" className="mb-2" />

      {/* 描述 */}
      <div className="space-y-2 mb-3">
        <Skeleton width="100%" height="0.875rem" />
        <Skeleton width="90%" height="0.875rem" />
        <Skeleton width="60%" height="0.875rem" />
      </div>

      {/* 底部按钮 */}
      <div className="flex items-center space-x-2">
        <Skeleton width="5rem" height="2rem" variant="rounded" />
        <Skeleton width="5rem" height="2rem" variant="rounded" />
      </div>
    </div>
  )
}

/**
 * 表格骨架屏
 */
export const TableSkeleton: React.FC<{
  rows?: number
  columns?: number
  className?: string
}> = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={className} role="status" aria-label="表格加载中">
      {/* 表头 */}
      <div className="flex items-center space-x-4 mb-3 pb-2 border-b border-sidebar-border">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} width="100%" height="1rem" />
        ))}
      </div>

      {/* 表格行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center space-x-4 mb-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} width="100%" height="0.875rem" />
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * 画布加载骨架屏
 */
export const CanvasSkeleton: React.FC<{ nodeCount?: number }> = ({ nodeCount = 3 }) => {
  return (
    <div className="w-full h-full bg-canvas-bg p-8" role="status" aria-label="画布加载中">
      <div className="grid grid-cols-3 gap-6">
        {Array.from({ length: nodeCount }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <NodeSkeleton />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default Skeleton
