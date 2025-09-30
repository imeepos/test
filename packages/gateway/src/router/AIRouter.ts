import { Router } from 'express'
import type { ApiRequest, ApiResponse } from '../types/ApiTypes'
import { BatchGenerateRequest } from '../types/SpecificTypes'
import { ResponseMapper } from '../adapters/ResponseMapper'
import { BaseRouter, RouterDependencies } from './BaseRouter'
import {
  UnifiedAITaskType,
  UnifiedTaskStatus,
  TaskPriority,
  UnifiedAITaskMessage,
  TaskMetadata
} from '@sker/models'

// 类型别名以兼容现有代码
type AITaskType = UnifiedAITaskType
type AITaskStatus = UnifiedTaskStatus

/**
 * AI服务路由器 - 处理AI内容生成、优化、融合等功能
 */
export class AIRouter extends BaseRouter {
  constructor(dependencies?: RouterDependencies) {
    super(dependencies)
    this.setupRoutes()
  }

  protected setupRoutes(): void {
    // 生成内容
    this.router.post('/generate', this.generateContent.bind(this))

    // 优化内容
    this.router.post('/optimize', this.optimizeContent.bind(this))

    // 融合内容
    this.router.post('/fusion', this.fusionContent.bind(this))

    // 健康检查
    this.router.get('/health', this.checkAIHealth.bind(this))

    // 获取可用模型
    this.router.get('/models', this.getAvailableModels.bind(this))

    // 批量处理
    this.router.post('/batch-generate', this.batchGenerate.bind(this))
  }

  private async generateContent(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      // 检查队列管理器是否可用
      if (!this.queueManager) {
        // 回退到直接调用AI引擎
        return this.generateContentDirect(req, res)
      }

      const { inputs, context, instruction, type = 'generate' } = req.body
      const userId = req.user?.id
      const projectId = req.body.projectId

      if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
        res.error(ResponseMapper.toAPIError(
          { message: '缺少必需的inputs参数' },
          req.requestId
        ))
        return
      }

      // 创建AI任务 - 符合UnifiedAITaskMessage接口
      const taskId = this.generateTaskId()
      const aiTask: UnifiedAITaskMessage = {
        taskId,
        type: type === 'content_generation' ? 'generate' : 'generate',
        inputs: inputs || [],
        context: context,
        instruction: instruction,
        parameters: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 2000
        },
        nodeId: req.params.nodeId || '',
        projectId,
        userId,
        priority: 'normal' as TaskPriority,
        timestamp: new Date(),
        metadata: {
          originalRequestId: req.requestId,
          sessionId: req.sessionId,
          tags: ['gateway_api'],
          model: 'gpt-3.5-turbo'
        }
      }

      // 发布任务到队列
      await this.queueManager.publishAITask(aiTask)

      // 返回任务ID，客户端通过WebSocket接收结果
      res.success(ResponseMapper.toAPISuccess(
        {
          taskId,
          status: 'queued' as AITaskStatus,
          message: '任务已提交到处理队列，结果将通过WebSocket推送'
        },
        'AI任务已提交',
        req.requestId
      ))

    } catch (error) {
      console.error('生成内容失败:', error)
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }

  private async optimizeContent(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      // 检查队列管理器是否可用
      if (!this.queueManager) {
        // 回退到直接调用AI引擎
        return this.optimizeContentDirect(req, res)
      }

      const { content, instruction } = req.body
      const userId = req.user?.id
      const projectId = req.body.projectId

      if (!content) {
        res.error(ResponseMapper.toAPIError(
          { message: '缺少必需的content参数' },
          req.requestId
        ))
        return
      }

      // 创建AI优化任务
      const taskId = this.generateTaskId()
      const aiTask = {
        taskId,
        type: 'content_optimization' as AITaskType,
        status: 'queued' as AITaskStatus,
        priority: 'normal' as TaskPriority,
        userId,
        projectId,
        data: {
          inputs: [content],
          instruction: instruction || '请优化这段内容，使其更清晰、准确和有条理',
          type: 'optimize'
        },
        metadata: {
          requestId: req.requestId,
          source: 'gateway_api',
          model: 'gpt-3.5-turbo',
          retryCount: 0,
          createdAt: new Date()
        },
        timestamp: new Date()
      }

      // 发布任务到队列
      await this.queueManager.publishAITask(aiTask)

      // 返回任务ID
      res.success(ResponseMapper.toAPISuccess(
        {
          taskId,
          status: 'queued' as AITaskStatus,
          message: '优化任务已提交到处理队列，结果将通过WebSocket推送'
        },
        'AI优化任务已提交',
        req.requestId
      ))

    } catch (error) {
      console.error('优化内容失败:', error)
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }

  private async fusionContent(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      // 检查队列管理器是否可用
      if (!this.queueManager) {
        // 回退到直接调用AI引擎
        return this.fusionContentDirect(req, res)
      }

      const { inputs, instruction } = req.body
      const userId = req.user?.id
      const projectId = req.body.projectId

      if (!inputs || !Array.isArray(inputs) || inputs.length < 2) {
        res.error(ResponseMapper.toAPIError(
          { message: '融合功能需要至少2个输入内容' },
          req.requestId
        ))
        return
      }

      // 创建AI融合任务 - 符合UnifiedAITaskMessage接口
      const taskId = this.generateTaskId()
      const aiTask: UnifiedAITaskMessage = {
        taskId,
        type: 'fusion' as UnifiedAITaskType,
        inputs: inputs,
        context: undefined,
        instruction: instruction || '请将这些内容融合成一个统一、连贯的内容',
        parameters: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          inputCount: inputs.length
        },
        nodeId: '',
        projectId,
        userId,
        priority: 'high' as TaskPriority, // 融合任务优先级较高
        timestamp: new Date(),
        metadata: {
          originalRequestId: req.requestId,
          tags: ['gateway_api', 'fusion'],
          model: 'gpt-3.5-turbo'
        }
      }

      // 发布任务到队列
      await this.queueManager.publishAITask(aiTask)

      // 返回任务ID
      res.success(ResponseMapper.toAPISuccess(
        {
          taskId,
          status: 'queued' as AITaskStatus,
          inputCount: inputs.length,
          message: '融合任务已提交到处理队列，结果将通过WebSocket推送'
        },
        'AI融合任务已提交',
        req.requestId
      ))

    } catch (error) {
      console.error('融合内容失败:', error)
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }

  private async checkAIHealth(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.aiEngine) {
        res.success({
          status: 'unavailable',
          message: 'AI 引擎服务未初始化',
          uptime: process.uptime()
        })
        return
      }

      const health = await this.aiEngine.getHealthStatus()
      res.success({
        status: health.status,
        models: [],
        statistics: {},
        uptime: health.uptime,
        lastCheck: new Date()
      })
    } catch (error) {
      res.error({
        code: 'AI_HEALTH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to check AI health',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async getAvailableModels(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.aiEngine) {
        res.success([])
        return
      }

      const config = this.aiEngine.getConfiguration()
      const providers = {}
      const models: string[] = []

      // 从配置中提取可用模型
      Object.values(providers).forEach((provider: Record<string, unknown>) => {
        if (provider.models && Array.isArray(provider.models)) {
          models.push(...(provider.models as string[]))
        }
      })

      res.success(models.length > 0 ? models : ['gpt-4', 'gpt-3.5-turbo'])
    } catch (error) {
      res.error({
        code: 'GET_MODELS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get available models',
        timestamp: new Date(),
        requestId: req.requestId
      })
    }
  }

  private async batchGenerate(req: ApiRequest<BatchGenerateRequest>, res: ApiResponse): Promise<void> {
    try {
      const { requests, options = {} } = req.body
      const userId = req.user?.id
      const projectId = req.body.projectId

      // 验证批量请求数据
      if (!requests || !Array.isArray(requests) || requests.length === 0) {
        res.error(ResponseMapper.toAPIError(
          { message: '缺少必需的requests参数或requests为空数组' },
          req.requestId
        ))
        return
      }

      // 限制批量请求数量
      const maxBatchSize = options.maxBatchSize || 10
      if (requests.length > maxBatchSize) {
        res.error(ResponseMapper.toAPIError(
          { message: `批量请求数量不能超过${maxBatchSize}个` },
          req.requestId
        ))
        return
      }

      // 检查队列管理器是否可用
      if (!this.queueManager) {
        // 回退到直接调用AI引擎
        return this.batchGenerateDirect(req, res)
      }

      // 创建批量任务 - 符合UnifiedAITaskMessage接口
      const batchTaskId = this.generateTaskId()
      const batchTask: UnifiedAITaskMessage = {
        taskId: batchTaskId,
        type: 'generate' as UnifiedAITaskType, // 批处理映射为generate
        inputs: requests.map(req => req.prompt || ''),
        context: undefined,
        instruction: 'Batch processing request',
        parameters: {
          model: 'gpt-3.5-turbo',
          batchOptions: {
            parallel: options.parallel !== false,
            failFast: options.failFast === true,
            maxConcurrency: Math.min(options.maxConcurrency || 3, requests.length)
          },
          requests: requests
        },
        nodeId: '',
        projectId,
        userId,
        priority: (options.priority || 'normal') as TaskPriority,
        timestamp: new Date(),
        metadata: {
          originalRequestId: req.requestId,
          tags: ['gateway_api', 'batch'],
          batchId: batchTaskId,
          model: 'gpt-3.5-turbo'
        }
      }

      // 发布批量任务到队列
      await this.queueManager.publishAITask(batchTask)

      // 返回批量任务ID
      res.success(ResponseMapper.toAPISuccess(
        {
          batchTaskId,
          status: 'queued' as AITaskStatus,
          batchSize: requests.length,
          estimatedTime: requests.length * 2, // 估算处理时间（秒）
          message: '批量任务已提交到处理队列，结果将通过WebSocket推送'
        },
        'AI批量任务已提交',
        req.requestId
      ))

    } catch (error) {
      console.error('批量生成内容失败:', error)
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }

  // 直接调用AI引擎的回退方法

  private async generateContentDirect(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkAIEngine(req, res)) return

      const { prompt, model, maxTokens, temperature, userId, projectId } = req.body

      const result = await this.aiEngine!.generateContent({
        prompt,
        model: model || 'gpt-4',
        maxTokens: maxTokens || 2000,
        temperature: temperature || 0.7,
        userId: userId || req.user?.id,
        projectId,
        metadata: {
          requestId: req.requestId,
          source: 'gateway_api_direct'
        }
      })

      const mappedResult = ResponseMapper.toAIGenerateResponse(result)
      res.success(ResponseMapper.toAPISuccess(
        mappedResult,
        'AI内容生成成功',
        req.requestId
      ))

    } catch (error) {
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }

  private async optimizeContentDirect(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkAIEngine(req, res)) return

      const { content, instruction, model, userId, projectId } = req.body

      const result = await this.aiEngine!.optimizeContent({
        content,
        instruction: instruction || '请优化这段内容，使其更清晰、准确和有条理',
        model: model || 'gpt-4',
        userId: userId || req.user?.id,
        projectId,
        metadata: {
          requestId: req.requestId,
          source: 'gateway_api_direct'
        }
      })

      const mappedResult = ResponseMapper.toAIGenerateResponse(result)
      res.success(ResponseMapper.toAPISuccess(
        mappedResult,
        'AI内容优化成功',
        req.requestId
      ))

    } catch (error) {
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }

  private async fusionContentDirect(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkAIEngine(req, res)) return

      const { inputs, instruction, model, userId, projectId } = req.body

      if (!inputs || !Array.isArray(inputs) || inputs.length < 2) {
        res.error(ResponseMapper.toAPIError(
          { message: '融合功能需要至少2个输入内容' },
          req.requestId
        ))
        return
      }

      const result = await this.aiEngine!.fuseContent({
        inputs,
        instruction: instruction || '请将这些内容融合成一个统一、连贯的内容',
        model: model || 'gpt-4',
        userId: userId || req.user?.id,
        projectId,
        metadata: {
          requestId: req.requestId,
          source: 'gateway_api_direct'
        }
      })

      const mappedResult = ResponseMapper.toAIGenerateResponse(result)
      res.success(ResponseMapper.toAPISuccess(
        {
          ...mappedResult,
          sources: inputs.length
        },
        'AI内容融合成功',
        req.requestId
      ))

    } catch (error) {
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }

  private async batchGenerateDirect(req: ApiRequest, res: ApiResponse): Promise<void> {
    try {
      if (!this.checkAIEngine(req, res)) return

      const { requests, options = {} } = req.body
      const userId = req.user?.id
      const projectId = req.body.projectId

      // 配置批量处理选项
      const batchOptions = {
        parallel: options.parallel !== false,
        failFast: options.failFast === true,
        maxConcurrency: Math.min(options.maxConcurrency || 3, requests.length)
      }

      const results = []
      const startTime = Date.now()

      if (batchOptions.parallel) {
        // 并行处理（使用Promise.allSettled控制并发）
        const chunks = []
        for (let i = 0; i < requests.length; i += batchOptions.maxConcurrency) {
          chunks.push(requests.slice(i, i + batchOptions.maxConcurrency))
        }

        for (const chunk of chunks) {
          const chunkResults = await Promise.allSettled(
            chunk.map(request => this.aiEngine!.generateContent({
              prompt: request.prompt || request.inputs?.join('\n'),
              model: request.model || 'gpt-4',
              maxTokens: request.maxTokens || 2000,
              temperature: request.temperature || 0.7,
              userId: userId,
              projectId,
              metadata: {
                requestId: req.requestId,
                source: 'gateway_api_batch_direct',
                batchIndex: results.length + chunk.indexOf(request)
              }
            }))
          )

          // 处理块结果
          for (let i = 0; i < chunkResults.length; i++) {
            const result = chunkResults[i]
            if (result.status === 'fulfilled') {
              results.push(ResponseMapper.toAIGenerateResponse(result.value))
            } else {
              results.push({
                content: `批量处理失败: ${result.reason}`,
                confidence: 0,
                tags: [],
                metadata: {
                  requestId: req.requestId,
                  model: 'gpt-4',
                  processingTime: 0,
                  tokenCount: 0,
                  error: result.reason,
                  batchIndex: results.length
                }
              })

              // 如果启用快速失败，遇到错误就立即返回
              if (batchOptions.failFast) {
                break
              }
            }
          }

          if (batchOptions.failFast && results.some(r => r.metadata?.error)) {
            break
          }
        }
      } else {
        // 顺序处理
        for (let i = 0; i < requests.length; i++) {
          try {
            const request = requests[i]
            const result = await this.aiEngine!.generateContent({
              prompt: request.prompt || request.inputs?.join('\n'),
              model: request.model || 'gpt-4',
              maxTokens: request.maxTokens || 2000,
              temperature: request.temperature || 0.7,
              userId: userId,
              projectId,
              metadata: {
                requestId: req.requestId,
                source: 'gateway_api_batch_direct',
                batchIndex: i
              }
            })

            results.push(ResponseMapper.toAIGenerateResponse(result))
          } catch (error) {
            results.push({
              content: `批量处理失败: ${error}`,
              confidence: 0,
              tags: [],
              metadata: {
                requestId: req.requestId,
                model: 'gpt-4',
                processingTime: 0,
                tokenCount: 0,
                error: error,
                batchIndex: i
              }
            })

            if (batchOptions.failFast) {
              break
            }
          }
        }
      }

      const totalTime = Date.now() - startTime
      const successCount = results.filter(r => !r.metadata?.error).length
      const failureCount = results.length - successCount

      res.success(ResponseMapper.toAPISuccess(
        {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount,
            processingTime: totalTime,
            successRate: (successCount / results.length * 100).toFixed(1) + '%'
          }
        },
        'AI批量内容生成完成',
        req.requestId
      ))

    } catch (error) {
      res.error(ResponseMapper.toAPIError(error, req.requestId))
    }
  }
}