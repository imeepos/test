import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Router } from 'express'
import { BaseRouter, RouterDependencies } from '../../router/BaseRouter'
import { AIEngine } from '@sker/engine'
import { StoreClient } from '@sker/store-client'
import { QueueManager } from '../../messaging/QueueManager'

// Mock dependencies
vi.mock('@sker/engine')
vi.mock('@sker/store-client')
vi.mock('../../messaging/QueueManager')

// 创建测试用的具体Router类
class TestRouter extends BaseRouter {
  constructor(dependencies?: RouterDependencies) {
    super(dependencies)
    this.setupRoutes()
  }

  private setupRoutes() {
    this.router.get('/test', (req, res) => {
      res.json({ message: 'test' })
    })

    this.router.post('/generate-task-id', (req, res) => {
      const taskId = this.generateTaskId()
      res.json({ taskId })
    })
  }
}

describe('@sker/gateway - BaseRouter', () => {
  let mockAiEngine: AIEngine
  let mockStoreClient: StoreClient
  let mockQueueManager: QueueManager
  let dependencies: RouterDependencies

  beforeEach(() => {
    mockAiEngine = new AIEngine({} as any)
    mockStoreClient = new StoreClient({ baseURL: 'http://localhost:3001' })
    mockQueueManager = new QueueManager({} as any)

    dependencies = {
      aiEngine: mockAiEngine,
      storeClient: mockStoreClient,
      queueManager: mockQueueManager
    }
  })

  describe('构造函数', () => {
    it('应该成功创建BaseRouter实例', () => {
      const router = new TestRouter()

      expect(router).toBeDefined()
      expect(router).toBeInstanceOf(BaseRouter)
    })

    it('应该注入依赖项', () => {
      const router = new TestRouter(dependencies)

      expect((router as any).aiEngine).toBe(mockAiEngine)
      expect((router as any).storeClient).toBe(mockStoreClient)
      expect((router as any).queueManager).toBe(mockQueueManager)
    })

    it('应该在没有依赖项时正常工作', () => {
      const router = new TestRouter()

      expect((router as any).aiEngine).toBeUndefined()
      expect((router as any).storeClient).toBeUndefined()
      expect((router as any).queueManager).toBeUndefined()
    })
  })

  describe('getRouter', () => {
    it('应该返回Express Router实例', () => {
      const router = new TestRouter()
      const expressRouter = router.getRouter()

      expect(expressRouter).toBeDefined()
      expect(typeof expressRouter).toBe('function')
    })

    it('返回的router应该可以注册路由', () => {
      const router = new TestRouter()
      const expressRouter = router.getRouter()

      // Express Router 应该有 get, post 等方法
      expect(typeof (expressRouter as any).get).toBe('function')
      expect(typeof (expressRouter as any).post).toBe('function')
    })
  })

  describe('generateTaskId', () => {
    it('应该生成唯一的任务ID', () => {
      const router = new TestRouter()

      const taskId1 = (router as any).generateTaskId()
      const taskId2 = (router as any).generateTaskId()

      expect(taskId1).toBeDefined()
      expect(taskId2).toBeDefined()
      expect(taskId1).not.toBe(taskId2)
    })

    it('任务ID应该包含task_前缀', () => {
      const router = new TestRouter()
      const taskId = (router as any).generateTaskId()

      expect(taskId).toMatch(/^task_/)
    })

    it('任务ID应该包含时间戳', () => {
      const router = new TestRouter()
      const taskId = (router as any).generateTaskId()

      // task_TIMESTAMP_RANDOM格式
      const parts = taskId.split('_')
      expect(parts.length).toBe(3)
      expect(parts[0]).toBe('task')
      expect(Number(parts[1])).toBeGreaterThan(0)
    })

    it('应该生成足够随机的ID', () => {
      const router = new TestRouter()
      const taskIds = new Set()

      // 生成100个ID,应该都是唯一的
      for (let i = 0; i < 100; i++) {
        const taskId = (router as any).generateTaskId()
        expect(taskIds.has(taskId)).toBe(false)
        taskIds.add(taskId)
      }

      expect(taskIds.size).toBe(100)
    })
  })

  describe('路由继承', () => {
    it('子类应该能够访问router实例', () => {
      const router = new TestRouter()
      const expressRouter = router.getRouter()

      expect(expressRouter).toBeDefined()
    })

    it('子类应该能够访问依赖项', () => {
      const router = new TestRouter(dependencies)

      expect((router as any).aiEngine).toBeDefined()
      expect((router as any).storeClient).toBeDefined()
      expect((router as any).queueManager).toBeDefined()
    })
  })

  describe('依赖注入', () => {
    it('应该支持部分依赖注入', () => {
      const partialDeps: RouterDependencies = {
        aiEngine: mockAiEngine
      }

      const router = new TestRouter(partialDeps)

      expect((router as any).aiEngine).toBe(mockAiEngine)
      expect((router as any).storeClient).toBeUndefined()
      expect((router as any).queueManager).toBeUndefined()
    })

    it('应该支持只注入storeClient', () => {
      const partialDeps: RouterDependencies = {
        storeClient: mockStoreClient
      }

      const router = new TestRouter(partialDeps)

      expect((router as any).storeClient).toBe(mockStoreClient)
      expect((router as any).aiEngine).toBeUndefined()
    })

    it('应该支持只注入queueManager', () => {
      const partialDeps: RouterDependencies = {
        queueManager: mockQueueManager
      }

      const router = new TestRouter(partialDeps)

      expect((router as any).queueManager).toBe(mockQueueManager)
      expect((router as any).aiEngine).toBeUndefined()
    })
  })

  describe('类型安全', () => {
    it('依赖项应该有正确的类型', () => {
      const router = new TestRouter(dependencies)

      // TypeScript应该能够正确推断类型
      const engine: AIEngine | undefined = (router as any).aiEngine
      const client: StoreClient | undefined = (router as any).storeClient
      const queue: QueueManager | undefined = (router as any).queueManager

      expect(engine).toBeDefined()
      expect(client).toBeDefined()
      expect(queue).toBeDefined()
    })
  })

  describe('错误处理', () => {
    it('应该在没有依赖时安全执行', () => {
      const router = new TestRouter()

      expect(() => {
        router.getRouter()
      }).not.toThrow()
    })

    it('generateTaskId应该总是返回有效ID', () => {
      const router = new TestRouter()

      for (let i = 0; i < 10; i++) {
        const taskId = (router as any).generateTaskId()
        expect(taskId).toBeTruthy()
        expect(typeof taskId).toBe('string')
        expect(taskId.length).toBeGreaterThan(10)
      }
    })
  })
})
