/**
 * UI 状态管理
 * 管理全局 UI 状态,如主题、侧边栏等
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'auto'
export type Language = 'zh-CN' | 'en-US'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  createdAt: number
}

interface UIState {
  // 状态
  theme: Theme
  language: Language
  sidebarCollapsed: boolean
  notifications: Notification[]

  // Actions
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // 初始状态
      theme: 'light',
      language: 'zh-CN',
      sidebarCollapsed: false,
      notifications: [],

      // 设置主题
      setTheme: (theme: Theme) => {
        set({ theme })
        // 应用主题到 HTML 元素
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark')
        } else {
          // auto - 根据系统偏好
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          document.documentElement.classList.toggle('dark', isDark)
        }
      },

      // 设置语言
      setLanguage: (language: Language) => {
        set({ language })
        // 应用语言到 HTML 元素
        document.documentElement.lang = language
      },

      // 切换侧边栏
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },

      // 设置侧边栏状态
      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed })
      },

      // 添加通知
      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random()}`
        const newNotification: Notification = {
          ...notification,
          id,
          createdAt: Date.now(),
        }
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }))

        // 自动移除通知
        const duration = notification.duration || 4500
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }))
        }, duration)

        return id
      },

      // 移除通知
      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      },

      // 清空所有通知
      clearNotifications: () => {
        set({ notifications: [] })
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)

export default useUIStore
