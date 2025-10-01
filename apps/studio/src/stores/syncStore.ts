/**
 * 同步状态管理Store
 * 跟踪保存状态、错误、冲突解决
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * 同步状态类型
 */
export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * 同步错误类型
 */
export interface SyncError {
  message: string
  timestamp: Date
  operation?: string
  details?: any
}

/**
 * 同步冲突类型
 */
export interface SyncConflict {
  id: string
  type: 'node' | 'project' | 'connection'
  localData: any
  remoteData: any
  timestamp: Date
}

/**
 * 同步Store状态
 */
export interface SyncState {
  // 同步状态
  status: SyncStatus
  lastSavedAt: Date | null
  savingProgress: number // 0-100

  // 错误管理
  errors: SyncError[]
  currentError: SyncError | null

  // 冲突管理
  conflicts: SyncConflict[]
  hasConflicts: boolean

  // 网络状态
  isOnline: boolean
  lastOnlineCheck: Date | null

  // Actions
  startSaving: () => void
  savingComplete: () => void
  savingFailed: (message: string, details?: any) => void
  clearError: () => void
  clearAllErrors: () => void

  // 冲突解决
  addConflict: (conflict: SyncConflict) => void
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merge') => void
  clearConflicts: () => void

  // 网络状态
  setOnlineStatus: (isOnline: boolean) => void
  checkOnlineStatus: () => Promise<void>

  // 重试
  retrySync: () => Promise<void>
}

/**
 * 同步状态Store
 */
export const useSyncStore = create<SyncState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      status: 'idle',
      lastSavedAt: null,
      savingProgress: 0,
      errors: [],
      currentError: null,
      conflicts: [],
      hasConflicts: false,
      isOnline: true,
      lastOnlineCheck: null,

      // 保存状态Actions
      startSaving: () => {
        set({
          status: 'saving',
          savingProgress: 0,
          currentError: null,
        })
      },

      savingComplete: () => {
        set({
          status: 'saved',
          lastSavedAt: new Date(),
          savingProgress: 100,
          currentError: null,
        })

        // 2秒后重置为idle状态
        setTimeout(() => {
          if (get().status === 'saved') {
            set({ status: 'idle', savingProgress: 0 })
          }
        }, 2000)
      },

      savingFailed: (message, details) => {
        const error: SyncError = {
          message,
          timestamp: new Date(),
          operation: 'save',
          details,
        }

        set((state) => ({
          status: 'error',
          currentError: error,
          errors: [...state.errors, error],
          savingProgress: 0,
        }))

        console.error('💥 保存失败:', message, details)
      },

      clearError: () => {
        set({
          currentError: null,
          status: 'idle',
        })
      },

      clearAllErrors: () => {
        set({
          errors: [],
          currentError: null,
          status: 'idle',
        })
      },

      // 冲突管理Actions
      addConflict: (conflict) => {
        set((state) => ({
          conflicts: [...state.conflicts, conflict],
          hasConflicts: true,
        }))

        console.warn('⚠️ 发现同步冲突:', conflict)
      },

      resolveConflict: (conflictId, resolution) => {
        set((state) => {
          const remainingConflicts = state.conflicts.filter((c) => c.id !== conflictId)

          return {
            conflicts: remainingConflicts,
            hasConflicts: remainingConflicts.length > 0,
          }
        })

        console.log(`✅ 冲突已解决: ${conflictId} (${resolution})`)
      },

      clearConflicts: () => {
        set({
          conflicts: [],
          hasConflicts: false,
        })
      },

      // 网络状态Actions
      setOnlineStatus: (isOnline) => {
        set({
          isOnline,
          lastOnlineCheck: new Date(),
        })

        if (!isOnline) {
          console.warn('⚠️ 网络连接丢失')
        } else {
          console.log('✅ 网络连接恢复')
        }
      },

      checkOnlineStatus: async () => {
        try {
          // 尝试ping API健康检查端点
          const response = await fetch('/health', { method: 'HEAD' })
          const isOnline = response.ok

          set({
            isOnline,
            lastOnlineCheck: new Date(),
          })
        } catch {
          set({
            isOnline: false,
            lastOnlineCheck: new Date(),
          })
        }
      },

      // 重试同步
      retrySync: async () => {
        const { currentError } = get()

        if (!currentError) {
          console.warn('没有需要重试的操作')
          return
        }

        console.log('🔄 重试同步...')

        // 这里可以根据错误类型执行不同的重试逻辑
        // 当前只是清除错误状态,实际重试逻辑需要在调用处实现
        set({
          currentError: null,
          status: 'idle',
        })
      },
    }),
    {
      name: 'sync-store',
    }
  )
)

/**
 * 导出同步状态选择器
 */
export const selectIsSaving = (state: SyncState) => state.status === 'saving'
export const selectHasError = (state: SyncState) => state.status === 'error'
export const selectHasConflicts = (state: SyncState) => state.hasConflicts
export const selectIsOnline = (state: SyncState) => state.isOnline
