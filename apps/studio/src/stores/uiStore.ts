import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { Theme, Language } from '@/types'

export interface UIState {
  // 主题和语言
  theme: Theme
  language: Language
  
  // 侧边栏状态
  sidebarCollapsed: boolean
  sidebarWidth: number
  
  // 弹窗和模态框
  modals: {
    nodeEditor: { isOpen: boolean; nodeId?: string }
    settings: { isOpen: boolean }
    help: { isOpen: boolean }
    export: { isOpen: boolean }
  }
  
  // Toast通知
  toasts: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    duration?: number
    createdAt: Date
  }>
  
  // 快捷键状态
  shortcutsEnabled: boolean
  currentShortcut?: string
  
  // 用户偏好
  preferences: {
    autoSave: boolean
    gridSnap: boolean
    showMinimap: boolean
    showGrid: boolean
    animationsEnabled: boolean
  }
  
  // 加载状态
  loadingStates: Map<string, boolean>
  
  // Actions
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  
  // 侧边栏控制
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarWidth: (width: number) => void
  
  // 模态框管理
  openModal: (modal: keyof UIState['modals'], data?: any) => void
  closeModal: (modal: keyof UIState['modals']) => void
  closeAllModals: () => void
  
  // Toast通知
  addToast: (toast: Omit<UIState['toasts'][0], 'id' | 'createdAt'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
  
  // 快捷键管理
  setShortcutsEnabled: (enabled: boolean) => void
  setCurrentShortcut: (shortcut?: string) => void
  
  // 偏好设置
  updatePreferences: (updates: Partial<UIState['preferences']>) => void
  resetPreferences: () => void
  
  // 加载状态管理
  setLoading: (key: string, loading: boolean) => void
  isLoading: (key: string) => boolean
  clearLoadingStates: () => void
}

const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const defaultPreferences = {
  autoSave: true,
  gridSnap: false,
  showMinimap: true,
  showGrid: true,
  animationsEnabled: true,
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        theme: 'dark',
        language: 'zh-CN',
        sidebarCollapsed: false,
        sidebarWidth: 200,
        modals: {
          nodeEditor: { isOpen: false },
          settings: { isOpen: false },
          help: { isOpen: false },
          export: { isOpen: false },
        },
        toasts: [],
        shortcutsEnabled: true,
        preferences: defaultPreferences,
        loadingStates: new Map(),
        
        // 主题和语言
        setTheme: (theme) => {
          set({ theme })
          
          // 更新HTML类名
          if (typeof document !== 'undefined') {
            const root = document.documentElement
            root.classList.remove('light', 'dark')
            if (theme !== 'system') {
              root.classList.add(theme)
            } else {
              // 跟随系统主题
              const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
              root.classList.add(systemTheme)
            }
          }
        },
        
        setLanguage: (language) => {
          set({ language })
          
          // 更新HTML lang属性
          if (typeof document !== 'undefined') {
            document.documentElement.lang = language
          }
        },
        
        // 侧边栏控制
        toggleSidebar: () => {
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
        },
        
        setSidebarCollapsed: (sidebarCollapsed) => {
          set({ sidebarCollapsed })
        },
        
        setSidebarWidth: (sidebarWidth) => {
          set({ sidebarWidth })
        },
        
        // 模态框管理
        openModal: (modal, data) => {
          set((state) => ({
            modals: {
              ...state.modals,
              [modal]: { isOpen: true, ...data },
            },
          }))
        },
        
        closeModal: (modal) => {
          set((state) => ({
            modals: {
              ...state.modals,
              [modal]: { isOpen: false },
            },
          }))
        },
        
        closeAllModals: () => {
          set((state) => ({
            modals: Object.keys(state.modals).reduce((acc, key) => {
              acc[key as keyof UIState['modals']] = { isOpen: false }
              return acc
            }, {} as UIState['modals']),
          }))
        },
        
        // Toast通知
        addToast: (toast) => {
          const id = generateId()
          const newToast = {
            ...toast,
            id,
            createdAt: new Date(),
          }
          
          set((state) => ({
            toasts: [...state.toasts, newToast],
          }))
          
          // 自动移除toast
          const duration = toast.duration || 5000
          if (duration > 0) {
            setTimeout(() => {
              get().removeToast(id)
            }, duration)
          }
          
          return id
        },
        
        removeToast: (id) => {
          set((state) => ({
            toasts: state.toasts.filter(toast => toast.id !== id),
          }))
        },
        
        clearToasts: () => {
          set({ toasts: [] })
        },
        
        // 快捷键管理
        setShortcutsEnabled: (shortcutsEnabled) => {
          set({ shortcutsEnabled })
        },
        
        setCurrentShortcut: (currentShortcut) => {
          set({ currentShortcut })
        },
        
        // 偏好设置
        updatePreferences: (updates) => {
          set((state) => ({
            preferences: { ...state.preferences, ...updates },
          }))
        },
        
        resetPreferences: () => {
          set({ preferences: defaultPreferences })
        },
        
        // 加载状态管理
        setLoading: (key, loading) => {
          set((state) => {
            const newLoadingStates = new Map(state.loadingStates)
            if (loading) {
              newLoadingStates.set(key, true)
            } else {
              newLoadingStates.delete(key)
            }
            return { loadingStates: newLoadingStates }
          })
        },
        
        isLoading: (key) => {
          return get().loadingStates.get(key) || false
        },
        
        clearLoadingStates: () => {
          set({ loadingStates: new Map() })
        },
      }),
      {
        name: 'ui-storage',
        partialize: (state) => ({
          theme: state.theme,
          language: state.language,
          sidebarCollapsed: state.sidebarCollapsed,
          sidebarWidth: state.sidebarWidth,
          preferences: state.preferences,
          shortcutsEnabled: state.shortcutsEnabled,
        }),
      }
    ),
    {
      name: 'ui-store',
    }
  )
)