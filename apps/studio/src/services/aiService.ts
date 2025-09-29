import type { 
  AIGenerateRequest, 
  AIGenerateResponse, 
  AIModel 
} from '@/types'

interface AIServiceConfig {
  apiUrl: string
  model: AIModel
  timeout: number
  maxRetries: number
}

class AIService {
  private config: AIServiceConfig
  private requestId: number = 0

  constructor(config: AIServiceConfig) {
    this.config = config
  }

  /**
   * 生成AI内容
   */
  async generateContent(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const requestId = this.generateRequestId()
    
    try {
      const response = await this.makeRequest('/generate', {
        ...request,
        requestId,
        model: this.config.model,
      })

      return {
        content: response.content,
        title: response.title,
        confidence: response.confidence || 0.8,
        tags: response.tags || [],
        reasoning: response.reasoning,
        metadata: {
          requestId,
          model: this.config.model,
          processingTime: response.processingTime || 0,
          tokenCount: response.tokenCount || 0,
        }
      }
    } catch (error) {
      throw new Error(`AI内容生成失败: ${error}`)
    }
  }

  /**
   * 优化现有内容
   */
  async optimizeContent(
    content: string, 
    context?: string,
    targetStyle?: string
  ): Promise<AIGenerateResponse> {
    return this.generateContent({
      inputs: [content],
      context,
      instruction: `请优化以下内容${targetStyle ? `，风格要求：${targetStyle}` : ''}`,
      type: 'optimize'
    })
  }

  /**
   * 多输入融合生成
   */
  async fusionGenerate(
    inputs: string[],
    fusionType: 'summary' | 'synthesis' | 'comparison' = 'synthesis'
  ): Promise<AIGenerateResponse> {
    if (inputs.length < 2) {
      throw new Error('融合生成至少需要2个输入')
    }

    return this.generateContent({
      inputs,
      type: 'fusion',
      instruction: this.getFusionInstruction(fusionType),
    })
  }

  /**
   * 智能标题生成
   */
  async generateTitle(content: string): Promise<string> {
    try {
      const response = await this.generateContent({
        inputs: [content],
        type: 'title',
        instruction: '为以下内容生成一个简洁准确的标题（不超过20个字符）',
      })

      return response.title || response.content.slice(0, 20)
    } catch (error) {
      // 如果AI生成失败，使用内容前缀作为标题
      return content.slice(0, 20) + (content.length > 20 ? '...' : '')
    }
  }

  /**
   * 提取语义标签
   */
  async extractTags(content: string): Promise<string[]> {
    try {
      const response = await this.generateContent({
        inputs: [content],
        type: 'tags',
        instruction: '为以下内容提取3-5个关键标签，返回JSON数组格式',
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
   * 批量处理请求
   */
  async batchGenerate(requests: AIGenerateRequest[]): Promise<AIGenerateResponse[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.generateContent(request))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        // 失败的请求返回默认响应
        return {
          content: `生成失败: ${result.reason}`,
          confidence: 0,
          tags: [],
          metadata: {
            requestId: this.generateRequestId(),
            model: this.config.model,
            processingTime: 0,
            tokenCount: 0,
            error: result.reason
          }
        }
      }
    })
  }

  /**
   * 检查AI服务状态
   */
  async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels(): Promise<AIModel[]> {
    try {
      const response = await this.makeRequest('/models')
      return response.models || ['gpt-3.5-turbo', 'gpt-4']
    } catch {
      return ['gpt-3.5-turbo', 'gpt-4']
    }
  }

  // 私有方法
  private generateRequestId(): string {
    return `req-${Date.now()}-${++this.requestId}`
  }

  private getFusionInstruction(type: string): string {
    const instructions = {
      summary: '请总结以下多个内容的核心要点',
      synthesis: '请综合以下多个内容，生成统一的整合内容',
      comparison: '请比较分析以下多个内容的异同点'
    }
    return instructions[type as keyof typeof instructions] || instructions.synthesis
  }

  private async makeRequest(endpoint: string, data?: any): Promise<any> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
        
        const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        lastError = error as Error
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.config.maxRetries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000) // 指数退避
        }
      }
    }

    throw lastError
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 默认配置
const defaultConfig: AIServiceConfig = {
  apiUrl: import.meta.env.VITE_AI_API_URL || 'http://localhost:8000/api/ai',
  model: 'gpt-3.5-turbo',
  timeout: 30000, // 30秒
  maxRetries: 3,
}

// 单例实例
export const aiService = new AIService(defaultConfig)

// 导出类型和服务
export { AIService }
export type { AIServiceConfig }