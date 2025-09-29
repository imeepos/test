import React from 'react'
import { motion } from 'framer-motion'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'white'
  className?: string
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-[3px]',
  }

  const colors = {
    primary: 'border-sidebar-accent border-t-transparent',
    secondary: 'border-sidebar-text-muted border-t-transparent',
    white: 'border-white border-t-transparent',
  }

  return (
    <motion.div
      className={`
        inline-block rounded-full animate-spin
        ${sizes[size]}
        ${colors[color]}
        ${className}
      `}
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  )
}

// 加载状态组件
export interface LoadingProps {
  loading: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  size?: SpinnerProps['size']
  overlay?: boolean
}

const Loading: React.FC<LoadingProps> = ({
  loading,
  children,
  fallback,
  size = 'md',
  overlay = false,
}) => {
  if (!loading) {
    return <>{children}</>
  }

  const spinner = fallback || <Spinner size={size} />

  if (overlay) {
    return (
      <div className="relative">
        {children}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-sidebar-bg/50 backdrop-blur-sm rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {spinner}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinner}
    </div>
  )
}

// 全屏加载组件
const FullScreenLoading: React.FC<{ loading: boolean }> = ({ loading }) => {
  if (!loading) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-sidebar-bg/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sidebar-text-muted">加载中...</p>
      </div>
    </motion.div>
  )
}

export { Spinner, Loading, FullScreenLoading }