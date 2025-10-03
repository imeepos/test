import React from 'react'
import { Loading } from '@/components/ui/Loading'
import { cn } from '@/utils'

interface LoadingPageProps {
  message?: string
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars' | 'ai'
  className?: string
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  message = '加载中...',
  variant = 'spinner',
  className,
}) => {
  return (
    <div className={cn('h-screen flex items-center justify-center bg-canvas-bg', className)}>
      <div className="text-center">
        <Loading size="lg" variant={variant} color="primary" />
        <div className="mt-4 text-sidebar-text">{message}</div>
      </div>
    </div>
  )
}
