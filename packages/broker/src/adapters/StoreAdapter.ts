/**
 * Store适配器 - 将StoreClient适配为Broker需要的接口
 */

import type { StoreClient } from '@sker/store-client'

/**
 * 适配StoreClient为Broker所需的StoreService接口
 */
export class StoreAdapter {
  private storeClient: StoreClient

  constructor(storeClient: StoreClient) {
    this.storeClient = storeClient
  }

  /**
   * AI任务仓库适配器
   */
  get aiTasks() {
    return {
      /**
       * 创建AI任务
       */
      create: async (taskData: any) => {
        return this.storeClient.aiTasks.create(taskData)
      },

      /**
       * 更新AI任务
       */
      update: async (id: string, updates: any) => {
        return this.storeClient.aiTasks.update(id, updates)
      },

      /**
       * 根据ID查找AI任务
       */
      findById: async (id: string) => {
        return this.storeClient.aiTasks.findById(id)
      },

      /**
       * 启动AI任务
       */
      startTask: async (id: string) => {
        return this.storeClient.aiTasks.startTask(id)
      },

      /**
       * 完成AI任务
       */
      completeTask: async (id: string, result: any, processingTime?: number) => {
        return this.storeClient.aiTasks.completeTask(id, result, processingTime)
      },

      /**
       * 标记AI任务失败
       */
      failTask: async (id: string, error: any) => {
        return this.storeClient.aiTasks.failTask(id, error)
      },

      /**
       * 获取队列中的任务
       */
      getQueuedTasks: async (limit: number = 10) => {
        return this.storeClient.aiTasks.getQueuedTasks(limit)
      },

      /**
       * 清理旧任务
       */
      cleanupOldTasks: async (daysOld: number) => {
        return this.storeClient.aiTasks.cleanupOldTasks(daysOld)
      }
    }
  }

  /**
   * 获取健康状态
   */
  async healthCheck() {
    return this.storeClient.healthCheck()
  }

  /**
   * 获取系统统计
   */
  async getSystemStats() {
    return this.storeClient.getSystemStats()
  }

  /**
   * 缓存操作
   */
  async cache(key: string, value?: any, ttl?: number) {
    return this.storeClient.cache(key, value, ttl)
  }

  /**
   * 删除缓存
   */
  async deleteCache(keyOrPattern: string, isPattern: boolean = false) {
    return this.storeClient.deleteCache(keyOrPattern, isPattern)
  }

  /**
   * 批量操作
   */
  async batch<T>(operations: (() => Promise<T>)[]) {
    return this.storeClient.batch(operations)
  }

  /**
   * 验证数据完整性
   */
  async validateDataIntegrity() {
    return this.storeClient.validateDataIntegrity()
  }

  /**
   * 修复数据完整性问题
   */
  async repairDataIntegrity() {
    return this.storeClient.repairDataIntegrity()
  }

  /**
   * 清理操作
   */
  async cleanup(options: {
    oldTasks?: number
    oldLogs?: number
    oldArchived?: number
  } = {}) {
    return this.storeClient.cleanup(options)
  }

  /**
   * 关闭适配器
   */
  async close() {
    return this.storeClient.close()
  }

  /**
   * 设置认证令牌
   */
  setAuthToken(token: string) {
    this.storeClient.setAuthToken(token)
  }

  /**
   * 清除认证令牌
   */
  clearAuthToken() {
    this.storeClient.clearAuthToken()
  }
}

/**
 * 创建Store适配器的工厂函数
 */
export function createStoreAdapter(storeClient: StoreClient): StoreAdapter {
  return new StoreAdapter(storeClient)
}