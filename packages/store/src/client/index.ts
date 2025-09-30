/**
 * Store HTTP客户端导出
 */

export { StoreClient, createStoreClient, createStoreClientFromEnv } from './StoreClient.js'
export type { StoreClientConfig } from './StoreClient.js'

// 默认客户端实例（可选）
import { createStoreClientFromEnv } from './StoreClient.js'

let defaultClient: ReturnType<typeof createStoreClientFromEnv> | null = null

/**
 * 获取默认Store客户端实例
 * 基于环境变量自动配置
 */
export function getDefaultStoreClient() {
  if (!defaultClient) {
    defaultClient = createStoreClientFromEnv()
  }
  return defaultClient
}

/**
 * 重置默认客户端（用于测试）
 */
export function resetDefaultStoreClient() {
  defaultClient = null
}