import { encoding_for_model } from 'tiktoken'

/**
 * Token计数器工具类
 * 提供准确的token计数和成本估算
 */
export class TokenCounter {
  private encodingCache: Map<string, any> = new Map()

  /**
   * 计算文本的token数量
   */
  async countTokens(text: string, model: string = 'gpt-3.5-turbo'): Promise<number> {
    try {
      const encoding = this.getEncoding(model)
      const tokens = encoding.encode(text)
      return tokens.length
    } catch (error) {
      console.warn(`无法获取模型 ${model} 的编码器，使用估算方法:`, error)
      return this.estimateTokens(text)
    }
  }

  /**
   * 批量计算多个文本的token数量
   */
  async countTokensBatch(texts: string[], model: string = 'gpt-3.5-turbo'): Promise<number[]> {
    const encoding = this.getEncoding(model)
    return texts.map(text => {
      try {
        const tokens = encoding.encode(text)
        return tokens.length
      } catch (error) {
        return this.estimateTokens(text)
      }
    })
  }

  /**
   * 计算对话消息的token数量
   */
  async countMessageTokens(
    messages: Array<{role: string; content: string}>,
    model: string = 'gpt-3.5-turbo'
  ): Promise<number> {
    const encoding = this.getEncoding(model)
    let tokenCount = 0

    // 每条消息的基础token开销
    const tokensPerMessage = this.getTokensPerMessage(model)
    const tokensPerName = this.getTokensPerName(model)

    for (const message of messages) {
      tokenCount += tokensPerMessage

      for (const [key, value] of Object.entries(message)) {
        if (typeof value === 'string') {
          tokenCount += encoding.encode(value).length
          if (key === 'name') {
            tokenCount += tokensPerName
          }
        }
      }
    }

    // 每个对话回复的额外token
    tokenCount += 3

    return tokenCount
  }

  /**
   * 估算成本
   */
  estimateCost(tokenCount: number, model: string): number {
    const costPerToken = this.getCostPerToken(model)
    return tokenCount * costPerToken
  }

  /**
   * 估算批量处理成本
   */
  estimateBatchCost(tokenCounts: number[], model: string): number {
    const totalTokens = tokenCounts.reduce((sum, count) => sum + count, 0)
    return this.estimateCost(totalTokens, model)
  }

  /**
   * 检查文本是否超过模型限制
   */
  async checkTokenLimit(
    text: string,
    model: string,
    includeResponseTokens: number = 500
  ): Promise<{
    tokenCount: number
    maxTokens: number
    withinLimit: boolean
    suggestedTruncation?: number
  }> {
    const tokenCount = await this.countTokens(text, model)
    const maxTokens = this.getModelMaxTokens(model)
    const availableTokens = maxTokens - includeResponseTokens
    const withinLimit = tokenCount <= availableTokens

    let suggestedTruncation: number | undefined

    if (!withinLimit) {
      // 建议截断到可用token数的90%
      suggestedTruncation = Math.floor(availableTokens * 0.9)
    }

    return {
      tokenCount,
      maxTokens,
      withinLimit,
      suggestedTruncation
    }
  }

  /**
   * 截断文本到指定token数量
   */
  async truncateToTokenLimit(
    text: string,
    maxTokens: number,
    model: string = 'gpt-3.5-turbo'
  ): Promise<string> {
    const encoding = this.getEncoding(model)
    const tokens = encoding.encode(text)

    if (tokens.length <= maxTokens) {
      return text
    }

    // 截断token并解码回文本
    const truncatedTokens = tokens.slice(0, maxTokens)
    const truncatedText = new TextDecoder().decode(encoding.decode(truncatedTokens))

    return truncatedText
  }

  /**
   * 智能截断文本（保持完整句子）
   */
  async smartTruncate(
    text: string,
    maxTokens: number,
    model: string = 'gpt-3.5-turbo'
  ): Promise<string> {
    const tokenCount = await this.countTokens(text, model)

    if (tokenCount <= maxTokens) {
      return text
    }

    // 按句子分割
    const sentences = this.splitIntoSentences(text)
    let result = ''
    let currentTokens = 0

    for (const sentence of sentences) {
      const sentenceTokens = await this.countTokens(sentence, model)

      if (currentTokens + sentenceTokens <= maxTokens) {
        result += sentence
        currentTokens += sentenceTokens
      } else {
        break
      }
    }

    // 如果没有完整句子可以包含，则使用硬截断
    if (result.trim() === '') {
      result = await this.truncateToTokenLimit(text, maxTokens, model)
    }

    return result
  }

  /**
   * 获取编码器
   */
  private getEncoding(model: string): any {
    if (this.encodingCache.has(model)) {
      return this.encodingCache.get(model)
    }

    try {
      const encoding = encoding_for_model(model as any)
      this.encodingCache.set(model, encoding)
      return encoding
    } catch (error) {
      // 使用默认编码器
      const encoding = encoding_for_model('gpt-3.5-turbo')
      this.encodingCache.set(model, encoding)
      return encoding
    }
  }

  /**
   * 估算token数量（当无法获取准确编码器时使用）
   */
  private estimateTokens(text: string): number {
    // 英文：约4个字符=1个token
    // 中文：约1.5个字符=1个token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const otherChars = text.length - chineseChars

    return Math.ceil(chineseChars / 1.5 + otherChars / 4)
  }

  /**
   * 获取每条消息的token开销
   */
  private getTokensPerMessage(model: string): number {
    const messageTokens: Record<string, number> = {
      'gpt-3.5-turbo': 4,
      'gpt-3.5-turbo-16k': 4,
      'gpt-4': 3,
      'gpt-4-turbo': 3,
      'gpt-4-turbo-preview': 3
    }

    return messageTokens[model] || 4
  }

  /**
   * 获取name字段的token开销
   */
  private getTokensPerName(model: string): number {
    const nameTokens: Record<string, number> = {
      'gpt-3.5-turbo': 1,
      'gpt-3.5-turbo-16k': 1,
      'gpt-4': -1,
      'gpt-4-turbo': -1,
      'gpt-4-turbo-preview': -1
    }

    return nameTokens[model] || 1
  }

  /**
   * 获取每个token的成本
   */
  private getCostPerToken(model: string): number {
    const costs: Record<string, number> = {
      'gpt-4': 0.00003,
      'gpt-4-turbo': 0.00001,
      'gpt-4-turbo-preview': 0.00001,
      'gpt-3.5-turbo': 0.0000015,
      'gpt-3.5-turbo-16k': 0.000003
    }

    return costs[model] || 0.00001
  }

  /**
   * 获取模型最大token数
   */
  private getModelMaxTokens(model: string): number {
    const maxTokens: Record<string, number> = {
      'gpt-3.5-turbo': 4096,
      'gpt-3.5-turbo-16k': 16384,
      'gpt-4': 8192,
      'gpt-4-turbo': 128000,
      'gpt-4-turbo-preview': 128000
    }

    return maxTokens[model] || 4096
  }

  /**
   * 将文本分割为句子
   */
  private splitIntoSentences(text: string): string[] {
    // 简单的句子分割（支持中英文）
    const sentences = text.split(/[.!?。！？]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)

    // 重新添加标点符号
    return sentences.map((sentence, index) => {
      if (index < sentences.length - 1) {
        // 查找原文中的标点符号
        const punct = text.match(new RegExp(sentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([.!?。！？]+)'))?.[1] || '.'
        return sentence + punct + ' '
      }
      return sentence
    })
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    // 释放所有编码器
    for (const encoding of this.encodingCache.values()) {
      if (encoding && typeof encoding.free === 'function') {
        encoding.free()
      }
    }
    this.encodingCache.clear()
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): {
    cacheSize: number
    cachedModels: string[]
  } {
    return {
      cacheSize: this.encodingCache.size,
      cachedModels: Array.from(this.encodingCache.keys())
    }
  }
}