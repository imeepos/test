import React from 'react'
import { CanvasPage } from '@/pages/CanvasPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { ToastContainer } from '@/components/ui'
import { ProjectSelector } from '@/components/project/ProjectSelector'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useUIStore, useAIStore, useCanvasStore, useAuthStore } from '@/stores'
import { initializeServices, cleanupServices } from '@/services'
import { useProjectInit } from '@/hooks/useProjectInit'

function App() {
  const { theme } = useUIStore()
  const { initializeWebSocket } = useAIStore()
  const { currentProject } = useCanvasStore()
  const { status: authStatus, initialize: initializeAuth } = useAuthStore()

  // 页面状态：'login' | 'register' | 'forgot-password' | 'app'
  const [page, setPage] = React.useState<'login' | 'register' | 'forgot-password' | 'app'>('login')

  // 初始化项目系统
  const { isReady, isLoading, error: projectError } = useProjectInit()

  // 初始化主题
  React.useEffect(() => {
    // 应用主题到HTML根元素
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      // 跟随系统主题
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
      
      // 监听系统主题变化
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark')
        root.classList.add(e.matches ? 'dark' : 'light')
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  // 全局错误边界
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('全局错误:', event.error)
      // 这里可以添加错误上报逻辑
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('未处理的Promise拒绝:', event.reason)
      // 这里可以添加错误上报逻辑
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // 初始化认证状态（仅在首次加载时）
  React.useEffect(() => {
    initializeAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 根据认证状态决定显示的页面
  React.useEffect(() => {
    if (authStatus === 'authenticated') {
      setPage('app')
    } else if (authStatus === 'unauthenticated') {
      setPage('login')
    }
  }, [authStatus])

  // 初始化服务（仅在认证成功后）
  React.useEffect(() => {
    if (authStatus !== 'authenticated') return

    let cleanup: (() => void) | undefined

    const init = async () => {
      try {
        // 初始化基础服务
        await initializeServices()
        console.log('✅ 基础服务初始化完成')

        // 初始化WebSocket服务
        const result = await initializeWebSocket()
        if (typeof result === 'function') {
          cleanup = result
        }
        console.log('✅ WebSocket服务初始化完成')

      } catch (error) {
        console.warn('⚠️ 服务初始化部分失败:', error)
        // 不阻止应用启动，允许在部分服务不可用的情况下继续运行
      }
    }

    init()

    // 清理函数
    return () => {
      if (cleanup) {
        cleanup()
      }
      cleanupServices()
    }
  }, [authStatus, initializeWebSocket])

  // 开发环境调试信息
  React.useEffect(() => {
    if (import.meta.env.DEV && authStatus === 'authenticated') {
      console.log('🚀 SKER Studio 开发模式已启动')
      console.log('📋 可用的全局快捷键:')
      console.log('  • Ctrl + F: 聚焦搜索')
      console.log('  • Ctrl + S: 保存（自动保存已启用）')
      console.log('  • Ctrl + Z: 撤销（开发中）')
      console.log('  • Ctrl + Shift + Z: 重做（开发中）')
      console.log('  • Tab: 切换视图模式')
      console.log('  • F11: 全屏切换')
    }
  }, [authStatus])

  // 显示认证加载状态
  if (authStatus === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-canvas-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <div className="text-sidebar-text">正在验证身份...</div>
        </div>
      </div>
    )
  }

  // 显示登录页面
  if (page === 'login') {
    return (
      <ErrorBoundary>
        <LoginPage
          onSwitchToRegister={() => setPage('register')}
          onForgotPassword={() => setPage('forgot-password')}
        />
        <ToastContainer />
      </ErrorBoundary>
    )
  }

  // 显示注册页面
  if (page === 'register') {
    return (
      <ErrorBoundary>
        <RegisterPage onSwitchToLogin={() => setPage('login')} />
        <ToastContainer />
      </ErrorBoundary>
    )
  }

  // 显示忘记密码页面
  if (page === 'forgot-password') {
    return (
      <ErrorBoundary>
        <ForgotPasswordPage
          onBack={() => setPage('login')}
          onResetSuccess={() => setPage('login')}
        />
        <ToastContainer />
      </ErrorBoundary>
    )
  }

  // 以下是已认证用户的应用主体

  // 显示项目初始化错误
  if (projectError) {
    return (
      <div className="h-screen flex items-center justify-center bg-canvas-bg">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">项目初始化失败</div>
          <div className="text-sidebar-text-muted">{projectError}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  // 显示项目选择器(如果没有当前项目)
  if (isReady && !currentProject) {
    return (
      <ErrorBoundary
        onError={(error: Error, errorInfo: React.ErrorInfo) => {
          console.error('应用错误:', error)
          console.error('错误信息:', errorInfo)
          if (!import.meta.env.DEV) {
            // 例如: sendErrorToMonitoring(error, errorInfo)
          }
        }}
      >
        <div className="App">
          <ProjectSelector />
          <ToastContainer />
        </div>
      </ErrorBoundary>
    )
  }

  // 显示加载状态
  if (isLoading || !isReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-canvas-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <div className="text-sidebar-text">正在初始化项目系统...</div>
        </div>
      </div>
    )
  }

  // 显示主应用(有当前项目)
  return (
    <ErrorBoundary
      onError={(error: Error, errorInfo: React.ErrorInfo) => {
        // 记录错误到控制台
        console.error('应用错误:', error)
        console.error('错误信息:', errorInfo)

        // 在生产环境中，这里可以发送错误到监控服务
        if (!import.meta.env.DEV) {
          // 例如: sendErrorToMonitoring(error, errorInfo)
        }
      }}
    >
      <div className="App">
        <CanvasPage />
        <ToastContainer />
      </div>
    </ErrorBoundary>
  )
}

export default App