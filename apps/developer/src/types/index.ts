// 基础类型定义
export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  role: 'developer' | 'admin' | 'moderator'
  createdAt: string
  lastLoginAt?: string
  profile: UserProfile
}

export interface UserProfile {
  displayName: string
  bio?: string
  website?: string
  location?: string
  skills: string[]
  github?: string
  twitter?: string
}

// 项目相关类型
export interface Project {
  id: string
  name: string
  description: string
  type: ProjectType
  status: ProjectStatus
  template: ProjectTemplate
  ownerId: string
  collaborators: string[]
  createdAt: string
  updatedAt: string
  config: ProjectConfig
  stats: ProjectStats
}

export type ProjectType = 'component' | 'ai-processor' | 'exporter' | 'tool' | 'theme'

export type ProjectStatus = 'draft' | 'development' | 'testing' | 'published' | 'archived'

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: ProjectType
  files: TemplateFile[]
  dependencies: Record<string, string>
}

export interface TemplateFile {
  path: string
  content: string
  type: 'typescript' | 'javascript' | 'json' | 'markdown' | 'css'
}

export interface ProjectConfig {
  entry: string
  output: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  buildSettings: BuildSettings
  debugSettings: DebugSettings
}

export interface BuildSettings {
  target: 'es2020' | 'es2018' | 'es5'
  format: 'esm' | 'cjs' | 'umd'
  minify: boolean
  sourcemap: boolean
  externals: string[]
}

export interface DebugSettings {
  enabled: boolean
  port: number
  autoOpen: boolean
  hot: boolean
}

export interface ProjectStats {
  linesOfCode: number
  files: number
  dependencies: number
  buildTime: number
  bundleSize: number
  lastBuild: string
}

// 插件相关类型
export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: User
  category: ProjectType
  tags: string[]
  downloads: number
  rating: number
  reviews: number
  price: number // 0 表示免费
  status: PluginStatus
  repository?: string
  homepage?: string
  changelog: PluginVersion[]
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export type PluginStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export interface PluginVersion {
  version: string
  changes: string
  publishedAt: string
  downloadUrl: string
  checksum: string
}

// SDK 相关类型
export interface SDKVersion {
  version: string
  releaseDate: string
  changelog: string
  downloadUrl: string
  documentation: string
  compatibility: string[]
}

// API 相关类型
export interface APIEndpoint {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  parameters: APIParameter[]
  requestBody?: APIRequestBody
  responses: APIResponse[]
  examples: APIExample[]
}

export interface APIParameter {
  name: string
  type: string
  required: boolean
  description: string
  example: any
}

export interface APIRequestBody {
  type: string
  description: string
  schema: any
  example: any
}

export interface APIResponse {
  status: number
  description: string
  schema: any
  example: any
}

export interface APIExample {
  name: string
  description: string
  request: any
  response: any
}

// 文档相关类型
export interface Documentation {
  id: string
  title: string
  category: DocCategory
  content: string
  tags: string[]
  lastUpdated: string
  version: string
  order: number
}

export type DocCategory = 'quick-start' | 'api-reference' | 'guides' | 'examples' | 'changelog'

// 市场相关类型
export interface MarketplaceItem {
  plugin: Plugin
  featured: boolean
  trending: boolean
  newRelease: boolean
  discountPrice?: number
  discountEndDate?: string
}

// 社区相关类型
export interface ForumPost {
  id: string
  title: string
  content: string
  category: ForumCategory
  author: User
  tags: string[]
  views: number
  likes: number
  replies: number
  pinned: boolean
  closed: boolean
  createdAt: string
  updatedAt: string
}

export type ForumCategory = 'discussion' | 'help' | 'showcase' | 'feedback' | 'announcement'

export interface ForumReply {
  id: string
  postId: string
  content: string
  author: User
  likes: number
  createdAt: string
  updatedAt: string
}

// 通知相关类型
export interface Notification {
  id: string
  type: NotificationType
  title: string
  content: string
  read: boolean
  actionUrl?: string
  createdAt: string
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

// 设置相关类型
export interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  notifications: NotificationSettings
  editor: EditorSettings
  security: SecuritySettings
}

export interface NotificationSettings {
  email: boolean
  browser: boolean
  pluginUpdates: boolean
  forumReplies: boolean
  systemAnnouncements: boolean
}

export interface EditorSettings {
  fontSize: number
  tabSize: number
  wordWrap: boolean
  minimap: boolean
  autoSave: boolean
  theme: string
  fontFamily: string
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  apiKeyVisible: boolean
  sessionTimeout: number
  loginNotifications: boolean
}

// API 响应类型
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
  meta?: {
    total?: number
    page?: number
    pageSize?: number
  }
}

// 错误类型
export interface AppError {
  code: string
  message: string
  details?: any
}

// 路由类型
export interface RouteConfig {
  path: string
  component: React.ComponentType
  exact?: boolean
  auth?: boolean
  roles?: string[]
}

// 菜单类型
export interface MenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  path?: string
  children?: MenuItem[]
  badge?: number
  disabled?: boolean
}