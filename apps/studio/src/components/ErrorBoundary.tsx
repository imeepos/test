import React, { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react'
import { Button } from './ui/Button.js'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // 更新状态包含错误信息
    this.setState({
      error,
      errorInfo
    })

    // 调用用户提供的错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 这里可以添加错误上报逻辑
    this.reportError(error, errorInfo)
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    // 错误上报逻辑
    // 在实际项目中，这里可以发送错误信息到监控服务
    if (import.meta.env.DEV) {
      console.group('🐛 Error Report')
      console.error('Error:', error)
      console.error('Component Stack:', errorInfo.componentStack)
      console.error('Error Stack:', error.stack)
      console.groupEnd()
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    // 重置应用状态
    this.setState({ hasError: false })
    
    // 清理localStorage中的缓存数据
    try {
      localStorage.removeItem('canvas-storage')
      localStorage.removeItem('node-storage')
      localStorage.removeItem('ui-storage')
    } catch (error) {
      console.warn('清理缓存失败:', error)
    }
    
    // 重新加载页面
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误UI
      return (
        <div className="min-h-screen bg-canvas-bg flex items-center justify-center p-4">
          <motion.div
            className="max-w-md w-full bg-sidebar-surface border border-sidebar-border rounded-lg shadow-xl p-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* 错误图标 */}
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </div>

            {/* 错误标题 */}
            <h1 className="text-xl font-semibold text-sidebar-text text-center mb-2">
              出现了一些问题
            </h1>

            {/* 错误描述 */}
            <p className="text-sidebar-text-muted text-center mb-6">
              应用遇到了意外错误。我们已经记录了这个问题，请尝试以下解决方案：
            </p>

            {/* 错误信息（开发环境） */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6 p-3 bg-red-900/20 border border-red-500/20 rounded-md">
                <summary className="text-sm font-medium text-red-400 cursor-pointer">
                  技术详情 (开发模式)
                </summary>
                <div className="mt-2 text-xs text-red-300 font-mono">
                  <p><strong>错误:</strong> {this.state.error.message}</p>
                  {this.state.error.stack && (
                    <pre className="mt-2 overflow-auto max-h-32 text-xs">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* 操作按钮 */}
            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                icon={RefreshCw}
                onClick={this.handleRetry}
              >
                重试
              </Button>

              <Button
                variant="secondary"
                fullWidth
                icon={RefreshCw}
                onClick={this.handleReload}
              >
                刷新页面
              </Button>

              <Button
                variant="secondary"
                fullWidth
                icon={Home}
                onClick={this.handleGoHome}
              >
                重置应用
              </Button>

              {/* 报告问题链接 */}
              <div className="text-center pt-4 border-t border-sidebar-border">
                <button
                  onClick={() => {
                    const subject = encodeURIComponent('SKER Studio 错误报告')
                    const body = encodeURIComponent(`
错误信息: ${this.state.error?.message || '未知错误'}
错误堆栈: ${this.state.error?.stack || '无'}
用户代理: ${navigator.userAgent}
时间: ${new Date().toISOString()}

请描述您遇到错误时的操作步骤：
1. 
2. 
3. 
                    `.trim())
                    
                    window.open(`mailto:support@sker.ai?subject=${subject}&body=${body}`)
                  }}
                  className="text-sm text-sidebar-text-muted hover:text-sidebar-text transition-colors flex items-center gap-2 mx-auto"
                >
                  <Bug className="h-4 w-4" />
                  报告此问题
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary