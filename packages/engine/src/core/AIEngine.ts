import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'
import type {
  EngineConfig,
  AITaskRequest,
  AITaskResult,
  GenerateRequest,
  GenerateResult,
  OptimizeRequest,
  OptimizeResult,
  FusionRequest,
  FusionResult,
  ExpandRequest,
  ExpandResult,
  SemanticOptions,
  SemanticAnalysis,
  AIProvider,
  ProcessingMetadata,
  AIEngineError,
  UsageStats,
  CacheConfig,
  CacheEntry
} from '@/types'
import { OpenAIProvider } from '@/providers/OpenAIProvider'
import { ContentGenerator } from './ContentGenerator'
import { SemanticAnalyzer } from './SemanticAnalyzer'
import { PromptTemplate } from './PromptTemplate'

/**
 * AI引擎核心类
 * 提供统一的AI处理接口，支持内容生成、优化、融合和语义分析
 */
export class AIEngine extends EventEmitter {
  private provider: AIProvider
  private contentGenerator: ContentGenerator
  private semanticAnalyzer: SemanticAnalyzer
  private templates: Map<string, PromptTemplate>
  private config: EngineConfig
  private stats: UsageStats
  private cache: Map<string, CacheEntry>
  private cacheConfig: CacheConfig

  constructor(config: EngineConfig) {
    super()

    this.config = config
    this.templates = new Map()
    this.cache = new Map()

    // 初始化缓存配置
    this.cacheConfig = {
      enabled: true,
      ttl: 3600000, // 1小时
      maxSize: 1000,
      strategy: 'lru'
    }

    // 初始化统计信息
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageProcessingTime: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      modelUsage: {},
      errorDistribution: {},
      lastResetAt: new Date()
    }

    // 初始化服务提供者
    this.initializeProvider()

    // 初始化组件
    this.contentGenerator = new ContentGenerator(this.provider)
    this.semanticAnalyzer = new SemanticAnalyzer(this.provider)

    // 设置定期清理缓存
    this.setupCacheCleanup()
  }

  /**
   * 初始化AI服务提供者
   */
  private initializeProvider(): void {
    switch (this.config.provider) {
      case 'openai':
        this.provider = new OpenAIProvider({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseURL,
          organization: this.config.organization,
          defaultModel: this.config.defaultModel,
          timeout: this.config.timeout
        })
        break
      case 'anthropic':
        throw new Error('Anthropic provider not implemented yet')
      case 'custom':
        throw new Error('Custom provider must be provided')
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`)
    }
  }

  /**
   * 设置缓存清理
   */
  private setupCacheCleanup(): void {
    setInterval(() => {
      this.cleanExpiredCache()
    }, 300000) // 每5分钟清理一次
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp.getTime() > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(request: any): string {
    return `cache_${JSON.stringify(request)}`
  }

  /**
   * 从缓存获取结果
   */
  private getFromCache<T>(key: string): T | null {
    if (!this.cacheConfig.enabled) return null

    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp.getTime() > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    entry.hits++
    return entry.value as T
  }

  /**
   * 存储到缓存
   */
  private setToCache(key: string, value: any, ttl?: number): void {
    if (!this.cacheConfig.enabled) return

    // 如果缓存已满，删除最少使用的条目
    if (this.cache.size >= this.cacheConfig.maxSize) {
      this.evictLeastUsed()
    }

    const entry: CacheEntry = {
      key,
      value,
      timestamp: new Date(),
      ttl: ttl || this.cacheConfig.ttl,
      hits: 0
    }

    this.cache.set(key, entry)
  }

  /**
   * 删除最少使用的缓存条目
   */
  private evictLeastUsed(): void {
    let leastUsedKey = ''
    let leastHits = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits
        leastUsedKey = key
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(metadata: ProcessingMetadata, success: boolean, error?: any): void {
    this.stats.totalRequests++

    if (success) {
      this.stats.successfulRequests++
    } else {
      this.stats.failedRequests++
      if (error?.code) {
        this.stats.errorDistribution[error.code] =
          (this.stats.errorDistribution[error.code] || 0) + 1
      }
    }

    // 更新平均处理时间
    this.stats.averageProcessingTime =
      (this.stats.averageProcessingTime * (this.stats.totalRequests - 1) +
       metadata.processingTime) / this.stats.totalRequests

    // 更新token和成本统计
    this.stats.totalTokensUsed += metadata.tokenCount
    if (metadata.cost) {
      this.stats.totalCost = (this.stats.totalCost || 0) + metadata.cost
    }

    // 更新模型使用统计
    this.stats.modelUsage[metadata.model] =
      (this.stats.modelUsage[metadata.model] || 0) + 1
  }

  /**
   * 创建处理元数据
   */
  private createMetadata(model: string, startTime: number, tokenCount: number): ProcessingMetadata {
    return {
      model,
      tokenCount,
      processingTime: Date.now() - startTime,
      temperature: this.config.temperature,
      requestId: uuidv4(),
      timestamp: new Date(),
      cost: this.calculateCost(model, tokenCount)
    }
  }

  /**
   * 计算成本（简单示例）
   */
  private calculateCost(model: string, tokenCount: number): number {
    const costPerToken: Record<string, number> = {
      'gpt-4': 0.00003,
      'gpt-3.5-turbo': 0.0000015,
      'gpt-4-turbo': 0.00001
    }

    return (costPerToken[model] || 0.00001) * tokenCount
  }

  /**
   * 处理AI任务的统一入口
   */
  async processTask(request: AITaskRequest): Promise<AITaskResult> {
    const startTime = Date.now()
    const cacheKey = this.generateCacheKey(request)

    try {
      // 尝试从缓存获取结果
      const cachedResult = this.getFromCache<AITaskResult>(cacheKey)
      if (cachedResult) {
        this.emit('cache_hit', { request, result: cachedResult })
        return cachedResult
      }

      let result: AITaskResult

      switch (request.type) {
        case 'generate':
          const generateReq: GenerateRequest = {
            prompt: request.instruction || '生成内容',
            inputs: request.inputs,
            context: request.context,
            style: request.options?.style,
            length: request.options?.length,
            model: request.options?.model,
            temperature: request.options?.temperature
          }
          const generateResult = await this.generateContent(generateReq)
          result = this.convertToTaskResult(generateResult, request.type)
          break

        case 'optimize':
          if (request.inputs.length === 0) {
            throw new Error('优化任务需要提供要优化的内容')
          }
          const optimizeReq: OptimizeRequest = {
            content: request.inputs[0],
            instruction: request.instruction || '优化内容',
            context: request.context,
            model: request.options?.model
          }
          const optimizeResult = await this.optimizeContent(optimizeReq)
          result = this.convertOptimizeToTaskResult(optimizeResult, request.type)
          break

        case 'fusion':
          const fusionReq: FusionRequest = {
            inputs: request.inputs,
            instruction: request.instruction || '融合内容',
            context: request.context,
            fusionType: 'synthesis',
            model: request.options?.model
          }
          const fusionResult = await this.fusionGenerate(fusionReq)
          result = this.convertFusionToTaskResult(fusionResult, request.type)
          break

        case 'expand':
          if (request.inputs.length === 0) {
            throw new Error('扩展任务需要提供基础内容')
          }
          const expandReq: ExpandRequest = {
            baseContent: request.inputs[0],
            instruction: request.instruction || '扩展内容',
            context: request.context,
            expansionType: 'detail',
            model: request.options?.model
          }
          const expandResult = await this.expandContent(expandReq)
          result = this.convertExpandToTaskResult(expandResult, request.type)
          break

        case 'analyze':
          if (request.inputs.length === 0) {
            throw new Error('分析任务需要提供要分析的内容')
          }
          const analysisResult = await this.analyzeContent(request.inputs[0])
          result = this.convertAnalysisToTaskResult(analysisResult, request.type)
          break

        default:
          throw new Error(`不支持的任务类型: ${request.type}`)
      }

      // 缓存结果
      this.setToCache(cacheKey, result)

      // 更新统计信息
      this.updateStats(result.metadata, true)

      // 发送事件
      this.emit('task_completed', { request, result })

      return result

    } catch (error) {
      const metadata = this.createMetadata(
        request.options?.model || this.config.defaultModel,
        startTime,
        0
      )

      const result: AITaskResult = {
        success: false,
        content: '',
        confidence: 0,
        tags: [],
        metadata,
        error: {
          code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error,
          timestamp: new Date()
        }
      }

      // 更新统计信息
      this.updateStats(metadata, false, result.error)

      // 发送事件
      this.emit('task_failed', { request, error: result.error })

      return result
    }
  }

  /**
   * 生成内容
   */
  async generateContent(request: GenerateRequest): Promise<GenerateResult> {
    this.emit('generate_started', { request })

    try {
      const result = await this.contentGenerator.generate(request)
      this.emit('generate_completed', { request, result })
      return result
    } catch (error) {
      this.emit('generate_failed', { request, error })
      throw error
    }
  }

  /**
   * 优化内容
   */
  async optimizeContent(request: OptimizeRequest): Promise<OptimizeResult> {
    this.emit('optimize_started', { request })

    try {
      const result = await this.contentGenerator.optimize(request)
      this.emit('optimize_completed', { request, result })
      return result
    } catch (error) {
      this.emit('optimize_failed', { request, error })
      throw error
    }
  }

  /**
   * 融合生成内容
   */
  async fusionGenerate(request: FusionRequest): Promise<FusionResult> {
    this.emit('fusion_started', { request })

    try {
      const result = await this.contentGenerator.fusion(request)
      this.emit('fusion_completed', { request, result })
      return result
    } catch (error) {
      this.emit('fusion_failed', { request, error })
      throw error
    }
  }

  /**
   * 扩展内容
   */
  async expandContent(request: ExpandRequest): Promise<ExpandResult> {
    this.emit('expand_started', { request })

    try {
      const result = await this.contentGenerator.expand(request)
      this.emit('expand_completed', { request, result })
      return result
    } catch (error) {
      this.emit('expand_failed', { request, error })
      throw error
    }
  }

  /**
   * 分析内容
   */
  async analyzeContent(content: string, options?: SemanticOptions): Promise<SemanticAnalysis> {
    this.emit('analyze_started', { content, options })

    try {
      const result = await this.semanticAnalyzer.analyze(content, options || {})
      this.emit('analyze_completed', { content, result })
      return result
    } catch (error) {
      this.emit('analyze_failed', { content, error })
      throw error
    }
  }

  /**
   * 使用模板处理
   */
  async processWithTemplate(templateName: string, variables: Record<string, any>): Promise<AITaskResult> {
    const template = this.templates.get(templateName)
    if (!template) {
      throw new Error(`模板不存在: ${templateName}`)
    }

    const prompt = template.compile(variables)
    const request: GenerateRequest = {
      prompt,
      inputs: variables.inputs || [],
      context: variables.context,
      style: variables.style,
      length: variables.length
    }

    const result = await this.generateContent(request)
    return this.convertToTaskResult(result, 'generate')
  }

  /**
   * 添加模板
   */
  addTemplate(template: PromptTemplate): void {
    this.templates.set(template.getName(), template)
  }

  /**
   * 获取统计信息
   */
  getStats(): UsageStats {
    return { ...this.stats }
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageProcessingTime: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      modelUsage: {},
      errorDistribution: {},
      lastResetAt: new Date()
    }
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 转换结果格式的辅助方法
   */
  private convertToTaskResult(result: GenerateResult, type: string): AITaskResult {
    return {
      success: true,
      content: result.content,
      title: result.title,
      confidence: result.confidence,
      tags: result.tags,
      metadata: result.metadata
    }
  }

  private convertOptimizeToTaskResult(result: OptimizeResult, type: string): AITaskResult {
    return {
      success: true,
      content: result.optimizedContent,
      title: result.improvementSummary,
      confidence: result.confidence,
      tags: result.changes,
      metadata: result.metadata
    }
  }

  private convertFusionToTaskResult(result: FusionResult, type: string): AITaskResult {
    return {
      success: true,
      content: result.fusedContent,
      confidence: result.confidence,
      tags: result.keyInsights,
      metadata: result.metadata
    }
  }

  private convertExpandToTaskResult(result: ExpandResult, type: string): AITaskResult {
    return {
      success: true,
      content: result.expandedContent,
      confidence: result.confidence,
      tags: result.addedSections,
      metadata: result.metadata
    }
  }

  private convertAnalysisToTaskResult(result: SemanticAnalysis, type: string): AITaskResult {
    return {
      success: true,
      content: JSON.stringify(result, null, 2),
      confidence: result.confidence,
      tags: result.tags,
      metadata: result.metadata
    }
  }
}