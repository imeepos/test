import { AIEngine } from '../core/AIEngine.js'
import type {
  GenerateRequest,
  GenerateResult,
  AITaskRequest,
  AITaskResult,
  BatchProcessRequest,
  SemanticAnalysisRequest,
  SemanticAnalysisResult
} from '../types/index.js'
import { PromptBuilder } from '../templates/PromptBuilder.js'

/**
 * 前端 Studio 接口类型定义（对应前端类型）
 */
export interface StudioAIGenerateRequest {
  inputs: string[]
  context?: string
  nodeId?: string
  type?: string
  instruction?: string
  options?: StudioAIGenerateOptions
}

export interface StudioAIGenerateOptions {
  temperature?: number
  maxTokens?: number
  model?: StudioAIModel
  prompt?: string
}

export type StudioAIModel = 'gpt-3.5-turbo' | 'gpt-4' | 'claude-3' | 'local'

export interface StudioAIGenerateResponse {
  content: string
  title?: string
  confidence: number
  reasoning?: string
  suggestions?: string[]
  tags: string[]
  importance?: number
  metadata?: {
    requestId?: string
    model?: StudioAIModel
    processingTime?: number
    tokenCount?: number
    error?: any
  }
}

export interface StudioAIOptimizeRequest {
  nodeId: string
  currentContent: string
  context?: string
  focusArea?: StudioOptimizationFocus
}

export type StudioOptimizationFocus =
  | 'clarity'
  | 'detail'
  | 'structure'
  | 'accuracy'
  | 'completeness'

export interface StudioAIProcessingState {
  nodeId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress?: number
  startTime: Date
  endTime?: Date
  error?: string
}

/**
 * Studio API 适配器 - 将 Engine 接口适配为前端 Studio 期望的接口
 */
export class StudioAPIAdapter {
  private aiEngine: AIEngine

  constructor(aiEngine: AIEngine) {
    this.aiEngine = aiEngine
  }

  /**
   * 适配 AI 内容生成接口
   */
  async generateContent(request: StudioAIGenerateRequest): Promise<StudioAIGenerateResponse> {
    try {
      // 构建 prompt
      const prompt = PromptBuilder.buildGenerate({
        inputs: request.inputs,
        instruction: request.instruction || this.getDefaultInstruction(request.type),
        context: request.context
      })

      // 将 Studio 请求转换为 Engine 请求
      const engineRequest: GenerateRequest = {
        prompt,
        context: request.context,
        temperature: request.options?.temperature || 0.7,
        maxTokens: request.options?.maxTokens || 2000,
        model: this.mapStudioModelToEngine(request.options?.model || 'gpt-3.5-turbo')
      }

      // 调用 Engine 生成内容
      const engineResult: GenerateResult = await this.aiEngine.generateContent(engineRequest)

      // 转换为 Studio 响应格式
      const studioResponse: StudioAIGenerateResponse = {
        content: engineResult.content,
        title: engineResult.title,
        confidence: engineResult.confidence,
        reasoning: engineResult.reasoning,
        suggestions: engineResult.suggestions,
        tags: engineResult.tags || [],
        importance: engineResult.importance,
        metadata: {
          requestId: engineResult.metadata?.requestId,
          model: this.mapEngineModelToStudio(engineResult.metadata?.model),
          processingTime: engineResult.metadata?.processingTime,
          tokenCount: engineResult.metadata?.tokenCount,
          error: engineResult.metadata?.error
        }
      }

      return studioResponse
    } catch (error) {
      throw new Error(`AI内容生成失败: ${error instanceof Error ? error.message : error}`)
    }
  }

  /**
   * 适配内容优化接口
   */
  async optimizeContent(
    content: string,
    context?: string,
    targetStyle?: string
  ): Promise<StudioAIGenerateResponse> {
    const instruction = `请优化以下内容${targetStyle ? `，风格要求：${targetStyle}` : ''}`

    return this.generateContent({
      inputs: [content],
      context,
      instruction,
      type: 'optimize'
    })
  }

  /**
   * 适配多输入融合生成
   */
  async fusionGenerate(
    inputs: string[],
    fusionType: 'summary' | 'synthesis' | 'comparison' = 'synthesis'
  ): Promise<StudioAIGenerateResponse> {
    if (inputs.length < 2) {
      throw new Error('融合生成至少需要2个输入')
    }

    return this.generateContent({
      inputs,
      type: 'fusion',
      instruction: this.getFusionInstruction(fusionType)
    })
  }

  /**
   * 适配智能标题生成
   */
  async generateTitle(content: string): Promise<string> {
    try {
      const response = await this.generateContent({
        inputs: [content],
        type: 'title',
        instruction: '为以下内容生成一个简洁准确的标题（不超过20个字符）'
      })

      return response.title || response.content.slice(0, 20)
    } catch (error) {
      // 如果AI生成失败，使用内容前缀作为标题
      return content.slice(0, 20) + (content.length > 20 ? '...' : '')
    }
  }

  /**
   * 适配语义标签提取
   */
  async extractTags(content: string): Promise<string[]> {
    try {
      const response = await this.generateContent({
        inputs: [content],
        type: 'tags',
        instruction: '为以下内容提取3-5个关键标签，返回JSON数组格式'
      })

      // 尝试解析JSON格式的标签
      if (response.content.startsWith('[')) {
        return JSON.parse(response.content)
      }

      // 如果不是JSON，按逗号分割
      return response.content.split(',').map(tag => tag.trim()).slice(0, 5)
    } catch (error) {
      return []
    }
  }

  /**
   * 适配批量处理请求
   */
  async batchGenerate(requests: StudioAIGenerateRequest[]): Promise<StudioAIGenerateResponse[]> {
    try {
      // 转换为 Engine 批处理请求
      const batchRequest: BatchProcessRequest = {
        tasks: requests.map(req => ({
          id: req.nodeId || `batch-${Date.now()}-${Math.random()}`,
          type: 'generate',
          data: {
            inputs: req.inputs,
            context: req.context,
            instruction: req.instruction || this.getDefaultInstruction(req.type),
            options: {
              temperature: req.options?.temperature || 0.7,
              maxTokens: req.options?.maxTokens || 2000,
              model: this.mapStudioModelToEngine(req.options?.model || 'gpt-3.5-turbo')
            }
          }
        })),
        concurrency: 3, // 并发数
        failFast: false
      }

      // 调用 Engine 批处理 - 注意：需要先实现batchProcess方法
      const batchResults = await Promise.allSettled(
        batchRequest.tasks.map(task =>
          this.aiEngine.processTask({
            type: task.type as any,
            inputs: task.data.inputs || [],
            instruction: task.data.instruction,
            context: task.data.context,
            options: task.data.options
          })
        )
      )

      const batchResult = {
        results: batchResults.map((result, index) => ({
          success: result.status === 'fulfilled',
          data: result.status === 'fulfilled' ? result.value : null,
          error: result.status === 'rejected' ? result.reason : null
        }))
      }

      // 转换结果
      return batchResult.results.map((result, index) => {
        if (result.success && result.data) {
          const engineResult = result.data as GenerateResult
          return {
            content: engineResult.content,
            title: engineResult.title,
            confidence: engineResult.confidence,
            reasoning: engineResult.reasoning,
            suggestions: engineResult.suggestions,
            tags: engineResult.tags || [],
            importance: engineResult.importance,
            metadata: {
              requestId: engineResult.metadata?.requestId,
              model: this.mapEngineModelToStudio(engineResult.metadata?.model),
              processingTime: engineResult.metadata?.processingTime,
              tokenCount: engineResult.metadata?.tokenCount
            }
          } as StudioAIGenerateResponse
        } else {
          // 失败的请求返回默认响应
          return {
            content: `生成失败: ${result.error}`,
            confidence: 0,
            tags: [],
            metadata: {
              requestId: `failed-${Date.now()}-${index}`,
              model: 'gpt-3.5-turbo',
              processingTime: 0,
              tokenCount: 0,
              error: result.error
            }
          } as StudioAIGenerateResponse
        }
      })
    } catch (error) {
      throw new Error(`批量生成失败: ${error instanceof Error ? error.message : error}`)
    }
  }

  /**
   * 适配节点优化请求
   */
  async optimizeNode(request: StudioAIOptimizeRequest): Promise<StudioAIGenerateResponse> {
    try {
      const instruction = this.getOptimizationInstruction(request.focusArea)

      return this.generateContent({
        inputs: [request.currentContent],
        context: request.context,
        nodeId: request.nodeId,
        type: 'optimize',
        instruction
      })
    } catch (error) {
      throw new Error(`节点优化失败: ${error instanceof Error ? error.message : error}`)
    }
  }

  /**
   * 适配语义分析接口
   */
  async analyzeSemantics(content: string, analysisType: 'basic' | 'deep' = 'basic'): Promise<{
    semanticTypes: string[]
    entities: Array<{ text: string; type: string; confidence: number }>
    relations: Array<{ source: string; target: string; relation: string }>
    sentiment: { score: number; label: string }
    summary: string
  }> {
    try {
      const analysisRequest: SemanticAnalysisRequest = {
        content,
        options: {
          extractEntities: true,
          extractRelations: true,
          analyzeSentiment: true,
          analysisDepth: analysisType,
          includeEmbeddings: false
        }
      }

      // 使用现有的analyzeContent方法
      const analysis = await this.aiEngine.analyzeContent(content, {
        extractTags: analysisRequest.options.extractEntities,
        analyzeSentiment: analysisRequest.options.analyzeSentiment,
        detectTopics: true,
        evaluateComplexity: analysisType === 'deep'
      })

      const analysisResult: SemanticAnalysisResult = {
        semanticTypes: [analysis.semanticType],
        entities: analysis.entities || [],
        relations: [], // 简化实现，暂时返回空数组
        sentiment: {
          score: analysis.sentimentScore || 0,
          label: analysis.sentiment
        },
        summary: `语义类型: ${analysis.semanticType}, 复杂度: ${analysis.complexity}`
      }

      return {
        semanticTypes: analysisResult.semanticTypes,
        entities: analysisResult.entities,
        relations: analysisResult.relations,
        sentiment: analysisResult.sentiment,
        summary: analysisResult.summary
      }
    } catch (error) {
      throw new Error(`语义分析失败: ${error instanceof Error ? error.message : error}`)
    }
  }

  /**
   * 检查AI服务健康状态
   */
  async checkHealth(): Promise<boolean> {
    try {
      const stats = this.aiEngine.getStats()
      return stats.successfulRequests > 0 || stats.totalRequests === 0
    } catch {
      return false
    }
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels(): Promise<StudioAIModel[]> {
    try {
      // 返回支持的模型列表
      return ['gpt-3.5-turbo', 'gpt-4', 'claude-3']
    } catch {
      return ['gpt-3.5-turbo', 'gpt-4']
    }
  }

  /**
   * 获取处理状态（用于实时更新）
   */
  async getProcessingState(nodeId: string): Promise<StudioAIProcessingState | null> {
    try {
      // 简化实现：检查引擎状态来判断是否有任务在处理
      const stats = this.aiEngine.getStats()

      // 如果有成功或失败的请求，说明引擎在工作
      if (stats.totalRequests > 0) {
        return {
          nodeId,
          status: 'completed',
          startTime: new Date(Date.now() - 10000), // 假设10秒前开始
          endTime: new Date(),
          progress: 100
        }
      }

      return null
    } catch {
      return null
    }
  }

  // 私有辅助方法

  /**
   * 获取默认指令
   */
  private getDefaultInstruction(type?: string): string {
    const instructions: Record<string, string> = {
      'generate': '请生成相关的高质量内容',
      'optimize': '请优化以下内容，提高清晰度和准确性',
      'fusion': '请综合以下多个内容，生成统一的整合内容',
      'title': '为以下内容生成一个简洁准确的标题',
      'tags': '为以下内容提取关键标签',
      'summary': '请总结以下内容的核心要点',
      'expand': '请扩展以下内容，添加更多细节和深度'
    }

    return instructions[type || 'generate'] || instructions['generate']
  }

  /**
   * 获取融合指令
   */
  private getFusionInstruction(type: string): string {
    const instructions: Record<string, string> = {
      summary: '请总结以下多个内容的核心要点',
      synthesis: '请综合以下多个内容，生成统一的整合内容',
      comparison: '请比较分析以下多个内容的异同点'
    }
    return instructions[type] || instructions['synthesis']
  }

  /**
   * 获取优化指令
   */
  private getOptimizationInstruction(focusArea?: StudioOptimizationFocus): string {
    const instructions: Record<string, string> = {
      clarity: '请优化内容的清晰度和可理解性',
      detail: '请为内容添加更多细节和具体信息',
      structure: '请优化内容的结构和逻辑组织',
      accuracy: '请提高内容的准确性和精确性',
      completeness: '请完善内容，确保信息的完整性'
    }

    return instructions[focusArea || 'clarity'] || '请优化以下内容'
  }

  /**
   * 映射 Studio 模型到 Engine 模型
   */
  private mapStudioModelToEngine(studioModel: StudioAIModel): string {
    const modelMap: Record<StudioAIModel, string> = {
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
      'gpt-4': 'gpt-4',
      'claude-3': 'claude-3-sonnet',
      'local': 'gpt-3.5-turbo' // 本地模型映射到默认模型
    }

    return modelMap[studioModel] || 'gpt-3.5-turbo'
  }

  /**
   * 映射 Engine 模型到 Studio 模型
   */
  private mapEngineModelToStudio(engineModel?: string): StudioAIModel {
    if (!engineModel) return 'gpt-3.5-turbo'

    const modelMap: Record<string, StudioAIModel> = {
      'gpt-3.5-turbo': 'gpt-3.5-turbo',
      'gpt-4': 'gpt-4',
      'claude-3-sonnet': 'claude-3',
      'claude-3-opus': 'claude-3',
      'claude-3-haiku': 'claude-3'
    }

    return modelMap[engineModel] || 'gpt-3.5-turbo'
  }
}

/**
 * 创建 Studio API 适配器的工厂函数
 */
export function createStudioAPIAdapter(aiEngine: AIEngine): StudioAPIAdapter {
  return new StudioAPIAdapter(aiEngine)
}