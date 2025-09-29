import React from 'react'
import ErrorBoundary from './ErrorBoundary'
import { useUIStore } from '@/stores'

interface GlobalErrorHandlerProps {
  children: React.ReactNode
}

// 全局错误处理器
export const GlobalErrorHandler: React.FC<GlobalErrorHandlerProps> = ({ children }) => {
  const { addToast } = useUIStore()

  // 处理未捕获的Promise拒绝
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)

      addToast({
        type: 'error',
        title: '操作失败',
        message: event.reason?.message || '发生了意外错误，请稍后重试',
        persistent: true,
        actions: [
          {
            label: '刷新页面',
            onClick: () => window.location.reload(),
            variant: 'primary'
          }
        ]
      })

      // 阻止浏览器默认错误处理
      event.preventDefault()
    }

    // 处理运行时错误
    const handleError = (event: ErrorEvent) => {
      console.error('Runtime error:', event.error)

      // 如果是网络错误或资源加载错误，不显示Toast
      if (event.message.includes('Script error') || event.message.includes('Loading')) {
        return
      }

      addToast({
        type: 'error',
        title: '运行时错误',
        message: '页面遇到了一些问题，建议刷新页面',
        persistent: true,
        actions: [
          {
            label: '刷新页面',
            onClick: () => window.location.reload(),
            variant: 'primary'
          }
        ]
      })
    }

    // 添加事件监听器
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [addToast])

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // 严重错误时显示Toast通知
    addToast({
      type: 'error',
      title: '应用错误',
      message: '应用遇到了严重错误，请尝试刷新页面',
      persistent: true,
      copyable: true,
      actions: [
        {
          label: '刷新页面',
          onClick: () => window.location.reload(),
          variant: 'primary'
        },
        {
          label: '报告问题',
          onClick: () => {
            const title = encodeURIComponent(`应用错误: ${error.message}`)
            const body = encodeURIComponent(`
错误详情：
${error.message}

堆栈信息：
${error.stack}

组件堆栈：
${errorInfo.componentStack}

时间：${new Date().toISOString()}
URL：${window.location.href}
User Agent：${navigator.userAgent}
            `)
            window.open(`https://github.com/your-repo/issues/new?title=${title}&body=${body}`, '_blank')
          }
        }
      ]
    })
  }

  return (
    <ErrorBoundary
      level="page"
      onError={handleError}
      resetKeys={[window.location.pathname]} // 路由变化时重置错误状态
    >
      {children}
    </ErrorBoundary>
  )
}

// 异步组件的错误边界包装器
export const AsyncErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      level="section"
      fallback={(error) => (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-sidebar-text mb-2">
            组件加载失败
          </h3>
          <p className="text-sidebar-text-muted mb-4">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-sidebar-accent text-white rounded hover:bg-sidebar-accent/80"
          >
            重新加载
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

// AI服务调用的错误边界
export const AIErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useUIStore()

  const handleError = (error: Error) => {
    // AI相关错误的特殊处理
    if (error.message.includes('AI') || error.message.includes('generate')) {
      addToast({
        type: 'warning',
        title: 'AI服务暂时不可用',
        message: '请稍后重试，或手动输入内容',
        actions: [
          {
            label: '重试',
            onClick: () => window.location.reload()
          }
        ]
      })
    }
  }

  return (
    <ErrorBoundary
      level="component"
      onError={handleError}
      fallback={(error) => (
        <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-yellow-300/30 rounded-lg bg-yellow-900/10">
          <div className="text-3xl mb-3">🤖</div>
          <h4 className="text-sm font-medium text-yellow-200 mb-2">
            AI功能暂时不可用
          </h4>
          <p className="text-xs text-yellow-300/80 mb-3">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            重试
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export default GlobalErrorHandler