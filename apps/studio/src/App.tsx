import React from 'react'
import { CanvasPage } from '@/pages/CanvasPage'
import { ToastContainer } from '@/components/ui'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useUIStore, useAIStore } from '@/stores'
import { initializeServices, cleanupServices } from '@/services'

function App() {
  const { theme, setTheme } = useUIStore()
  const { initializeWebSocket } = useAIStore()

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

  // 初始化服务
  React.useEffect(() => {
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
  }, [initializeWebSocket])

  // 开发环境调试信息
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🚀 SKER Studio 开发模式已启动')
      console.log('📋 可用的全局快捷键:')
      console.log('  • Ctrl + F: 聚焦搜索')
      console.log('  • Ctrl + S: 保存（自动保存已启用）')
      console.log('  • Ctrl + Z: 撤销（开发中）')
      console.log('  • Ctrl + Shift + Z: 重做（开发中）')
      console.log('  • Tab: 切换视图模式')
      console.log('  • F11: 全屏切换')
    }
  }, [])

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
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