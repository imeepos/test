import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Result, Button } from 'antd'
import { logErrorBoundary } from '@/utils/error'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误到日志系统
    logErrorBoundary(error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // 调用自定义错误处理
    this.props.onError?.(error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误页面
      return (
        <div className="flex items-center justify-center min-h-screen p-8">
          <Result
            status="error"
            title="应用程序错误"
            subTitle="抱歉，应用程序遇到了一个错误。请尝试刷新页面或返回首页。"
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReload}>
                刷新页面
              </Button>,
              <Button key="home" onClick={this.handleGoHome}>
                返回首页
              </Button>,
            ]}
          >
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left max-w-3xl">
                <h4 className="font-semibold text-red-600 mb-2">错误详情 (仅开发环境)：</h4>
                <div className="space-y-2">
                  <div>
                    <strong>错误消息:</strong>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap mt-1">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>堆栈跟踪:</strong>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap mt-1 max-h-60 overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>组件堆栈:</strong>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap mt-1 max-h-40 overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Result>
        </div>
      )
    }

    return this.props.children
  }
}