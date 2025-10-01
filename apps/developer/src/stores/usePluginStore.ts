/**
 * 插件状态管理
 * 管理插件列表和已安装插件
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Plugin } from '@/types'
import { PluginService, type SearchPluginParams } from '@/services'

interface PluginState {
  // 状态
  plugins: Plugin[]
  installedPlugins: string[] // 已安装插件的 ID 列表
  currentPlugin: Plugin | null
  isLoading: boolean
  error: string | null
  total: number

  // Actions
  fetchPlugins: (params?: any) => Promise<void>
  searchPlugins: (params: SearchPluginParams) => Promise<void>
  fetchPlugin: (id: string) => Promise<void>
  installPlugin: (id: string) => Promise<void>
  uninstallPlugin: (id: string) => Promise<void>
  setCurrentPlugin: (plugin: Plugin | null) => void
  clearError: () => void
}

export const usePluginStore = create<PluginState>()(
  persist(
    (set, get) => ({
      // 初始状态
      plugins: [],
      installedPlugins: [],
      currentPlugin: null,
      isLoading: false,
      error: null,
      total: 0,

      // 获取插件列表
      fetchPlugins: async (params?: any) => {
        set({ isLoading: true, error: null })
        try {
          const response = await PluginService.getPlugins(params)
          set({
            plugins: response.data,
            total: response.total,
            isLoading: false,
          })
        } catch (error: any) {
          set({
            error: error.response?.data?.message || '获取插件列表失败',
            isLoading: false,
          })
          throw error
        }
      },

      // 搜索插件
      searchPlugins: async (params: SearchPluginParams) => {
        set({ isLoading: true, error: null })
        try {
          const response = await PluginService.searchPlugins(params)
          set({
            plugins: response.data,
            total: response.total,
            isLoading: false,
          })
        } catch (error: any) {
          set({
            error: error.response?.data?.message || '搜索插件失败',
            isLoading: false,
          })
          throw error
        }
      },

      // 获取单个插件
      fetchPlugin: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          const plugin = await PluginService.getPlugin(id)
          set({
            currentPlugin: plugin,
            isLoading: false,
          })
        } catch (error: any) {
          set({
            error: error.response?.data?.message || '获取插件失败',
            isLoading: false,
          })
          throw error
        }
      },

      // 安装插件
      installPlugin: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          await PluginService.installPlugin(id)
          set((state) => ({
            installedPlugins: [...state.installedPlugins, id],
            isLoading: false,
          }))
        } catch (error: any) {
          set({
            error: error.response?.data?.message || '安装插件失败',
            isLoading: false,
          })
          throw error
        }
      },

      // 卸载插件
      uninstallPlugin: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          await PluginService.uninstallPlugin(id)
          set((state) => ({
            installedPlugins: state.installedPlugins.filter((pluginId) => pluginId !== id),
            isLoading: false,
          }))
        } catch (error: any) {
          set({
            error: error.response?.data?.message || '卸载插件失败',
            isLoading: false,
          })
          throw error
        }
      },

      // 设置当前插件
      setCurrentPlugin: (plugin: Plugin | null) => {
        set({ currentPlugin: plugin })
      },

      // 清除错误
      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'plugin-storage',
      partialize: (state) => ({
        installedPlugins: state.installedPlugins,
      }),
    }
  )
)

export default usePluginStore
