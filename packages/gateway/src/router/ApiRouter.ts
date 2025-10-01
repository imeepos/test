import { Router } from 'express'
import type { ApiRequest, ApiResponse } from '../types/ApiTypes.js'
import type { RouteHandler, RouteMap } from '../types/SpecificTypes.js'
import { BaseRouter, RouterDependencies } from './BaseRouter.js'
import { NodeRouter } from './NodeRouter.js'
import { AIRouter } from './AIRouter.js'
import { ProjectRouter } from './ProjectRouter.js'
import { UserRouter } from './UserRouter.js'
import { ConnectionRouter } from './ConnectionRouter.js'

/**
 * API路由器 - 管理所有API端点的路由组合器
 */
export class ApiRouter extends BaseRouter {
  private routes: RouteMap = new Map()
  private nodeRouter: NodeRouter
  private aiRouter: AIRouter
  private projectRouter: ProjectRouter
  private userRouter: UserRouter
  private connectionRouter: ConnectionRouter

  constructor(dependencies?: RouterDependencies) {
    super(dependencies)

    // 初始化子路由器
    this.nodeRouter = new NodeRouter(dependencies)
    this.aiRouter = new AIRouter(dependencies)
    this.projectRouter = new ProjectRouter(dependencies)
    this.userRouter = new UserRouter(dependencies)
    this.connectionRouter = new ConnectionRouter(dependencies)

    this.setupRoutes()
  }

  protected setupRoutes(): void {
    // 节点管理路由
    this.router.use('/nodes', this.nodeRouter.getRouter())

    // AI服务路由
    this.router.use('/ai', this.aiRouter.getRouter())

    // 项目管理路由
    this.router.use('/projects', this.projectRouter.getRouter())

    // 用户管理路由
    this.router.use('/users', this.userRouter.getRouter())

    // 连接管理路由
    this.router.use('/connections', this.connectionRouter.getRouter())

    // 根路由健康检查
    this.router.get('/', this.healthCheck.bind(this))

    // API信息端点
    this.router.get('/info', this.getApiInfo.bind(this))
  }

  /**
   * API健康检查
   */
  private async healthCheck(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      const health = {
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date(),
        services: {
          store: !!this.storeClient,
          ai: !!this.aiEngine,
          queue: !!this.queueManager
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        requestId: req.requestId
      }

      res.success(health, 'API is healthy')
    } catch (error) {
      res.error({
        code: 'HEALTH_CHECK_ERROR',
        message: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  /**
   * 获取API信息
   */
  private async getApiInfo(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      const apiInfo = {
        name: 'SKER Gateway API',
        version: '1.0.0',
        description: '统一的网关API服务，提供节点管理、AI服务、项目管理和用户管理功能',
        endpoints: {
          nodes: {
            base: '/api/nodes',
            description: '节点管理 - CRUD操作、搜索、优化和版本管理',
            methods: ['GET', 'POST', 'PUT', 'DELETE']
          },
          ai: {
            base: '/api/ai',
            description: 'AI服务 - 内容生成、优化、融合和批量处理',
            methods: ['GET', 'POST']
          },
          projects: {
            base: '/api/projects',
            description: '项目管理 - 项目CRUD操作和画布状态管理',
            methods: ['GET', 'POST', 'PUT', 'DELETE']
          },
          users: {
            base: '/api/users',
            description: '用户管理 - 认证和资料管理',
            methods: ['GET', 'POST', 'PUT']
          },
          connections: {
            base: '/api/connections',
            description: '连接管理 - 节点连接的CRUD操作和查询',
            methods: ['GET', 'POST', 'PUT', 'DELETE']
          }
        },
        features: [
          '模块化路由架构',
          '统一错误处理',
          '依赖注入支持',
          '类型安全',
          '事件发布机制',
          '健康检查'
        ],
        documentation: 'https://docs.sker.ai/api',
        support: 'support@sker.ai',
        timestamp: new Date(),
        requestId: req.requestId
      }

      res.success(apiInfo, 'API information retrieved successfully')
    } catch (error) {
      res.error({
        code: 'API_INFO_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get API info',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  /**
   * 添加自定义路由
   */
  addRoute(path: string, handler: RouteHandler): void {
    this.routes.set(path, handler)
    this.router.use(path, handler as any)
  }

  /**
   * 获取已注册的路由
   */
  getRoutes(): RouteMap {
    return this.routes
  }

  /**
   * 获取子路由器实例
   */
  getNodeRouter(): NodeRouter {
    return this.nodeRouter
  }

  getAIRouter(): AIRouter {
    return this.aiRouter
  }

  getProjectRouter(): ProjectRouter {
    return this.projectRouter
  }

  getUserRouter(): UserRouter {
    return this.userRouter
  }

  getConnectionRouter(): ConnectionRouter {
    return this.connectionRouter
  }

  /**
   * 更新依赖注入
   */
  updateDependencies(dependencies: RouterDependencies): void {
    // 更新基类依赖
    this.aiEngine = dependencies.aiEngine
    this.storeClient = dependencies.storeClient
    this.queueManager = dependencies.queueManager

    // 更新子路由器依赖 - 需要重新创建实例
    this.nodeRouter = new NodeRouter(dependencies)
    this.aiRouter = new AIRouter(dependencies)
    this.projectRouter = new ProjectRouter(dependencies)
    this.userRouter = new UserRouter(dependencies)
    this.connectionRouter = new ConnectionRouter(dependencies)

    // 重新设置路由
    this.router = Router()
    this.setupRoutes()
  }

  /**
   * 获取服务状态
   */
  getServiceStatus(): {
    store: boolean
    ai: boolean
    queue: boolean
  } {
    return {
      store: !!this.storeClient,
      ai: !!this.aiEngine,
      queue: !!this.queueManager
    }
  }

  /**
   * 获取路由统计信息
   */
  getRouteStats(): {
    totalRoutes: number
    customRoutes: number
    subRouters: string[]
  } {
    return {
      totalRoutes: this.routes.size + 5, // 5个子路由器
      customRoutes: this.routes.size,
      subRouters: ['nodes', 'ai', 'projects', 'users', 'connections']
    }
  }
}