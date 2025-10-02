/**
 * 项目初始化Hook
 * 处理应用启动时的项目加载和初始化逻辑
 */

import { useEffect, useState } from 'react'
import { useCanvasStore } from '@/stores/canvasStore'
import { useNodeStore } from '@/stores/nodeStore'
import { useSyncStore } from '@/stores/syncStore'
import { validateAPIConfig, logAPIConfig } from '@/config/api'

/**
 * 项目初始化Hook
 */
export function useProjectInit() {
  const currentProject = useCanvasStore((state) => state.currentProject)
  const loadProjects = useCanvasStore((state) => state.loadProjects)
  const isLoadingProject = useCanvasStore((state) => state.isLoadingProject)
  const projectError = useCanvasStore((state) => state.projectError)
  const syncFromBackend = useNodeStore((state) => state.syncFromBackend)
  const setCurrentProject = useNodeStore((state) => state.setCurrentProject)
  const checkOnlineStatus = useSyncStore((state) => state.checkOnlineStatus)
  const [isInitialized, setIsInitialized] = useState(false)

  /**
   * 应用启动时的初始化逻辑
   */
  useEffect(() => {
    let isMounted = true

    const initializeApp = async () => {
      console.log('🚀 Studio应用初始化中...')

      // 1. 验证API配置
      const isConfigValid = validateAPIConfig()
      if (!isConfigValid) {
        console.error('❌ API配置无效,请检查环境变量')
        return
      }

      // 打印API配置(开发环境)
      if (import.meta.env.DEV) {
        logAPIConfig()
      }

      // 2. 检查网络状态
      await checkOnlineStatus()

      // 3. 加载项目列表
      if (isMounted) {
        try {
          await loadProjects()
          console.log('✅ 项目列表加载成功')
        } catch (error) {
          console.error('❌ 加载项目列表失败:', error)
        }
      }

      // 4. 如果有保存的项目ID,尝试自动恢复
      const savedProjectId = localStorage.getItem('last_project_id')
      if (isMounted && savedProjectId) {
        // 如果当前没有项目或项目ID不匹配，则加载保存的项目
        if (!currentProject || currentProject.id !== savedProjectId) {
          try {
            console.log('🔄 自动恢复上次打开的项目:', savedProjectId)
            const { loadProject } = useCanvasStore.getState()
            await loadProject(savedProjectId)
            console.log('✅ 项目自动恢复成功')
          } catch (error) {
            console.error('❌ 恢复项目失败，可能项目已被删除:', error)
            // 清除无效的项目ID
            localStorage.removeItem('last_project_id')
          }
        } else {
          console.log('📌 使用已加载的项目:', currentProject.name)
        }
      }

      if (isMounted) {
        console.log('✅ Studio应用初始化完成')
        setIsInitialized(true)
      }
    }

    initializeApp()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在首次挂载时执行

  /**
   * 监听当前项目变化,保存项目ID
   */
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('last_project_id', currentProject.id)
      console.log('💾 当前项目ID已保存:', currentProject.id)
    } else {
      localStorage.removeItem('last_project_id')
    }
  }, [currentProject])

  /**
   * 监听当前项目变化,同步节点数据
   */
  useEffect(() => {
    const projectId = currentProject?.id
    if (!projectId) {
      return
    }

    const loadProjectData = async () => {
      try {
        console.log('🔄 同步项目数据:', projectId)
        setCurrentProject(projectId)
        await syncFromBackend(projectId)
        console.log('✅ 项目数据同步完成')
      } catch (error) {
        console.error('❌ 同步项目数据失败:', error)
      }
    }

    loadProjectData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProject?.id]) // 只在项目ID变化时执行

  /**
   * 监听网络状态
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 网络连接恢复')
      const { checkOnlineStatus } = useSyncStore.getState()
      checkOnlineStatus()
    }

    const handleOffline = () => {
      console.warn('⚠️ 网络连接丢失')
      const { checkOnlineStatus } = useSyncStore.getState()
      checkOnlineStatus()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isReady: isInitialized,
    isLoading: !isInitialized || isLoadingProject,
    error: projectError,
    currentProject,
  }
}
