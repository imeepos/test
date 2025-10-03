// WebSocket服务
export { websocketService, WebSocketService } from './websocketService'
export type { WebSocketConfig, WebSocketMessage } from './websocketService'

// 节点服务
export { nodeService, NodeService } from './nodeService'
export type { NodeCreationOptions, NodeUpdateOptions } from './nodeService'

// 版本管理服务
export { versionService, VersionService } from './versionService'
export type { VersionChangeInfo, VersionDiff, RestoreOptions } from './versionService'

// 导入服务实例
import { websocketService } from './websocketService'
import { nodeService } from './nodeService'
import { versionService } from './versionService'

// 服务组合类型
export interface Services {
  websocket: typeof websocketService
  node: typeof nodeService
  version: typeof versionService
}

// 服务实例集合
export const services: Services = {
  websocket: websocketService,
  node: nodeService,
  version: versionService,
}

// 服务初始化
export async function initializeServices(): Promise<void> {
  try {
    console.log('🚀 开始初始化服务...')

    // 1. 首先初始化WebSocket连接 (核心通信)
    await services.websocket.connect()
    console.log('✅ WebSocket连接已建立')

    // 2. 等待WebSocket稳定连接
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('🎉 服务初始化完成')

  } catch (error) {
    console.warn('⚠️ 服务初始化部分失败:', error)
    console.warn('应用将在有限功能模式下继续运行')
    // 不抛出错误，允许应用在部分服务不可用的情况下继续运行
  }
}

// 服务清理
export function cleanupServices(): void {
  services.websocket.disconnect()
  console.log('服务已清理')
}