import type {
  AIGenerateResponse,
  AIGenerateRequest,
  SemanticType
} from '@sker/models'

/**
 * AI引擎结果类型
 */
interface AIEngineResult {
  content: string
  title?: string
  confidence?: number
  tags?: string[]
  reasoning?: string
  semantic_type?: string
  metadata?: {
    model?: string
    processingTime?: number
    tokenCount?: number
    cached?: boolean
    requestId?: string
  }
  improvements?: string[]
}

/**
 * 响应映射器 - 转换不同服务间的数据格式
 */
export class ResponseMapper {
  /**
   * 转换AI引擎结果到前端期望格式
   */
  static toAIGenerateResponse(engineResult: AIEngineResult): AIGenerateResponse {
    return {
      content: engineResult.content,
      title: engineResult.title,
      confidence: this.normalizeConfidence(engineResult.confidence || 75),
      tags: engineResult.tags || [],
      reasoning: engineResult.reasoning,
      semantic_type: this.mapSemanticType(engineResult.semantic_type),
      metadata: {
        requestId: engineResult.metadata?.requestId || this.generateRequestId(),
        model: engineResult.metadata?.model || 'gpt-4',
        processingTime: engineResult.metadata?.processingTime || 0,
        tokenCount: engineResult.metadata?.tokenCount || 0,
        cached: engineResult.metadata?.cached || false
      },
      improvements: engineResult.improvements
    }
  }

  /**
   * 转换前端AI请求到引擎格式
   */
  static toAIEngineRequest(
    frontendRequest: AIGenerateRequest,
    additionalContext?: {
      userId?: string
      projectId?: string
      requestId?: string
    }
  ): any {
    const basePrompt = this.buildPromptFromRequest(frontendRequest)

    return {
      prompt: basePrompt,
      model: 'gpt-4', // 可以从配置或请求中获取
      maxTokens: 2000,
      temperature: 0.7,
      userId: additionalContext?.userId,
      projectId: additionalContext?.projectId,
      metadata: {
        requestId: additionalContext?.requestId || this.generateRequestId(),
        source: 'gateway_api',
        inputCount: frontendRequest.inputs?.length || 1
      }
    }
  }

  /**
   * 转换任务状态到前端格式
   */
  static toTaskStatus(queueTaskStatus: any): {
    id: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress?: number
    result?: AIGenerateResponse
    error?: string
  } {
    return {
      id: queueTaskStatus.taskId,
      status: this.mapTaskStatus(queueTaskStatus.status),
      ...(queueTaskStatus.progress !== undefined ? { progress: queueTaskStatus.progress } : {}),
      ...(queueTaskStatus.result ? { result: this.toAIGenerateResponse(queueTaskStatus.result) } : {}),
      ...(queueTaskStatus.error?.message ? { error: queueTaskStatus.error.message } : {})
    }
  }

  /**
   * 转换WebSocket消息到前端格式
   */
  static toWebSocketMessage(internalMessage: any): {
    id: string
    type: string
    data: any
    timestamp: number
  } {
    return {
      id: internalMessage.id || this.generateRequestId(),
      type: internalMessage.type,
      data: internalMessage.data || internalMessage.payload,
      timestamp: internalMessage.timestamp || Date.now()
    }
  }

  /**
   * 转换错误到统一错误格式
   */
  static toAPIError(error: Error | any, requestId?: string): {
    code: string
    message: string
    timestamp: Date
    requestId: string
    details?: any
  } {
    const errorCode = this.mapErrorToCode(error)

    return {
      code: errorCode,
      message: error.message || '未知错误',
      timestamp: new Date(),
      requestId: requestId || this.generateRequestId(),
      details: error.details || undefined
    }
  }

  /**
   * 转换成功响应到统一格式
   */
  static toAPISuccess<T>(data: T, message?: string, requestId?: string): {
    success: true
    data: T
    message?: string
    timestamp: Date
    requestId?: string
  } {
    return {
      success: true,
      data,
      message,
      timestamp: new Date(),
      requestId
    }
  }

  // 私有辅助方法

  /**
   * 规范化置信度值
   */
  private static normalizeConfidence(confidence: number): number {
    // 如果是0-1范围的值，转换为0-100
    if (confidence >= 0 && confidence <= 1) {
      return Math.round(confidence * 100)
    }
    // 确保在0-100范围内
    return Math.max(0, Math.min(100, Math.round(confidence)))
  }

  /**
   * 映射语义类型
   */
  private static mapSemanticType(engineSemanticType?: string): SemanticType | undefined {
    if (!engineSemanticType) return undefined

    const typeMapping: Record<string, SemanticType> = {
      'requirement': 'requirement',
      'solution': 'solution',
      'plan': 'plan',
      'analysis': 'analysis',
      'idea': 'idea',
      'question': 'question',
      'answer': 'answer',
      'decision': 'decision',
      'fusion': 'fusion',
      'summary': 'summary',
      'synthesis': 'synthesis',
      'comparison': 'comparison',
      'error': 'fusion-error'
    }

    return typeMapping[engineSemanticType.toLowerCase()] || undefined
  }

  /**
   * 构建AI提示词
   */
  private static buildPromptFromRequest(request: AIGenerateRequest): string {
    const parts: string[] = []

    // 添加上下文
    if (request.context) {
      parts.push(`上下文信息：\n${request.context}\n`)
    }

    // 添加输入内容
    if (request.inputs && request.inputs.length > 0) {
      if (request.inputs.length === 1) {
        parts.push(`内容：\n${request.inputs[0]}\n`)
      } else {
        parts.push('输入内容：')
        request.inputs.forEach((input, index) => {
          parts.push(`${index + 1}. ${input}`)
        })
        parts.push('')
      }
    }

    // 添加指令
    if (request.instruction) {
      parts.push(`指令：${request.instruction}\n`)
    } else {
      // 根据类型添加默认指令
      const defaultInstructions = {
        'generate': '请基于以上信息生成相关内容',
        'optimize': '请优化以上内容，使其更清晰、准确、有条理',
        'fusion': '请将以上多个内容融合成一个统一、连贯的内容',
        'expand': '请基于以上内容进行扩展和深入分析',
        'title': '请为以上内容生成一个简洁准确的标题',
        'tags': '请为以上内容提取3-5个关键标签'
      }

      const instruction = defaultInstructions.generate
      parts.push(`指令：${instruction}\n`)
    }

    // 添加格式要求
    parts.push('请返回JSON格式：')
    parts.push(JSON.stringify({
      content: "生成的内容",
      title: "合适的标题（可选）",
      semantic_type: "内容的语义类型（如：需求分析、技术方案、项目计划等）",
      confidence: "置信度(0-100)",
      tags: ["标签1", "标签2", "..."]
    }, null, 2))

    return parts.join('\n')
  }

  /**
   * 映射任务状态
   */
  private static mapTaskStatus(queueStatus: string): 'pending' | 'processing' | 'completed' | 'failed' {
    const statusMapping: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
      'queued': 'pending',
      'pending': 'pending',
      'processing': 'processing',
      'running': 'processing',
      'completed': 'completed',
      'success': 'completed',
      'failed': 'failed',
      'error': 'failed'
    }

    return statusMapping[queueStatus.toLowerCase()] || 'pending'
  }

  /**
   * 映射错误到错误码
   */
  private static mapErrorToCode(error: any): string {
    if (error.code) return error.code

    // 根据错误类型或消息映射到标准错误码
    const message = error.message?.toLowerCase() || ''

    if (message.includes('timeout')) return 'REQUEST_TIMEOUT'
    if (message.includes('not found')) return 'NOT_FOUND'
    if (message.includes('unauthorized')) return 'UNAUTHORIZED'
    if (message.includes('forbidden')) return 'FORBIDDEN'
    if (message.includes('validation')) return 'VALIDATION_ERROR'
    if (message.includes('rate limit')) return 'RATE_LIMIT_EXCEEDED'
    if (message.includes('queue') || message.includes('broker')) return 'QUEUE_ERROR'
    if (message.includes('ai') || message.includes('engine')) return 'AI_ENGINE_ERROR'

    return 'INTERNAL_ERROR'
  }

  /**
   * 生成请求ID
   */
  private static generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 验证响应数据完整性
   */
  static validateAIResponse(response: any): {
    valid: boolean
    errors: string[]
    sanitized?: AIGenerateResponse
  } {
    const errors: string[] = []
    const sanitized: Partial<AIGenerateResponse> = {}

    // 验证必需字段
    if (!response.content || typeof response.content !== 'string') {
      errors.push('缺少或无效的content字段')
    } else {
      sanitized.content = response.content
    }

    // 验证可选字段
    if (response.title && typeof response.title === 'string') {
      sanitized.title = response.title
    }

    if (response.confidence !== undefined) {
      const normalizedConfidence = this.normalizeConfidence(response.confidence)
      if (normalizedConfidence >= 0 && normalizedConfidence <= 100) {
        sanitized.confidence = normalizedConfidence
      } else {
        errors.push('置信度必须在0-100范围内')
      }
    }

    if (response.tags && Array.isArray(response.tags)) {
      sanitized.tags = response.tags.filter(tag => typeof tag === 'string')
    }

    if (response.reasoning && typeof response.reasoning === 'string') {
      sanitized.reasoning = response.reasoning
    }

    if (response.semantic_type && typeof response.semantic_type === 'string') {
      sanitized.semantic_type = this.mapSemanticType(response.semantic_type)
    }

    // 设置默认值
    sanitized.confidence = sanitized.confidence || 75
    sanitized.tags = sanitized.tags || []

    // 元数据
    sanitized.metadata = {
      requestId: response.metadata?.requestId || this.generateRequestId(),
      model: response.metadata?.model || 'unknown',
      processingTime: response.metadata?.processingTime || 0,
      tokenCount: response.metadata?.tokenCount || 0,
      cached: response.metadata?.cached || false
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized as AIGenerateResponse : undefined
    }
  }
}