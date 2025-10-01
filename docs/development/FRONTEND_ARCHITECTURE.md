# 前端架构规范

## 概述

本文档定义了SKER项目前端应用的统一架构规范，涵盖API服务层设计、状态管理、环境配置、服务通信等方面的最佳实践。

## 设计理念

### 分层架构

```
┌─────────────────────────────────────┐
│         UI Components Layer         │  React组件、页面
├─────────────────────────────────────┤
│      State Management Layer         │  Zustand stores
├─────────────────────────────────────┤
│        Service Layer (API)          │  业务服务封装
├─────────────────────────────────────┤
│      HTTP Client Layer              │  axios客户端
├─────────────────────────────────────┤
│         Backend Services            │  Gateway、Store等
└─────────────────────────────────────┘
```

### 核心原则

1. **关注点分离**: UI、状态、业务逻辑、数据访问各司其职
2. **单一职责**: 每个service只负责一个业务域
3. **可测试性**: 各层独立，易于单元测试
4. **类型安全**: 全程TypeScript，端到端类型检查
5. **可维护性**: 统一的代码结构和命名规范

---

## 一、目录结构规范

### 1.1 标准目录结构

```
apps/[app-name]/
├── src/
│   ├── components/          # UI组件
│   │   ├── common/          # 通用组件
│   │   ├── features/        # 功能组件
│   │   └── layout/          # 布局组件
│   ├── features/            # 功能模块（可选）
│   │   └── [feature]/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── utils/
│   ├── stores/              # Zustand状态管理
│   │   ├── canvasStore.ts
│   │   ├── nodeStore.ts
│   │   └── userStore.ts
│   ├── services/            # API服务层
│   │   ├── apiClient.ts     # HTTP客户端封装
│   │   ├── projectService.ts
│   │   ├── nodeService.ts
│   │   └── index.ts
│   ├── hooks/               # 自定义React Hooks
│   ├── utils/               # 工具函数
│   ├── types/               # 类型定义
│   ├── constants/           # 常量定义
│   ├── config/              # 配置文件
│   │   └── api.ts           # API配置
│   ├── styles/              # 全局样式
│   ├── App.tsx
│   └── main.tsx
├── public/                  # 静态资源
├── .env.example             # 环境变量模板
├── vite.config.ts
├── tailwind.config.js       # 如使用Tailwind
└── package.json
```

---

## 二、API服务层架构

### 2.1 HTTP客户端封装

#### APIClient类设计

**文件位置**: `src/services/apiClient.ts`

```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { API_CONFIG } from '@/config/api'

/**
 * API响应格式标准
 */
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  pagination?: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  timestamp?: string
  requestId?: string
}

/**
 * HTTP API客户端类
 */
export class APIClient {
  private http: AxiosInstance
  private authToken: string | null = null

  constructor(config: APIClientConfig) {
    this.http = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
    this.loadAuthToken()
  }

  private setupInterceptors(): void {
    // 请求拦截器 - 添加认证token
    this.http.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`
      }
      config.headers['X-Request-ID'] = this.generateRequestId()
      return config
    })

    // 响应拦截器 - 统一错误处理
    this.http.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    )
  }

  private async handleError(error: AxiosError): Promise<any> {
    // 401 认证错误
    if (error.response?.status === 401) {
      this.clearAuthToken()
      // 触发重新登录逻辑
    }

    // 网络错误重试逻辑
    if (!error.response) {
      // 实现重试
    }

    return Promise.reject(error)
  }

  // RESTful方法封装
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>

  // Token管理
  setAuthToken(token: string): void
  clearAuthToken(): void
  private loadAuthToken(): void

  // 健康检查
  async healthCheck(): Promise<boolean>
}

// 创建客户端实例
export const gatewayClient = new APIClient({ baseURL: API_CONFIG.gateway })
export const storeClient = new APIClient({ baseURL: API_CONFIG.store })
```

#### 关键特性

- **请求拦截**: 自动添加认证token、请求ID
- **响应拦截**: 统一错误处理、业务状态码检查
- **重试机制**: 网络失败自动重试
- **类型安全**: 泛型支持，返回类型明确
- **Token管理**: 自动从localStorage加载和保存

### 2.2 业务服务封装

#### Service设计模式

每个业务域对应一个Service类，封装该域的所有API调用。

**示例**: `src/services/projectService.ts`

```typescript
import { apiClient, APIResponse } from './apiClient'
import { API_ENDPOINTS } from '@/config/api'

/**
 * 项目数据类型
 */
export interface Project {
  id: string
  name: string
  description?: string
  user_id: string
  canvas_data: CanvasState
  created_at: Date
  updated_at: Date
  last_accessed_at?: Date
}

export interface CanvasState {
  viewport: { x: number; y: number; zoom: number }
  displayMode: 'preview' | 'edit' | 'present'
  filters: Record<string, any>
  selectedNodeIds?: string[]
  timestamp?: Date
}

/**
 * 项目服务类
 */
export class ProjectService {
  /**
   * 获取项目列表
   */
  async getProjects(params?: {
    userId?: string
    page?: number
    pageSize?: number
  }): Promise<Project[]> {
    return apiClient.get<Project[]>(API_ENDPOINTS.projects.list, { params })
  }

  /**
   * 获取项目详情
   */
  async getProject(projectId: string): Promise<Project> {
    return apiClient.get<Project>(API_ENDPOINTS.projects.detail(projectId))
  }

  /**
   * 创建项目
   */
  async createProject(data: {
    name: string
    description?: string
    canvas_data: CanvasState
  }): Promise<Project> {
    return apiClient.post<Project>(API_ENDPOINTS.projects.create, data)
  }

  /**
   * 更新项目
   */
  async updateProject(
    projectId: string,
    data: Partial<Pick<Project, 'name' | 'description' | 'canvas_data'>>
  ): Promise<Project> {
    return apiClient.put<Project>(API_ENDPOINTS.projects.update(projectId), data)
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.projects.delete(projectId))
  }

  /**
   * 保存画布状态
   */
  async saveCanvasState(projectId: string, canvasState: CanvasState): Promise<void> {
    return apiClient.post<void>(
      API_ENDPOINTS.projects.canvasState(projectId),
      canvasState
    )
  }

  /**
   * 更新最后访问时间
   */
  async updateLastAccessed(projectId: string): Promise<void> {
    return apiClient.patch<void>(API_ENDPOINTS.projects.update(projectId), {
      last_accessed_at: new Date(),
    })
  }

  /**
   * 获取最近访问的项目
   */
  async getRecentProjects(userId: string, limit: number = 10): Promise<Project[]> {
    return apiClient.get<Project[]>(API_ENDPOINTS.projects.recent(userId), {
      params: { limit },
    })
  }
}

// 导出单例实例
export const projectService = new ProjectService()
```

#### Service设计原则

1. **类封装**: 使用class而非简单对象，便于扩展和测试
2. **类型定义**: 为所有数据结构定义TypeScript接口
3. **单例导出**: 导出实例而非类，避免重复创建
4. **语义化方法**: 方法名清晰表达业务意图
5. **错误传递**: 让错误向上传递，由调用方决定如何处理
6. **JSDoc注释**: 为每个公共方法添加文档注释

### 2.3 API配置管理

#### 配置文件结构

**文件位置**: `src/config/api.ts`

```typescript
/**
 * API服务配置
 */
export interface APIConfig {
  gateway: string     // Gateway API网关地址
  store: string       // Store数据存储服务地址
  websocket: string   // WebSocket服务地址
  timeout: number     // 请求超时时间(ms)
  retries: number     // 重试次数
  retryDelay: number  // 重试延迟(ms)
}

/**
 * 默认配置（从环境变量读取）
 */
export const API_CONFIG: APIConfig = {
  gateway: import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000',
  store: import.meta.env.VITE_STORE_URL || 'http://localhost:3001',
  websocket: import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
}

/**
 * API端点路径定义
 */
export const API_ENDPOINTS = {
  nodes: {
    list: '/api/v1/nodes',
    detail: (id: string) => `/api/v1/nodes/${id}`,
    create: '/api/v1/nodes',
    update: (id: string) => `/api/v1/nodes/${id}`,
    delete: (id: string) => `/api/v1/nodes/${id}`,
  },
  projects: {
    list: '/api/v1/projects',
    detail: (id: string) => `/api/v1/projects/${id}`,
    create: '/api/v1/projects',
    update: (id: string) => `/api/v1/projects/${id}`,
    delete: (id: string) => `/api/v1/projects/${id}`,
    canvasState: (id: string) => `/api/v1/projects/${id}/canvas-state`,
    recent: (userId: string) => `/api/v1/projects/recent/${userId}`,
  },
  // ... 其他端点
} as const

/**
 * 验证配置有效性
 */
export function validateAPIConfig(): boolean {
  const requiredFields: (keyof APIConfig)[] = ['gateway', 'store', 'websocket']
  for (const field of requiredFields) {
    if (!API_CONFIG[field]) {
      console.error(`❌ API配置错误: ${field} 未设置`)
      return false
    }
  }
  return true
}
```

#### 配置原则

1. **环境变量优先**: 生产配置通过环境变量注入
2. **合理默认值**: 开发环境提供默认值，便于快速启动
3. **集中管理**: 所有API配置和端点定义在一处
4. **类型安全**: 使用`as const`确保端点路径不可变
5. **验证机制**: 提供配置验证函数

---

## 三、状态管理规范

### 3.1 Zustand Store设计

#### Store结构模板

**文件位置**: `src/stores/canvasStore.ts`

```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { projectService } from '@/services/projectService'
import type { Project, CanvasState } from '@/services/projectService'

/**
 * Store状态接口
 */
export interface CanvasStoreState {
  // ===== 状态数据 =====
  viewport: { x: number; y: number; zoom: number }
  viewMode: 'preview' | 'edit' | 'present'
  currentProject: Project | null
  projects: Project[]
  isLoading: boolean
  error: string | null

  // ===== 同步Actions =====
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void
  setViewMode: (mode: 'preview' | 'edit' | 'present') => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void

  // ===== 异步Actions（调用Service） =====
  loadProjects: (userId?: string) => Promise<void>
  loadProject: (projectId: string) => Promise<void>
  createProject: (name: string, description?: string) => Promise<Project>
  saveCurrentProject: () => Promise<void>
  closeProject: () => void
}

/**
 * 创建Store
 */
export const useCanvasStore = create<CanvasStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        // ===== 初始状态 =====
        viewport: { x: 0, y: 0, zoom: 1 },
        viewMode: 'preview',
        currentProject: null,
        projects: [],
        isLoading: false,
        error: null,

        // ===== 同步Actions实现 =====
        setViewport: (viewport) =>
          set({ viewport }, false, 'canvas/setViewport'),

        setViewMode: (viewMode) =>
          set({ viewMode }, false, 'canvas/setViewMode'),

        zoomIn: () =>
          set(
            (state) => ({
              viewport: {
                ...state.viewport,
                zoom: Math.min(state.viewport.zoom * 1.2, 2),
              },
            }),
            false,
            'canvas/zoomIn'
          ),

        zoomOut: () =>
          set(
            (state) => ({
              viewport: {
                ...state.viewport,
                zoom: Math.max(state.viewport.zoom / 1.2, 0.1),
              },
            }),
            false,
            'canvas/zoomOut'
          ),

        resetZoom: () =>
          set(
            (state) => ({ viewport: { ...state.viewport, zoom: 1 } }),
            false,
            'canvas/resetZoom'
          ),

        // ===== 异步Actions实现 =====
        loadProjects: async (userId) => {
          set({ isLoading: true, error: null })

          try {
            const projects = await projectService.getProjects({ userId })
            set({ projects, isLoading: false })
            console.log(`✅ 加载了 ${projects.length} 个项目`)
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : '加载项目失败'
            set({ error: errorMessage, isLoading: false })
            console.error('❌ 加载项目失败:', error)
            throw error
          }
        },

        loadProject: async (projectId) => {
          set({ isLoading: true, error: null })

          try {
            const project = await projectService.getProject(projectId)

            // 更新画布状态
            set({
              currentProject: project,
              viewport: project.canvas_data.viewport,
              viewMode: project.canvas_data.displayMode,
              isLoading: false,
            })

            // 更新最后访问时间
            await projectService.updateLastAccessed(projectId)

            console.log('✅ 项目加载成功:', project.name)
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : '加载项目失败'
            set({ error: errorMessage, isLoading: false })
            console.error('❌ 加载项目失败:', error)
            throw error
          }
        },

        createProject: async (name, description) => {
          set({ isLoading: true, error: null })

          try {
            const project = await projectService.createProject({
              name,
              description,
              canvas_data: {
                viewport: get().viewport,
                displayMode: get().viewMode,
                filters: {},
              },
            })

            set((state) => ({
              currentProject: project,
              projects: [...state.projects, project],
              isLoading: false,
            }))

            console.log('✅ 项目创建成功:', project.name)
            return project
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : '创建项目失败'
            set({ error: errorMessage, isLoading: false })
            console.error('❌ 创建项目失败:', error)
            throw error
          }
        },

        saveCurrentProject: async () => {
          const project = get().currentProject
          if (!project) {
            console.warn('没有当前项目,无法保存')
            return
          }

          try {
            await projectService.updateProject(project.id, {
              canvas_data: {
                viewport: get().viewport,
                displayMode: get().viewMode,
                filters: {},
              },
            })

            console.log('✅ 项目保存成功')
          } catch (error) {
            console.error('❌ 项目保存失败:', error)
            throw error
          }
        },

        closeProject: () => {
          set({
            currentProject: null,
            viewport: { x: 0, y: 0, zoom: 1 },
            viewMode: 'preview',
          })
          console.log('✅ 项目已关闭')
        },
      }),
      {
        name: 'canvas-storage',
        partialize: (state) => ({
          // 只持久化部分状态
          viewMode: state.viewMode,
        }),
      }
    ),
    {
      name: 'canvas-store',
    }
  )
)
```

### 3.2 Store设计原则

#### 职责划分

- **UI状态**: 视图模式、选中项、UI开关等
- **业务数据**: 从后端获取的数据
- **加载状态**: loading、error标志
- **同步操作**: 纯前端状态变更
- **异步操作**: 调用Service与后端交互

#### 命名规范

| 类型 | 命名规范 | 示例 |
|------|---------|------|
| 状态数据 | 名词 | `currentProject`, `viewport` |
| 布尔状态 | is/has开头 | `isLoading`, `hasError` |
| 同步action | set/add/remove/update等动词 | `setViewport`, `addNode` |
| 异步action | load/save/create/delete等动词 | `loadProject`, `saveProject` |
| 计算属性 | get开头（使用computed） | `getSelectedNodes` |

#### Middleware使用

1. **devtools**: 开发时启用，便于调试
   ```typescript
   devtools(store, { name: 'store-name' })
   ```

2. **persist**: 需要持久化的状态
   ```typescript
   persist(store, {
     name: 'storage-key',
     partialize: (state) => ({ /* 选择性持久化 */ }),
   })
   ```

3. **immer**: 处理复杂嵌套状态更新
   ```typescript
   import { immer } from 'zustand/middleware/immer'
   ```

### 3.3 Store与Service集成

#### 集成模式

```typescript
// ❌ 错误：在组件中直接调用Service
function MyComponent() {
  const [data, setData] = useState(null)

  useEffect(() => {
    projectService.getProjects().then(setData)  // 不推荐
  }, [])
}

// ✅ 正确：通过Store调用Service
function MyComponent() {
  const { projects, loadProjects } = useCanvasStore()

  useEffect(() => {
    loadProjects()  // Store内部调用Service
  }, [])
}
```

#### 优势

- **状态集中**: 数据统一存储在Store中
- **减少重复**: 多个组件共享同一份数据
- **更好的缓存**: Store可以决定何时刷新数据
- **错误处理**: 统一的错误处理逻辑

---

## 四、环境变量配置

### 4.1 环境变量规范

#### 命名规范

- **前缀**: Vite项目必须以`VITE_`开头
- **大写**: 全大写，单词间用下划线分隔
- **语义化**: 名称清晰表达含义

#### 分类

| 类别 | 前缀 | 示例 |
|------|------|------|
| 应用配置 | `VITE_APP_` | `VITE_APP_TITLE` |
| API地址 | `VITE_API_` 或服务名 | `VITE_GATEWAY_URL` |
| 功能开关 | `VITE_FEATURE_` | `VITE_FEATURE_AI_ENABLED` |
| 第三方服务 | `VITE_[SERVICE]_` | `VITE_SENTRY_DSN` |

### 4.2 环境变量文件

#### .env.example模板

**文件位置**: `apps/[app-name]/.env.example`

```bash
# ==========================================
# SKER Studio 环境变量配置
# ==========================================

# ------------------------------------------
# 应用配置
# ------------------------------------------
VITE_APP_TITLE=SKER Studio
VITE_APP_VERSION=1.0.0

# ------------------------------------------
# 后端服务地址
# ------------------------------------------
# Gateway API网关地址
VITE_GATEWAY_URL=http://localhost:3000

# Store数据存储服务地址
VITE_STORE_URL=http://localhost:3001

# AI API服务地址(可选,如果通过Gateway代理则不需要)
VITE_AI_API_URL=http://localhost:8000/api/ai

# ------------------------------------------
# WebSocket配置
# ------------------------------------------
VITE_WS_URL=ws://localhost:3000/ws

# ------------------------------------------
# 功能开关
# ------------------------------------------
VITE_FEATURE_AI_ENABLED=true
VITE_FEATURE_COLLABORATION=false

# ------------------------------------------
# 开发环境
# ------------------------------------------
NODE_ENV=development
```

#### 环境特定文件

```bash
.env                # 所有环境的默认值
.env.local          # 本地开发覆盖（不提交）
.env.development    # 开发环境
.env.production     # 生产环境
.env.test           # 测试环境
```

### 4.3 TypeScript类型支持

#### vite-env.d.ts

**文件位置**: `apps/[app-name]/src/vite-env.d.ts`

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 应用配置
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string

  // 后端服务
  readonly VITE_GATEWAY_URL: string
  readonly VITE_STORE_URL: string
  readonly VITE_AI_API_URL?: string
  readonly VITE_WS_URL: string

  // 功能开关
  readonly VITE_FEATURE_AI_ENABLED: string
  readonly VITE_FEATURE_COLLABORATION: string

  // 开发环境
  readonly NODE_ENV: 'development' | 'production' | 'test'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

## 五、实战最佳实践

### 5.1 错误处理策略

#### 多层错误处理

```typescript
// 1. Service层：记录错误，向上抛出
async getProject(id: string): Promise<Project> {
  try {
    return await apiClient.get<Project>(`/projects/${id}`)
  } catch (error) {
    console.error('[ProjectService] 获取项目失败:', error)
    throw error  // 向上抛出
  }
}

// 2. Store层：捕获错误，更新error状态
loadProject: async (id: string) => {
  set({ isLoading: true, error: null })
  try {
    const project = await projectService.getProject(id)
    set({ currentProject: project, isLoading: false })
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载失败'
    set({ error: message, isLoading: false })
    throw error  // 如果组件需要处理，继续抛出
  }
}

// 3. 组件层：显示错误UI
function ProjectView() {
  const { currentProject, error, loadProject } = useCanvasStore()

  useEffect(() => {
    loadProject('project-id').catch(() => {
      // 可选：显示toast或其他UI反馈
    })
  }, [])

  if (error) return <ErrorMessage message={error} />
  // ...
}
```

### 5.2 加载状态处理

#### 统一的加载UI模式

```typescript
function ProjectList() {
  const { projects, isLoading, error, loadProjects } = useCanvasStore()

  useEffect(() => {
    loadProjects()
  }, [])

  // 加载中
  if (isLoading && projects.length === 0) {
    return <LoadingSpinner />
  }

  // 错误状态
  if (error) {
    return <ErrorState error={error} onRetry={loadProjects} />
  }

  // 空状态
  if (projects.length === 0) {
    return <EmptyState message="暂无项目" />
  }

  // 正常渲染
  return <div>{projects.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
}
```

### 5.3 数据缓存策略

#### 使用React Query增强缓存

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '@/services/projectService'

// 查询钩子
export function useProjects(userId?: string) {
  return useQuery({
    queryKey: ['projects', userId],
    queryFn: () => projectService.getProjects({ userId }),
    staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
  })
}

// 变更钩子
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => {
      // 创建成功后使缓存失效
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
```

### 5.4 WebSocket集成

#### WebSocket Service

**文件位置**: `src/services/websocketService.ts`

```typescript
import { io, Socket } from 'socket.io-client'
import { API_CONFIG } from '@/config/api'

export class WebSocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Set<Function>> = new Map()

  connect(token?: string): void {
    this.socket = io(API_CONFIG.websocket, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    this.socket.on('connect', () => {
      console.log('✅ WebSocket已连接')
    })

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket已断开')
    })

    // 注册事件监听器
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback as any)
      })
    })
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.socket = null
  }

  emit(event: string, data: any): void {
    this.socket?.emit(event, data)
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    this.socket?.on(event, callback as any)
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback)
    this.socket?.off(event, callback as any)
  }
}

export const wsService = new WebSocketService()
```

---

## 六、测试策略

### 6.1 单元测试

#### Service测试

```typescript
import { describe, it, expect, vi } from 'vitest'
import { projectService } from './projectService'
import { apiClient } from './apiClient'

vi.mock('./apiClient')

describe('ProjectService', () => {
  it('should get projects', async () => {
    const mockProjects = [{ id: '1', name: 'Test' }]
    vi.mocked(apiClient.get).mockResolvedValue(mockProjects)

    const result = await projectService.getProjects()

    expect(result).toEqual(mockProjects)
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/projects', { params: undefined })
  })
})
```

#### Store测试

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCanvasStore } from './canvasStore'

describe('CanvasStore', () => {
  it('should zoom in', () => {
    const { result } = renderHook(() => useCanvasStore())

    act(() => {
      result.current.zoomIn()
    })

    expect(result.current.viewport.zoom).toBe(1.2)
  })
})
```

### 6.2 集成测试

使用Mock Service Worker (MSW) 模拟API响应：

```typescript
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.get('/api/v1/projects', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: [] }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

---

## 七、性能优化

### 7.1 代码分割

```typescript
// 路由级别懒加载
const ProjectView = lazy(() => import('./features/project/ProjectView'))

// 组件级别懒加载
const HeavyComponent = lazy(() => import('./components/HeavyComponent'))

<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### 7.2 状态选择器优化

```typescript
// ❌ 错误：选择整个store导致不必要的重渲染
const store = useCanvasStore()

// ✅ 正确：只选择需要的状态
const viewport = useCanvasStore((state) => state.viewport)
const zoomIn = useCanvasStore((state) => state.zoomIn)
```

### 7.3 请求去重和防抖

```typescript
import { debounce } from 'lodash-es'

// 防抖搜索
const debouncedSearch = debounce((query: string) => {
  searchService.search(query)
}, 300)

// 使用React Query自动去重
const { data } = useQuery({
  queryKey: ['project', id],
  queryFn: () => projectService.getProject(id),
  // 5分钟内相同查询不会重复请求
})
```

---

## 八、新建应用检查清单

构建前端应用时，确保完成以下步骤：

- [ ] 创建标准目录结构（components, stores, services等）
- [ ] 配置API客户端（apiClient.ts）
- [ ] 定义API配置（config/api.ts）
- [ ] 创建环境变量模板（.env.example）
- [ ] 添加TypeScript环境变量类型（vite-env.d.ts）
- [ ] 创建至少一个Service（如projectService）
- [ ] 创建至少一个Store（如canvasStore）
- [ ] 配置路径别名（vite.config.ts）
- [ ] 设置React Query Provider（如需要）
- [ ] 配置WebSocket连接（如需要）
- [ ] 添加错误边界组件
- [ ] 配置加载状态UI组件
- [ ] 编写单元测试
- [ ] 验证构建输出

---

## 九、参考资料

- [Zustand官方文档](https://zustand-demo.pmnd.rs/)
- [React Query官方文档](https://tanstack.com/query/latest)
- [Axios官方文档](https://axios-http.com/)
- [Vite环境变量](https://vitejs.dev/guide/env-and-mode.html)

---

**文档版本**: v1.0.0
**最后更新**: 2025-10-01
**维护者**: SKER Team
