import { useEffect, useRef } from 'react'
import { useAuthStore, useAIStore } from '@/stores'
import { initializeServices, cleanupServices } from '@/services'

/**
 * 应用初始化 Hook
 * 统一管理所有服务的初始化和清理
 */
export const useAppInitialization = () => {
  const authStatus = useAuthStore((state) => state.status)
  const initializeAuth = useAuthStore((state) => state.initialize)
  const initializeWebSocket = useAIStore((state) => state.initializeWebSocket)

  const isInitializedRef = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  // 初始化认证（仅首次）
  useEffect(() => {
    if (!isInitializedRef.current) {
      initializeAuth()
      isInitializedRef.current = true
    }
  }, [initializeAuth])

  // 初始化服务（仅在认证成功后）
  useEffect(() => {
    if (authStatus !== 'authenticated') return

    const init = async () => {
      try {
        // 初始化基础服务
        await initializeServices()
        console.log('✅ 基础服务初始化完成')

        // 初始化WebSocket服务
        const wsCleanup = await initializeWebSocket()
        if (typeof wsCleanup === 'function') {
          cleanupRef.current = wsCleanup
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
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      cleanupServices()
    }
  }, [authStatus, initializeWebSocket])
}
