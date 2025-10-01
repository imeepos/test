/**
 * API服务配置
 * 统一管理所有后端服务的URL配置
 */

export interface APIConfig {
  /** Gateway API网关地址 */
  gateway: string
  /** Store数据存储服务地址 */
  store: string
  /** WebSocket服务地址 */
  websocket: string
  /** API请求超时时间(毫秒) */
  timeout: number
  /** 请求重试次数 */
  retries: number
  /** 重试延迟(毫秒) */
  retryDelay: number
}

/**
 * 默认API配置
 * 生产环境应通过环境变量覆盖
 */
export const API_CONFIG: APIConfig = {
  gateway: import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3000',
  store: import.meta.env.VITE_STORE_URL || 'http://localhost:3001',
  websocket: import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws',
  timeout: 30000, // 30秒
  retries: 3,
  retryDelay: 1000, // 1秒
}

/**
 * API端点路径
 */
export const API_ENDPOINTS = {
  // 节点相关
  nodes: {
    list: '/api/v1/nodes',
    detail: (id: string) => `/api/v1/nodes/${id}`,
    create: '/api/v1/nodes',
    update: (id: string) => `/api/v1/nodes/${id}`,
    delete: (id: string) => `/api/v1/nodes/${id}`,
    search: '/api/v1/nodes',
    optimize: (id: string) => `/api/v1/nodes/${id}/optimize`,
    versions: (id: string) => `/api/v1/nodes/${id}/versions`,
    rollback: (id: string) => `/api/v1/nodes/${id}/rollback`,
  },

  // 项目相关
  projects: {
    list: '/api/v1/projects',
    detail: (id: string) => `/api/v1/projects/${id}`,
    create: '/api/v1/projects',
    update: (id: string) => `/api/v1/projects/${id}`,
    delete: (id: string) => `/api/v1/projects/${id}`,
    canvasState: (id: string) => `/api/v1/projects/${id}/canvas-state`,
    recent: (userId: string) => `/api/v1/projects/recent/${userId}`,
  },

  // 连接关系
  connections: {
    list: '/api/v1/connections',
    create: '/api/v1/connections',
    delete: (id: string) => `/api/v1/connections/${id}`,
    byNode: (nodeId: string) => `/api/v1/connections/node/${nodeId}`,
    byProject: (projectId: string) => `/api/v1/connections/project/${projectId}`,
  },

  // 用户相关
  users: {
    profile: '/api/v1/users/profile',
    projects: '/api/v1/users/projects',
  },

  // 系统
  system: {
    health: '/health',
    stats: '/api/v1/stats',
  },
} as const

/**
 * 构建完整的API URL
 */
export function buildAPIUrl(endpoint: string, baseUrl: string = API_CONFIG.gateway): string {
  // 移除endpoint开头的斜杠(如果有)
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  // 移除baseUrl结尾的斜杠(如果有)
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  return `${base}/${path}`
}

/**
 * 验证API配置
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

/**
 * 打印API配置信息(用于调试)
 */
export function logAPIConfig(): void {
  console.log('📡 API配置信息:')
  console.log('  Gateway:', API_CONFIG.gateway)
  console.log('  Store:', API_CONFIG.store)
  console.log('  WebSocket:', API_CONFIG.websocket)
  console.log('  Timeout:', API_CONFIG.timeout, 'ms')
  console.log('  Retries:', API_CONFIG.retries)
}
