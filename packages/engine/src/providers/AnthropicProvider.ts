import { Anthropic } from '@anthropic-ai/sdk'
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
 * Anthropic服务提供者配置
 */
export interface AnthropicProviderConfig {
  apiKey: string
  baseURL?: string
  defaultModel: string
  timeout?: number
  maxRetries?: number
}

/**
 * Anthropic服务提供者
 * 实现与Anthropic Claude API的集成
 */
export class AnthropicProvider implements AIProvider {
  private client: Anthropic
  private config: AnthropicProviderConfig
  public readonly name = 'Anthropic'

  constructor(config: AnthropicProviderConfig) {
    this.config = config

    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 3,
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
      const messages = this.buildMessages(request.prompt, request.context)

      // 调用Anthropic API
      const completion = await this.client.messages.create({
        model,
        messages,
        temperature: request.temperature || 0.7,
        max_tokens: this.getMaxTokens(model),
        system: this.getSystemPrompt()
      })

      const content = completion.content[0]?.type === 'text'
        ? completion.content[0].text
        : ''

      const tokensUsed = completion.usage?.input_tokens + completion.usage?.output_tokens || 0

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
    const generateRequest: GenerateRequest = {
      prompt: this.buildOptimizePrompt(request),
      inputs: [request.content],
      context: request.context,
      model: request.model,
      temperature: 0.3
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
  async analyze(content: string, options: SemanticOptions): Promise<SemanticAnalysis> {
    const prompt = this.buildAnalysisPrompt(content, options)

    const request: GenerateRequest = {
      prompt,
      inputs: [content],
      temperature: 0.2
    }

    const result = await this.generate(request)

    return this.parseAnalysisResult(result.content, result.metadata)
  }

  /**
   * 计算Token数量
   */
  async countTokens(text: string): Promise<number> {
    try {
      // Anthropic使用不同的tokenizer，这里提供估算
      // 通常中文字符约1.5个token，英文单词约1个token
      const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
      const englishWords = (text.match(/[a-zA-Z]+/g) || []).length
      const otherChars = text.length - chineseChars - englishWords

      return Math.ceil(chineseChars * 1.5 + englishWords + otherChars * 0.5)
    } catch (error) {
      // 粗略估算：4个字符约等于1个token
      return Math.ceil(text.length / 4)
    }
  }

  /**
   * 验证请求
   */
  validateRequest(request: any): boolean {
    if (!request) return false

    if (typeof request.prompt !== 'string' || !request.prompt.trim()) {
      return false
    }

    if (request.model && !this.getAvailableModels().includes(request.model)) {
      return false
    }

    if (request.temperature !== undefined) {
      if (typeof request.temperature !== 'number' ||
          request.temperature < 0 ||
          request.temperature > 1) {
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
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ]
  }

  /**
   * 获取系统提示
   */
  private getSystemPrompt(): string {
    return '你是Claude，一个专业的AI助手。专门负责内容生成、优化和分析。请始终提供高质量、准确且有用的回复。'
  }

  /**
   * 构建消息数组
   */
  private buildMessages(prompt: string, context?: string): Anthropic.MessageParam[] {
    const messages: Anthropic.MessageParam[] = []

    let finalPrompt = prompt
    if (context) {
      finalPrompt = `上下文信息：${context}\n\n${prompt}`
    }

    messages.push({
      role: 'user',
      content: finalPrompt
    })

    return messages
  }

  /**
   * 构建优化提示
   */
  private buildOptimizePrompt(request: OptimizeRequest): string {
    let prompt = `请优化以下内容，使其更加清晰、准确和有效：\n\n`
    prompt += `原内容：\n${request.content}\n\n`
    prompt += `优化要求：${request.instruction}\n\n`

    if (request.targetStyle) {
      prompt += `目标风格：${request.targetStyle}\n`
    }

    if (request.targetLength) {
      const lengthMap = {
        shorter: '更简洁',
        longer: '更详细',
        same: '保持相同长度'
      }
      prompt += `长度要求：${lengthMap[request.targetLength]}\n`
    }

    prompt += `\n请按以下格式返回结果：\n`
    prompt += `优化后内容：\n[这里是优化后的内容]\n\n`
    prompt += `主要改进：\n[列出主要改进点]`

    return prompt
  }

  /**
   * 构建分析提示
   */
  private buildAnalysisPrompt(content: string, options: SemanticOptions): string {
    let prompt = `请对以下内容进行详细的语义分析：\n\n"${content}"\n\n`

    prompt += '请以JSON格式返回分析结果：\n'
    prompt += '{\n'
    prompt += '  "semanticType": "内容类型",\n'
    prompt += '  "importanceLevel": 5,\n'
    prompt += '  "keyTerms": ["关键词1", "关键词2"],\n'
    prompt += '  "sentiment": "positive|neutral|negative",\n'
    prompt += '  "sentimentScore": 0.5,\n'
    prompt += '  "complexity": "low|medium|high",\n'
    prompt += '  "complexityScore": 5,\n'
    prompt += '  "readability": 7,\n'
    prompt += '  "topics": [{"name": "主题", "relevance": 0.8, "confidence": 0.9}],\n'
    prompt += '  "entities": [{"text": "实体", "type": "类型", "confidence": 0.95}],\n'
    prompt += '  "tags": ["标签1", "标签2"],\n'
    prompt += '  "confidence": 0.85\n'
    prompt += '}\n\n'

    prompt += '分析要求：\n'
    if (options.extractTags !== false) {
      prompt += '- 提取关键标签和术语\n'
    }
    if (options.assessImportance !== false) {
      prompt += '- 评估内容重要性（1-10）\n'
    }
    if (options.analyzeSentiment) {
      prompt += '- 分析情感倾向和强度\n'
    }
    if (options.evaluateComplexity) {
      prompt += '- 评估内容复杂度\n'
    }
    if (options.detectTopics) {
      prompt += '- 识别主要话题\n'
    }

    return prompt
  }

  /**
   * 获取模型的最大token数
   */
  private getMaxTokens(model: string): number {
    const maxTokens: Record<string, number> = {
      'claude-3-5-sonnet-20241022': 8192,
      'claude-3-5-haiku-20241022': 8192,
      'claude-3-opus-20240229': 4096,
      'claude-3-sonnet-20240229': 4096,
      'claude-3-haiku-20240307': 4096
    }

    return maxTokens[model] || 4096
  }

  /**
   * 提取元数据
   */
  private async extractMetadata(content: string): Promise<{
    title?: string
    tags: string[]
    confidence: number
  }> {
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
      'claude-3-5-sonnet-20241022': 0.000003,
      'claude-3-5-haiku-20241022': 0.00000025,
      'claude-3-opus-20240229': 0.000015,
      'claude-3-sonnet-20240229': 0.000003,
      'claude-3-haiku-20240307': 0.00000025
    }

    return (costPerToken[model] || 0.000003) * tokenCount
  }

  /**
   * 错误处理
   */
  private handleError(error: any, operation: string): Error {
    const message = error?.message || `Anthropic ${operation} operation failed`

    if (error?.status === 429) {
      return new Error(`API速率限制: ${message}`)
    }

    if (error?.status === 402) {
      return new Error(`API配额不足: ${message}`)
    }

    if (error?.status === 401) {
      return new Error(`API密钥无效: ${message}`)
    }

    return new Error(`Anthropic错误: ${message}`)
  }
}