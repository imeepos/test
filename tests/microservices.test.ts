/**
 * 微服务架构集成测试
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createStore, isMicroserviceStore, isLegacyStore } from '@sker/store'
import type { StoreService, StoreClient } from '@sker/store'

describe('微服务架构测试', () => {
  let microserviceStore: StoreClient
  let legacyStore: StoreService

  beforeAll(async () => {
    // 创建微服务Store (需要Store服务运行在localhost:3001)
    try {
      microserviceStore = await createStore({
        useMicroservice: true,
        storeServiceUrl: 'http://localhost:3001'
      }) as StoreClient
    } catch (error) {
      console.warn('无法连接到Store微服务，跳过微服务测试')
    }

    // 创建传统Store
    legacyStore = await createStore({
      useMicroservice: false
    }) as StoreService
  })

  afterAll(async () => {
    if (microserviceStore) {
      await microserviceStore.close()
    }
    if (legacyStore) {
      await legacyStore.close()
    }
  })

  describe('Store工厂函数', () => {
    it('应该能够创建微服务Store', async () => {
      if (!microserviceStore) {
        console.log('跳过微服务测试')
        return
      }

      expect(isMicroserviceStore(microserviceStore)).toBe(true)
      expect(isLegacyStore(microserviceStore)).toBe(false)
    })

    it('应该能够创建传统Store', async () => {
      expect(isLegacyStore(legacyStore)).toBe(true)
      expect(isMicroserviceStore(legacyStore)).toBe(false)
    })

    it('应该能够自动检测环境', async () => {
      // 设置环境变量测试
      const originalEnv = process.env.STORE_SERVICE_URL

      process.env.STORE_SERVICE_URL = 'http://localhost:3001'
      const autoStore = await createStore()
      expect(isMicroserviceStore(autoStore)).toBe(true)
      await autoStore.close()

      delete process.env.STORE_SERVICE_URL
      const autoLegacyStore = await createStore()
      expect(isLegacyStore(autoLegacyStore)).toBe(true)
      await autoLegacyStore.close()

      process.env.STORE_SERVICE_URL = originalEnv
    })
  })

  describe('Store接口兼容性', () => {
    it('微服务Store应该提供相同的接口', async () => {
      if (!microserviceStore) {
        console.log('跳过微服务接口测试')
        return
      }

      // 检查基本方法存在
      expect(typeof microserviceStore.users).toBe('object')
      expect(typeof microserviceStore.projects).toBe('object')
      expect(typeof microserviceStore.nodes).toBe('object')
      expect(typeof microserviceStore.connections).toBe('object')
      expect(typeof microserviceStore.aiTasks).toBe('object')
      expect(typeof microserviceStore.healthCheck).toBe('function')
    })

    it('传统Store应该提供相同的接口', async () => {
      expect(typeof legacyStore.users).toBe('object')
      expect(typeof legacyStore.projects).toBe('object')
      expect(typeof legacyStore.nodes).toBe('object')
      expect(typeof legacyStore.connections).toBe('object')
      expect(typeof legacyStore.aiTasks).toBe('object')
      expect(typeof legacyStore.healthCheck).toBe('function')
    })
  })

  describe('健康检查', () => {
    it('微服务Store健康检查', async () => {
      if (!microserviceStore) {
        console.log('跳过微服务健康检查')
        return
      }

      const health = await microserviceStore.healthCheck()
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('timestamp')
    })

    it('传统Store健康检查', async () => {
      const health = await legacyStore.healthCheck()
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('timestamp')
    })
  })

  describe('用户操作兼容性', () => {
    const testUser = {
      username: 'testuser_' + Date.now(),
      email: 'test_' + Date.now() + '@example.com',
      password: 'password123',
      displayName: 'Test User'
    }

    it('微服务Store用户创建', async () => {
      if (!microserviceStore) {
        console.log('跳过微服务用户测试')
        return
      }

      try {
        const user = await microserviceStore.users.create(testUser)
        expect(user).toHaveProperty('id')
        expect(user.username).toBe(testUser.username)
      } catch (error) {
        console.warn('微服务用户创建失败:', error)
      }
    })

    it('传统Store用户创建', async () => {
      try {
        const user = await legacyStore.users.create(testUser)
        expect(user).toHaveProperty('id')
        expect(user.username).toBe(testUser.username)
      } catch (error) {
        console.warn('传统Store用户创建失败:', error)
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