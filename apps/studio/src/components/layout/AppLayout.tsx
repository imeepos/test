import React from 'react'
import { Outlet } from 'react-router-dom'
import { ToastContainer } from '@/components/ui'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useErrorMonitoring } from '@/hooks/useErrorMonitoring'
import { cn } from '@/utils'

interface AppLayoutProps {
  className?: string
}

/**
 * 应用主布局
 * 统一管理 Toast、ErrorBoundary 等全局组件
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ className }) => {
  const { reportError } = useErrorMonitoring()

  return (
    <ErrorBoundary
      level="page"
      onError={(error, errorInfo) => {
        reportError(error, errorInfo)
      }}
    >
      <div className={cn('App', className)}>
        <Outlet />
        <ToastContainer />
      </div>
    </ErrorBoundary>
  )
}
