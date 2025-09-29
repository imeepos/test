// 导出所有类型定义
export type * from './canvas'
export type * from './node' 
export type * from './ai'
export type * from './api'

// 解决Position类型重复导出问题
export type { Position } from './canvas'

// 通用工具类型
export interface Option<T> {
  value: T
  label: string
  disabled?: boolean
}

export interface SelectOption extends Option<string> {
  icon?: string
}

// 事件处理器类型
export type EventHandler<T = any> = (event: T) => void
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>

// 通用状态类型
export interface LoadingState {
  isLoading: boolean
  error?: string
}

// 通用筛选类型
export interface FilterState<T = any> {
  query: string
  filters: T
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 主题类型
export type Theme = 'light' | 'dark' | 'system'

// 语言类型
export type Language = 'zh-CN' | 'en-US'

// 用户偏好设置
export interface UserPreferences {
  theme: Theme
  language: Language
  autoSave: boolean
  gridSnap: boolean
  showMinimap: boolean
}