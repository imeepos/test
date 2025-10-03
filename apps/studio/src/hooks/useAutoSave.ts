/**
 * 自动保存Hook
 * 监听画布和节点变更,定时自动保存到后端
 */

import { useEffect, useRef, useCallback } from 'react'
import { useCanvasStore } from '@/stores/canvasStore'
import { useNodeStore } from '@/stores/nodeStore'
import { useSyncStore } from '@/stores/syncStore'

/**
 * 自动保存配置
 */
export interface AutoSaveConfig {
  /** 自动保存间隔(毫秒) */
  interval?: number
  /** 是否启用自动保存 */
  enabled?: boolean
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<AutoSaveConfig> = {
  interval: 30000, // 30秒
  enabled: true,
}

/**
 * 自动保存Hook
 */
export function useAutoSave(config: AutoSaveConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const { currentProject, saveCanvasState } = useCanvasStore()
  const { startSaving, savingComplete, savingFailed } = useSyncStore()

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)

  /**
   * 执行保存
   */
  const performSave = useCallback(async () => {
    if (!currentProject || !finalConfig.enabled || isSavingRef.current) {
      return
    }

    isSavingRef.current = true
    startSaving()

    try {
      await saveCanvasState()
      savingComplete()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '自动保存失败'
      savingFailed(errorMessage)
      console.error('❌ 自动保存失败:', error)
    } finally {
      isSavingRef.current = false
    }
  }, [currentProject, finalConfig.enabled, saveCanvasState, startSaving, savingComplete, savingFailed])

  /**
   * 设置定时自动保存
   */
  useEffect(() => {
    if (!currentProject || !finalConfig.enabled) {
      return
    }

    // 清除现有计时器
    if (saveTimerRef.current) {
      clearInterval(saveTimerRef.current)
    }

    // 设置定时保存
    saveTimerRef.current = setInterval(() => {
      performSave()
    }, finalConfig.interval)

    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current)
      }
    }
  }, [currentProject, finalConfig.enabled, finalConfig.interval, performSave])

  /**
   * 清理函数
   */
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current)
      }
    }
  }, [])

  /**
   * 返回手动保存方法和状态
   */
  return {
    /** 手动触发保存 */
    save: performSave,
    /** 是否正在保存 */
    isSaving: isSavingRef.current,
    /** 是否启用自动保存 */
    enabled: finalConfig.enabled,
  }
}

/**
 * 简化版自动保存Hook
 * 使用默认配置
 */
export function useSimpleAutoSave() {
  return useAutoSave()
}
