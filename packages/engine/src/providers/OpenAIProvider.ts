import OpenAI from 'openai'
import { encoding_for_model } from 'tiktoken'
import { v4 as uuidv4 } from 'uuid'
import type {
  AIProvider,
  GenerateRequest,
  GenerateResult,
  OptimizeRequest,
  OptimizeResult,
  SemanticOptions,
  SemanticAnalysis,
  ProcessingMetadata
} from '../types/index.js'

/**
 * OpenAI服务提供者配置
 */
export interface OpenAIProviderConfig {
  apiKey: string
  baseURL?: string
  organization?: string
  defaultModel: string
  timeout?: number
}

/**
 * OpenAI服务提供者
 * 实现与OpenAI API的集成
 */
export class OpenAIProvider implements AIProvider {
  private client: OpenAI
  private config: OpenAIProviderConfig
  public readonly name = 'OpenAI'

  constructor(config: OpenAIProviderConfig) {
    this.config = config

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
      timeout: config.timeout || 60000
    })
  }

  /**
   * 生成内容
   */
  async generate(request: GenerateRequest): Promise<GenerateResult> {
    const startTime = Date.now()
    const model = request.model || this.config.defaultModel

    try {
      // 构建消息
      const messages = this.buildMessages(request.prompt, request.context, request.systemPrompt)

      // 调用OpenAI API
      const completion = await this.client.chat.completions.create({
        model,
        messages,
        temperature: request.temperature || 0.7,
        max_tokens: this.getMaxTokens(model),
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })

      const content = completion.choices[0]?.message?.content || ''
      const tokensUsed = completion.usage?.total_tokens || 0

      // 生成标题和标签
      const { title, tags, confidence } = await this.extractMetadata(content)

      // 创建元数据
      const metadata = this.createMetadata(model, startTime, tokensUsed)

      return {
        content,
        title,
        confidence,
        tags,
        metadata
      }

    } catch (error) {
      throw this.handleError(error, 'generate')
    }
  }

  /**
   * 优化内容
   */
  async optimize(request: OptimizeRequest): Promise<OptimizeResult> {
    // 直接使用传入的 prompt
    const generateRequest: GenerateRequest = {
      prompt: request.prompt,
      context: request.context,
      systemPrompt: request.systemPrompt,
      model: request.model,
      temperature: 0.3 // 使用较低温度确保优化一致性
    }

    const result = await this.generate(generateRequest)

    // 解析优化结果
    const { optimizedContent, improvementSummary, changes } =
      this.parseOptimizeResult(result.content)

    return {
      content: optimizedContent, // 统一的内容字段
      optimizedContent,
      improvementSummary,
      confidence: result.confidence,
      changes,
      metadata: result.metadata
    }
  }

  /**
   * 语义分析
   */
  async analyze(content: string, options: SemanticOptions, prompt?: string): Promise<SemanticAnalysis> {
    // 如果没有提供 prompt，使用简单的默认提示
    const analysisPrompt = prompt || `请分析以下内容：\n\n${content}`

    const request: GenerateRequest = {
      prompt: analysisPrompt,
      temperature: 0.2 // 使用低温度确保分析一致性
    }

    const result = await this.generate(request)

    // 解析分析结果
    return this.parseAnalysisResult(result.content, result.metadata)
  }

  /**
   * 计算Token数量
   */
  async countTokens(text: string): Promise<number> {
    try {
      const encoding = encoding_for_model(this.config.defaultModel as any)
      const tokens = encoding.encode(text)
      encoding.free()
      return tokens.length
    } catch (error) {
      // 如果模型不支持，使用估算方法
      return Math.ceil(text.length / 4) // 粗略估算：4个字符约等于1个token
    }
  }

  /**
   * 验证请求
   */
  validateRequest(request: any): boolean {
    if (!request) return false

    // 检查必需字段
    if (typeof request.prompt !== 'string' || !request.prompt.trim()) {
      return false
    }

    // 验证模型
    if (request.model && !this.getAvailableModels().includes(request.model)) {
      return false
    }

    // 验证温度参数
    if (request.temperature !== undefined) {
      if (typeof request.temperature !== 'number' ||
          request.temperature < 0 ||
          request.temperature > 2) {
        return false
      }
    }

    return true
  }

  /**
   * 获取可用模型列表
   */
  getAvailableModels(): string[] {
    return [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ]
  }

  /**
   * 构建消息数组
   */
  private buildMessages(
    prompt: string,
    context?: string,
    systemPrompt?: string
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

    // 系统消息（可选）
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      })
    }

    // 构建用户消息
    let userMessage = prompt
    if (context) {
      userMessage = `${context}\n\n${prompt}`
    }

    messages.push({
      role: 'user',
      content: userMessage
    })

    return messages
  }

  /**
   * 获取模型的最大token数
   */
  private getMaxTokens(model: string): number {
    const maxTokens: Record<string, number> = {
      'gpt-4': 4000,
      'gpt-4-turbo': 4000,
      'gpt-4-turbo-preview': 4000,
      'gpt-3.5-turbo': 4000,
      'gpt-3.5-turbo-16k': 8000
    }

    return maxTokens[model] || 4000
  }

  /**
   * 提取元数据
   */
  private async extractMetadata(content: string): Promise<{
    title?: string
    tags: string[]
    confidence: number
  }> {
    // 简单的标题提取
    const lines = content.split('\n')
    const title = lines[0]?.length > 0 && lines[0].length < 100 ? lines[0] : undefined

    // 简单的标签提取（基于关键词频率）
    const words = content.toLowerCase()
      .replace(/[^\u4e00-\u9fa5\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)

    const wordCount: Record<string, number> = {}
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })

    const tags = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word)

    // 基于内容长度和结构计算置信度
    const confidence = Math.min(0.9, Math.max(0.3, content.length / 1000))

    return { title, tags, confidence }
  }

  /**
   * 解析优化结果
   */
  private parseOptimizeResult(content: string): {
    optimizedContent: string
    improvementSummary: string
    changes: string[]
  } {
    const parts = content.split('主要改进：')

    let optimizedContent = content
    let improvementSummary = '内容已优化'
    let changes: string[] = []

    if (parts.length >= 2) {
      const contentPart = parts[0].replace(/^优化后内容：\s*/i, '').trim()
      if (contentPart) {
        optimizedContent = contentPart
      }

      const improvementPart = parts[1].trim()
      if (improvementPart) {
        improvementSummary = improvementPart
        changes = improvementPart.split('\n')
          .map(line => line.trim())
          .filter(line => line && line !== improvementPart)
      }
    }

    return {
      optimizedContent,
      improvementSummary,
      changes
    }
  }

  /**
   * 解析分析结果
   */
  private parseAnalysisResult(content: string, metadata: ProcessingMetadata): SemanticAnalysis {
    try {
      // 提取JSON部分
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('无法找到JSON格式的分析结果')
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        semanticType: parsed.semanticType || '未知类型',
        importanceLevel: Math.max(1, Math.min(10, parsed.importanceLevel || 5)),
        keyTerms: Array.isArray(parsed.keyTerms) ? parsed.keyTerms : [],
        sentiment: ['positive', 'neutral', 'negative'].includes(parsed.sentiment)
          ? parsed.sentiment : 'neutral',
        sentimentScore: Math.max(-1, Math.min(1, parsed.sentimentScore || 0)),
        complexity: ['low', 'medium', 'high'].includes(parsed.complexity)
          ? parsed.complexity : 'medium',
        complexityScore: Math.max(1, Math.min(10, parsed.complexityScore || 5)),
        readability: Math.max(1, Math.min(10, parsed.readability || 5)),
        topics: Array.isArray(parsed.topics) ? parsed.topics.map((topic: any) => ({
          name: String(topic.name || ''),
          relevance: Math.max(0, Math.min(1, topic.relevance || 0.5)),
          confidence: Math.max(0, Math.min(1, topic.confidence || 0.5))
        })) : [],
        entities: Array.isArray(parsed.entities) ? parsed.entities.map((entity: any) => ({
          text: String(entity.text || ''),
          type: String(entity.type || '未知'),
          confidence: Math.max(0, Math.min(1, entity.confidence || 0.5))
        })) : [],
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        metadata
      }

    } catch (error) {
      // 如果解析失败，返回基础分析结果
      console.warn('分析结果解析失败，返回默认结果:', error)

      return {
        semanticType: '文本内容',
        importanceLevel: 5,
        keyTerms: [],
        sentiment: 'neutral',
        sentimentScore: 0,
        complexity: 'medium',
        complexityScore: 5,
        readability: 5,
        topics: [],
        entities: [],
        tags: [],
        confidence: 0.3,
        metadata
      }
    }
  }

  /**
   * 创建处理元数据
   */
  private createMetadata(model: string, startTime: number, tokenCount: number): ProcessingMetadata {
    return {
      model,
      tokenCount,
      processingTime: Date.now() - startTime,
      temperature: 0.7,
      requestId: uuidv4(),
      timestamp: new Date(),
      cost: this.calculateCost(model, tokenCount)
    }
  }

  /**
   * 计算成本
   */
  private calculateCost(model: string, tokenCount: number): number {
    const costPerToken: Record<string, number> = {
      'gpt-4': 0.00003,
      'gpt-4-turbo': 0.00001,
      'gpt-4-turbo-preview': 0.00001,
      'gpt-3.5-turbo': 0.0000015,
      'gpt-3.5-turbo-16k': 0.000003
    }

    return (costPerToken[model] || 0.00001) * tokenCount
  }

  /**
   * 错误处理
   */
  private handleError(error: any, operation: string): Error {
    const message = error?.message || `OpenAI ${operation} operation failed`

    if (error?.code === 'rate_limit_exceeded') {
      return new Error(`API速率限制: ${message}`)
    }

    if (error?.code === 'insufficient_quota') {
      return new Error(`API配额不足: ${message}`)
    }

    if (error?.code === 'invalid_api_key') {
      return new Error(`API密钥无效: ${message}`)
    }

    return new Error(`OpenAI错误: ${message}`)
  }
}