import { useCallback } from 'react'

export interface ErrorReport {
  eventId: string
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
  userAgent: string
  url: string
  level: 'error' | 'warning' | 'info'
}

/**
 * 错误监控 Hook
 * 提供统一的错误上报接口
 */
export const useErrorMonitoring = () => {
  const reportError = useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    const eventId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const errorReport: ErrorReport = {
      eventId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack ?? undefined,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level: 'error',
    }

    // 控制台输出
    console.error('Error Report:', errorReport)

    // TODO: 集成错误监控服务 (Sentry, LogRocket, etc.)
    if (!import.meta.env.DEV) {
      // 生产环境发送到监控服务
      // sendToMonitoringService(errorReport)
    }

    return eventId
  }, [])

  return { reportError }
}
