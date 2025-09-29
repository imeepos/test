import React, { Component, ReactNode, ErrorInfo } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui'

interface Props {
  children: ReactNode
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
  level?: 'page' | 'section' | 'component'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  eventId: string | null
}

class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      eventId: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // 生成错误事件ID
    const eventId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    this.setState({
      error,
      errorInfo,
      eventId,
    })

    // 调用自定义错误处理函数
    this.props.onError?.(error, errorInfo)

    // 可以在这里集成错误报告服务
    this.reportError(error, errorInfo, eventId)
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props
    const { hasError } = this.state

    const hasResetKeys = resetKeys && resetKeys.length > 0
    const prevResetKeys = prevProps.resetKeys || []

    // 检查是否应该重置错误状态
    if (
      hasError &&
      (resetOnPropsChange || hasResetKeys) &&
      (resetOnPropsChange || resetKeys!.some((key, index) => key !== prevResetKeys[index]))
    ) {
      this.resetErrorBoundary()
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    })
  }

  reportError = (error: Error, errorInfo: ErrorInfo, eventId: string) => {
    // 这里可以集成到错误监控服务，如Sentry, LogRocket等
    const errorReport = {
      eventId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    // 发送错误报告（示例）
    console.error('Error Report:', errorReport)

    // TODO: 集成实际的错误报告服务
    // await fetch('/api/error-report', {
    //   method: 'POST',
    //   body: JSON.stringify(errorReport)
    // })
  }

  copyErrorDetails = async () => {
    const { error, errorInfo, eventId } = this.state

    const errorDetails = `
错误详情 (${eventId}):
时间: ${new Date().toLocaleString()}
消息: ${error?.message || '未知错误'}
页面: ${window.location.href}

技术栈信息:
${error?.stack || '无堆栈信息'}

组件栈信息:
${errorInfo?.componentStack || '无组件栈信息'}
    `.trim()

    try {
      await navigator.clipboard.writeText(errorDetails)
      console.log('错误详情已复制到剪贴板')
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  reload = () => {
    window.location.reload()
  }

  goHome = () => {
    window.location.href = '/'
  }

  reportIssue = () => {
    const { error } = this.state
    const title = encodeURIComponent(`错误报告: ${error?.message || '未知错误'}`)
    const body = encodeURIComponent(`
请描述您遇到的问题：
[请在此描述问题的详细情况]

错误信息：
${error?.message || '未知错误'}

发生时间：${new Date().toLocaleString()}
页面地址：${window.location.href}
    `)

    // 这里应该替换为实际的问题报告地址
    const issueUrl = `https://github.com/your-repo/issues/new?title=${title}&body=${body}`
    window.open(issueUrl, '_blank')
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.state.errorInfo!)
      }

      return <ErrorFallback
        error={this.state.error!}
        errorInfo={this.state.errorInfo!}
        eventId={this.state.eventId!}
        level={this.props.level || 'component'}
        onReset={this.resetErrorBoundary}
        onReload={this.reload}
        onGoHome={this.goHome}
        onCopyDetails={this.copyErrorDetails}
        onReportIssue={this.reportIssue}
      />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error
  errorInfo: ErrorInfo
  eventId: string
  level: 'page' | 'section' | 'component'
  onReset: () => void
  onReload: () => void
  onGoHome: () => void
  onCopyDetails: () => void
  onReportIssue: () => void
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  eventId,
  level,
  onReset,
  onReload,
  onGoHome,
  onCopyDetails,
  onReportIssue,
}) => {
  const [showDetails, setShowDetails] = React.useState(false)

  const levelConfig = {
    page: {
      title: '页面加载失败',
      description: '很抱歉，页面遇到了一些问题。请尝试刷新页面或返回首页。',
      bgColor: 'bg-gradient-to-br from-red-900/20 to-orange-900/20',
      iconSize: 'h-16 w-16',
      showHomeButton: true,
    },
    section: {
      title: '区域加载失败',
      description: '这个区域遇到了问题，但不影响其他功能的使用。',
      bgColor: 'bg-gradient-to-br from-yellow-900/20 to-orange-900/20',
      iconSize: 'h-12 w-12',
      showHomeButton: false,
    },
    component: {
      title: '组件错误',
      description: '某个组件出现了问题，请尝试重新加载。',
      bgColor: 'bg-gradient-to-br from-gray-900/20 to-gray-800/20',
      iconSize: 'h-8 w-8',
      showHomeButton: false,
    },
  }

  const config = levelConfig[level]

  return (
    <div className={`
      min-h-[200px] flex flex-col items-center justify-center p-8
      border-2 border-dashed border-red-300/30 rounded-lg
      ${config.bgColor}
    `}>
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <AlertTriangle className={`${config.iconSize} text-red-400 mx-auto mb-4`} />

        <h2 className="text-xl font-semibold text-red-100 mb-2">
          {config.title}
        </h2>

        <p className="text-red-200/80 mb-6">
          {config.description}
        </p>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-3 justify-center mb-4">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={onReset}
            className="text-red-100 border-red-400/30 hover:bg-red-400/10"
          >
            重试
          </Button>

          {level === 'page' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReload}
              className="text-red-100 border-red-400/30 hover:bg-red-400/10"
            >
              刷新页面
            </Button>
          )}

          {config.showHomeButton && (
            <Button
              variant="outline"
              size="sm"
              icon={Home}
              onClick={onGoHome}
              className="text-red-100 border-red-400/30 hover:bg-red-400/10"
            >
              返回首页
            </Button>
          )}
        </div>

        {/* 高级选项 */}
        <div className="text-center">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-red-300 hover:text-red-200 underline"
          >
            {showDetails ? '隐藏' : '显示'}技术详情
          </button>
        </div>

        {/* 技术详情 */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-gray-900/50 rounded-lg text-left"
          >
            <div className="mb-4">
              <h4 className="text-sm font-medium text-red-200 mb-2">错误信息</h4>
              <p className="text-xs text-red-300 font-mono break-all">
                {error.message}
              </p>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-red-200 mb-2">
                错误ID: {eventId}
              </h4>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onCopyDetails}
                className="text-xs px-2 py-1 bg-red-800/30 text-red-200 rounded hover:bg-red-800/50 flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                复制详情
              </button>

              <button
                onClick={onReportIssue}
                className="text-xs px-2 py-1 bg-red-800/30 text-red-200 rounded hover:bg-red-800/50 flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                报告问题
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

// 便捷的HOC
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// React Hook版本
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

export default ErrorBoundary
export { ErrorFallback }