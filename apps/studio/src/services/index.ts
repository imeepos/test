// AI服务
export { aiService, AIService } from './aiService'
export type { AIServiceConfig } from './aiService'

// WebSocket服务
export { websocketService, WebSocketService } from './websocketService'
export type { WebSocketConfig, WebSocketMessage } from './websocketService'

// 节点服务
export { nodeService, NodeService } from './nodeService'
export type { NodeCreationOptions, NodeUpdateOptions } from './nodeService'

// 导入服务实例
import { aiService } from './aiService'
import { websocketService } from './websocketService'
import { nodeService } from './nodeService'

// 服务组合类型
export interface Services {
  ai: typeof aiService
  websocket: typeof websocketService
  node: typeof nodeService
}

// 服务实例集合
export const services: Services = {
  ai: aiService,
  websocket: websocketService,
  node: nodeService,
}

// 服务初始化
export async function initializeServices(): Promise<void> {
  try {
    // 检查AI服务健康状态
    const aiHealthy = await services.ai.checkHealth()
    console.log('AI服务状态:', aiHealthy ? '正常' : '异常')

    // 初始化WebSocket连接
    await services.websocket.connect()
    console.log('WebSocket连接已建立')

  } catch (error) {
    console.warn('服务初始化部分失败:', error)
    // 不抛出错误，允许应用在部分服务不可用的情况下继续运行
  }
}

// 服务清理
export function cleanupServices(): void {
  services.websocket.disconnect()
  console.log('服务已清理')
}