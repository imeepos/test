import { Router, Request, Response, NextFunction } from 'express'
import { AIEngine } from '../core/AIEngine.js'
import { StudioAPIAdapter } from '../adapters/StudioAPIAdapter.js'
import type {
  StudioAIGenerateRequest,
  StudioAIGenerateResponse,
  StudioAIOptimizeRequest
} from '../adapters/StudioAPIAdapter.js'

/**
 * Express 请求接口扩展
 */
interface StudioAPIRequest extends Request {
  body: any
  params: any
  query: any
}

/**
 * API 响应接口
 */
interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    requestId: string
    timestamp: Date
    processingTime: number
  }
}

/**
 * Studio API 路由器 - 处理前端 Studio 的 AI 相关请求
 */
export class StudioAPIRouter {
  private router: Router
  private aiEngine: AIEngine
  private adapter: StudioAPIAdapter

  constructor(aiEngine: AIEngine) {
    this.router = Router()
    this.aiEngine = aiEngine
    this.adapter = new StudioAPIAdapter(aiEngine)
    this.setupRoutes()
    this.setupMiddleware()
  }

  /**
   * 获取路由器实例
   */
  getRouter(): Router {
    return this.router
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // 请求日志
    this.router.use((req: StudioAPIRequest, res: Response, next: NextFunction) => {
      const startTime = Date.now()
      const requestId = this.generateRequestId()

      // 添加请求信息到请求对象
      req.requestId = requestId
      req.startTime = startTime

      console.log(`[${requestId}] ${req.method} ${req.path} - 开始处理`)

      // 响应完成时记录处理时间
      res.on('finish', () => {
        const processingTime = Date.now() - startTime
        console.log(`[${requestId}] ${req.method} ${req.path} - 完成 (${processingTime}ms)`)
      })

      next()
    })

    // 错误处理中间件
    this.router.use((err: Error, req: StudioAPIRequest, res: Response, next: NextFunction) => {
      console.error(`[${req.requestId}] 错误:`, err)

      const errorResponse: APIResponse = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: err.message || '内部服务器错误',
          details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        },
        metadata: {
          requestId: req.requestId,
          timestamp: new Date(),
          processingTime: Date.now() - req.startTime
        }
      }

      res.status(500).json(errorResponse)
    })
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 健康检查
    this.router.get('/health', this.handleHealthCheck.bind(this))

    // 获取可用模型
    this.router.get('/models', this.handleGetModels.bind(this))

    // AI 内容生成
    this.router.post('/generate', this.handleGenerate.bind(this))

    // 内容优化
    this.router.post('/optimize', this.handleOptimize.bind(this))

    // 融合生成
    this.router.post('/fusion', this.handleFusion.bind(this))

    // 标题生成
    this.router.post('/title', this.handleGenerateTitle.bind(this))

    // 标签提取
    this.router.post('/tags', this.handleExtractTags.bind(this))

    // 批量处理
    this.router.post('/batch', this.handleBatch.bind(this))

    // 语义分析
    this.router.post('/semantics', this.handleSemanticAnalysis.bind(this))

    // 节点优化
    this.router.post('/node/optimize', this.handleOptimizeNode.bind(this))

    // 处理状态查询
    this.router.get('/status/:nodeId', this.handleGetProcessingState.bind(this))

    // AI 引擎统计信息
    this.router.get('/stats', this.handleGetStats.bind(this))
  }

  /**
   * 处理健康检查
   */
  private async handleHealthCheck(req: StudioAPIRequest, res: Response): Promise<void> {
    try {
      const isHealthy = await this.adapter.checkHealth()
      const stats = await this.aiEngine.getStats()

      const response: APIResponse = {
        success: true,
        data: {
          status: isHealthy ? 'healthy' : 'unhealthy',
          engine: stats,
          timestamp: new Date()
        },
        metadata: {
          requestId: req.requestId,
          timestamp: new Date(),
          processingTime: Date.now() - req.startTime
        }
      }

      res.json(response)
    } catch (error) {
      throw new Error(`健康检查失败: ${error}`)
    }
  }

  /**
   * 处理获取模型列表
   */
  private async handleGetModels(req: StudioAPIRequest, res: Response): Promise<void> {
    try {
      const models = await this.adapter.getAvailableModels()

      const response: APIResponse = {
        success: true,
        data: { models },
        metadata: {
          requestId: req.requestId,
          timestamp: new Date(),
          processingTime: Date.now() - req.startTime
        }
      }

      res.json(response)
    } catch (error) {
      throw new Error(`获取模型列表失败: ${error}`)
    }
  }

  /**
   * 处理AI内容生成
   */
  private async handleGenerate(req: StudioAPIRequest, res: Response): Promise<void> {
    try {
      const generateRequest: StudioAIGenerateRequest = req.body

      // 请求验证
      if (!generateRequest.inputs || !Array.isArray(generateRequest.inputs)) {
        const response: APIResponse = {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'inputs 字段是必需的，且必须是数组'
          },
          metadata: {
            requestId: req.requestId,
            timestamp: new Date(),
            processingTime: Date.now() - req.startTime
          }
        }
        return res.status(400).json(response)
      }

      // 添加请求ID
      if (!generateRequest.options) {
        generateRequest.options = {}
      }

      const result: StudioAIGenerateResponse = await this.adapter.generateContent(generateRequest)

      // 更新元数据
      if (result.metadata) {
        result.metadata.requestId = req.requestId
      }

      const response: APIResponse<StudioAIGenerateResponse> = {
        success: true,
        data: result,
        metadata: {
          requestId: req.requestId,
          timestamp: new Date(),
          processingTime: Date.now() - req.startTime
        }
      }

      res.json(response)
    } catch (error) {
      throw new Error(`AI内容生成失败: ${error}`)
    }
  }

  /**
   * 处理内容优化
   */
  private async handleOptimize(req: StudioAPIRequest, res: Response): Promise<void> {
    try {
      const { content, context, targetStyle } = req.body

      if (!content || typeof content !== 'string') {
        const response: APIResponse = {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'content 字段是必需的，且必须是字符串'
          },
          metadata: {
            requestId: req.requestId,
            timestamp: new Date(),
            processingTime: Date.now() - req.startTime
          }
        }
        return res.status(400).json(response)
      }

      const result = await this.adapter.optimizeContent(content, context, targetStyle)

      const response: APIResponse<StudioAIGenerateResponse> = {
        success: true,
        data: result,
        metadata: {
          requestId: req.requestId,
          timestamp: new Date(),
          processingTime: Date.now() - req.startTime
        }
      }

      res.json(response)
    } catch (error) {
      throw new Error(`内容优化失败: ${error}`)
    }
  }

  /**
   * 处理融合生成
   */
  private async handleFusion(req: StudioAPIRequest, res: Response): Promise<void> {
    try {
      const { inputs, fusionType = 'synthesis' } = req.body

      if (!inputs || !Array.isArray(inputs) || inputs.length < 2) {
        const response: APIResponse = {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'inputs 字段是必需的，必须是数组，且至少包含2个元素'
          },
          metadata: {
            requestId: req.requestId,
            timestamp: new Date(),
            processingTime: Date.now() - req.startTime
          }
        }
        return res.status(400).json(response)
      }

      const result = await this.adapter.fusionGenerate(inputs, fusionType)

      const response: APIResponse<StudioAIGenerateResponse> = {
        success: true,
        data: result,
        metadata: {
          requestId: req.requestId,
          timestamp: new Date(),
          processingTime: Date.now() - req.startTime
        }
      }

      res.json(response)
    } catch (error) {
      throw new Error(`融合生成失败: ${error}`)
    }
  }

  /**
   * 处理标题生成
   */
  private async handleGenerateTitle(req: StudioAPIRequest, res: Response): Promise<void> {
    try {
      const { content } = req.body

      if (!content || typeof content !== 'string') {
        const response: APIResponse = {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'content 字段是必需的，且必须是字符串'
          },
          metadata: {
            requestId: req.requestId,
            timestamp: new Date(),
            processingTime: Date.now() - req.startTime
          }
        }
        return res.status(400).json(response)
      }

      const title = await this.adapter.generateTitle(content)

      const response: APIResponse<{ title: string }> = {
        success: true,
        data: { title },
        metadata: {
          requestId: req.requestId,
          timestamp: new Date(),
          processingTime: Date.now() - req.startTime
        }
      }

      res.json(response)
    } catch (error) {
      throw new Error(`标题生成失败: ${error}`)
    }
  }

  /**
   * 处理标签提取
   */
  private async handleExtractTags(req: StudioAPIRequest, res: Response): Promise<void> {
    try {
      const { content } = req.body

      if (!content || typeof content !== 'string') {
        const response: APIResponse = {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'content 字段是必需的，且必须是字符串'
          },
          metadata: {
            requestId: req.requestId,
            timestamp: new Date(),
            processingTime: Date.now() - req.startTime
          }
        }
        return res.status(400).json(response)
      }

      const tags = await this.adapter.extractTags(content)

      const response: APIResponse<{ tags: string[] }> = {
        success: true,
        data: { tags },
        metadata: {
          requestId: req.requestId,
          timestamp: new Date(),
          processingTime: Date.now() - req.startTime
        }
      }

      res.json(response)
    } catch (error) {
      throw new Error(`标签提取失败: ${error}`)
    }
  }

  /**
   * 处理批量生成
   */
  private async handleBatch(req: StudioAPIRequest, res: Response): Promise<void> {
    try {
      const { requests } = req.body

      if (!requests || !Array.isArray(requests)) {
        const response: APIResponse = {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'requests 字段是必需的，且必须是数组'
          },
          metadata: {
            requestId: req.requestId,
            timestamp: new Date(),
            processingTime: Date.now() - req.startTime
          }
        }
        return res.status(400).json(response)
      }

      const results = await this.adapter.batchGenerate(requests)

      const response: APIResponse<StudioAIGenerateResponse[]> = {
        success: true,
        data: results,
        metadata: {
          requestId: req.requestId,
          timestamp: new Date(),
          processingTime: Date.now() - req.startTime
        }
      }

      res.json(response)
    } catch (error) {
      throw new Error(`批量生成失败: ${error}`)
    }
  }

  /**
   * 处理语义分析
   */
  private async handleSemanticAnalysis(req: StudioAPIRequest, res: Response): Promise<void> {
    try {
      const { content, analysisType = 'basic' } = req.body

      if (!content || typeof content !== 'string') {
        const response: APIResponse = {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'content 字段是必需的，且必须是字符串'
          },
          metadata: {
            requestId: req.requestId,
            timestamp: new Date(),
            processingTime: Date.now() - req.startTime
          }
        }
        return res.status(400).json(response)
      }

      const result = await this.adapter.analyzeSemantics(content, analysisType)

      const response: APIResponse = {
        success: true,
        data: result,
        metadata: {
          requestId: req.requestId,
          timestamp: new Date(),
          processingTime: Date.now() - req.startTime
        }
      }

      res.json(response)
    } catch (error) {
      throw new Error(`语义分析失败: ${error}`)
    }
  }

  /**
   * 处理节点优化
   */
  private async handleOptimizeNode(req: StudioAPIRequest, res: Response): Promise<void> {
    try {
      const optimizeRequest: StudioAIOptimizeRequest = req.body

      if (!optimizeRequest.nodeId || !optimizeRequest.currentContent) {
        const response: APIResponse = {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'nodeId 和 currentContent 字段是必需的'
          },
          metadata: {
            requestId: req.requestId,
            timestamp: new Date(),
            processingTime: Date.now() - req.startTime
          }
        }
        return res.status(400).json(response)
      }

      const result = await this.adapter.optimizeNode(optimizeRequest)

      const response: APIResponse<StudioAIGenerateResponse> = {
        success: true,
        data: result,
        metadata: {
          requestId: req.requestId,
          timestamp: new Date(),
          processingTime: Date.now() - req.startTime
        }
      }

      res.json(response)
    } catch (error) {
      throw new Error(`节点优化失败: ${error}`)
    }
  }

  /**
   * 处理处理状态查询
   */
  private async handleGetProcessingState(req: StudioAPIRequest, res: Response): Promise<void> {
    try {
      const { nodeId } = req.params

      if (!nodeId) {
        const response: APIResponse = {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'nodeId 参数是必需的'
          },
          metadata: {
            requestId: req.requestId,
            timestamp: new Date(),
            processingTime: Date.now() - req.startTime
          }
        }
        return res.status(400).json(response)
      }

      const state = await this.adapter.getProcessingState(nodeId)

      const response: APIResponse = {
        success: true,
        data: state,
        metadata: {
          requestId: req.requestId,
          timestamp: new Date(),
          processingTime: Date.now() - req.startTime
        }
      }

      res.json(response)
    } catch (error) {
      throw new Error(`获取处理状态失败: ${error}`)
    }
  }

  /**
   * 处理统计信息查询
   */
  private async handleGetStats(req: StudioAPIRequest, res: Response): Promise<void> {
    try {
      const stats = await this.aiEngine.getStats()

      const response: APIResponse = {
        success: true,
        data: stats,
        metadata: {
          requestId: req.requestId,
          timestamp: new Date(),
          processingTime: Date.now() - req.startTime
        }
      }

      res.json(response)
    } catch (error) {
      throw new Error(`获取统计信息失败: ${error}`)
    }
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `studio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 创建 Studio API 路由器的工厂函数
 */
export function createStudioAPIRouter(aiEngine: AIEngine): Router {
  const apiRouter = new StudioAPIRouter(aiEngine)
  return apiRouter.getRouter()
}

// 扩展 Express Request 接口
declare global {
  namespace Express {
    interface Request {
      requestId?: string
      startTime?: number
    }
  }
}