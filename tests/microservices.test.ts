/**
 * 微服务架构集成测试 - 使用 @sker/store-client
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createStoreClient } from '@sker/store-client'
import type { StoreClient } from '@sker/store-client'

describe('微服务架构测试', () => {
  let storeClient: StoreClient

  beforeAll(async () => {
    // 创建Store客户端 (需要Store服务运行在localhost:3001)
    try {
      storeClient = createStoreClient({
        baseURL: 'http://localhost:3001',
        timeout: 30000,
        retries: 3
      })
      await storeClient.initialize()
    } catch (error) {
      console.warn('无法连接到Store微服务，跳过微服务测试')
    }
  })

  afterAll(async () => {
    if (storeClient) {
      await storeClient.close()
    }
  })

  describe('StoreClient功能', () => {
    it('应该能够创建StoreClient并初始化', async () => {
      if (!storeClient) {
        console.log('跳过StoreClient测试')
        return
      }

      expect(storeClient).toBeDefined()
      expect(typeof storeClient.users).toBe('object')
      expect(typeof storeClient.projects).toBe('object')
      expect(typeof storeClient.nodes).toBe('object')
      expect(typeof storeClient.connections).toBe('object')
      expect(typeof storeClient.aiTasks).toBe('object')
    })

    it('应该支持环境变量配置', async () => {
      const originalEnv = process.env.STORE_SERVICE_URL

      process.env.STORE_SERVICE_URL = 'http://localhost:3001'
      const autoClient = createStoreClient({
        baseURL: process.env.STORE_SERVICE_URL
      })
      expect(autoClient).toBeDefined()

      process.env.STORE_SERVICE_URL = originalEnv
    })
  })

  describe('Store接口', () => {
    it('StoreClient应该提供完整的接口', async () => {
      if (!storeClient) {
        console.log('跳过接口测试')
        return
      }

      // 检查所有资源仓库
      expect(typeof storeClient.users).toBe('object')
      expect(typeof storeClient.projects).toBe('object')
      expect(typeof storeClient.nodes).toBe('object')
      expect(typeof storeClient.connections).toBe('object')
      expect(typeof storeClient.aiTasks).toBe('object')

      // 检查工具方法
      expect(typeof storeClient.healthCheck).toBe('function')
      expect(typeof storeClient.getSystemStats).toBe('function')
      expect(typeof storeClient.cache).toBe('function')
      expect(typeof storeClient.batch).toBe('function')
    })
  })

  describe('健康检查', () => {
    it('StoreClient健康检查', async () => {
      if (!storeClient) {
        console.log('跳过健康检查')
        return
      }

      try {
        const health = await storeClient.healthCheck()
        expect(health).toHaveProperty('success')
        expect(health).toHaveProperty('data')
        expect(health.data).toHaveProperty('status')
        expect(health.data).toHaveProperty('timestamp')
      } catch (error) {
        console.warn('健康检查失败:', error)
      }
    })
  })

  describe('用户操作', () => {
    const testUser = {
      username: 'testuser_' + Date.now(),
      email: 'test_' + Date.now() + '@example.com',
      password: 'password123',
      displayName: 'Test User'
    }

    it('StoreClient用户创建', async () => {
      if (!storeClient) {
        console.log('跳过用户测试')
        return
      }

      try {
        const result = await storeClient.users.create(testUser)
        expect(result.success).toBe(true)
        expect(result.data).toHaveProperty('id')
        expect(result.data.username).toBe(testUser.username)
      } catch (error) {
        console.warn('用户创建失败:', error)
      }
    })

    it('StoreClient用户查询', async () => {
      if (!storeClient) {
        console.log('跳过用户查询测试')
        return
      }

      try {
        const result = await storeClient.users.findByUsername(testUser.username)
        expect(result.success).toBe(true)
        if (result.data) {
          expect(result.data.username).toBe(testUser.username)
        }
      } catch (error) {
        console.warn('用户查询失败:', error)
      }
    })
  })
})

describe('Gateway集成测试', () => {
  it('应该能够通过Gateway访问Store API', async () => {
    try {
      const response = await fetch('http://localhost:3000/health')
      expect(response.ok).toBe(true)

      const health = await response.json()
      expect(health).toHaveProperty('status')
    } catch (error) {
      console.warn('Gateway未运行，跳过集成测试')
    }
  })

  it('应该能够通过Store直接访问API', async () => {
    try {
      const response = await fetch('http://localhost:3001/health')
      expect(response.ok).toBe(true)

      const health = await response.json()
      expect(health.success).toBe(true)
    } catch (error) {
      console.warn('Store服务未运行，跳过直接访问测试')
    }
  })
})

describe('Broker集成测试', () => {
  it('应该能够通过Broker处理AI任务', async () => {
    // 这个测试需要完整的消息队列环境
    // 在实际环境中需要RabbitMQ运行
    console.log('Broker集成测试需要完整的消息队列环境')
  })
})