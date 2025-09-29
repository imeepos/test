import type {
  AIProvider,
  SemanticOptions,
  SemanticAnalysis,
  GenerateRequest,
  ProcessingMetadata
} from '@/types'

/**
 * 语义分析器类
 * 负责对内容进行深度语义分析
 */
export class SemanticAnalyzer {
  private provider: AIProvider

  constructor(provider: AIProvider) {
    this.provider = provider
  }

  /**
   * 分析内容的语义信息
   */
  async analyze(content: string, options: SemanticOptions): Promise<SemanticAnalysis> {
    // 构建分析提示词
    const analysisPrompt = this.buildAnalysisPrompt(content, options)

    const request: GenerateRequest = {
      prompt: analysisPrompt,
      inputs: [content],
      temperature: 0.3 // 使用较低温度确保分析一致性
    }

    const result = await this.provider.generate(request)

    // 解析分析结果
    return this.parseAnalysisResult(result.content, result.metadata)
  }

  /**
   * 构建分析提示词
   */
  private buildAnalysisPrompt(content: string, options: SemanticOptions): string {
    let prompt = `请对以下内容进行深度语义分析：\n\n"${content}"\n\n`

    prompt += '请提供JSON格式的分析结果，包含以下信息：\n'
    prompt += '```json\n{\n'

    // 基础语义分析
    prompt += '  "semanticType": "内容的语义类型（如：技术文档、分析报告、创意内容等）",\n'

    // 重要性评估
    if (options.assessImportance !== false) {
      prompt += '  "importanceLevel": "重要性等级（1-10的数字）",\n'
    }

    // 标签提取
    if (options.extractTags !== false) {
      prompt += '  "keyTerms": ["关键术语1", "关键术语2", "关键术语3"],\n'
      prompt += '  "tags": ["标签1", "标签2", "标签3"],\n'
    }

    // 情感分析
    if (options.analyzeSentiment) {
      prompt += '  "sentiment": "positive|neutral|negative",\n'
      prompt += '  "sentimentScore": "情感分数（-1到1之间的数字）",\n'
    }

    // 复杂度分析
    if (options.evaluateComplexity) {
      prompt += '  "complexity": "low|medium|high",\n'
      prompt += '  "complexityScore": "复杂度分数（1-10的数字）",\n'
    }

    // 可读性分析
    prompt += '  "readability": "可读性分数（1-10的数字）",\n'

    // 主题检测
    if (options.detectTopics) {
      prompt += '  "topics": [\n'
      prompt += '    {\n'
      prompt += '      "name": "主题名称",\n'
      prompt += '      "relevance": "相关度（0-1之间的数字）",\n'
      prompt += '      "confidence": "置信度（0-1之间的数字）"\n'
      prompt += '    }\n'
      prompt += '  ],\n'
    }

    // 实体识别
    prompt += '  "entities": [\n'
    prompt += '    {\n'
    prompt += '      "text": "实体文本",\n'
    prompt += '      "type": "实体类型（如：人名、地名、组织等）",\n'
    prompt += '      "confidence": "置信度（0-1之间的数字）"\n'
    prompt += '    }\n'
    prompt += '  ],\n'

    // 置信度计算
    if (options.calculateConfidence !== false) {
      prompt += '  "confidence": "整体分析置信度（0-1之间的数字）"\n'
    }

    prompt += '}\n```\n\n'

    prompt += '分析要求：\n'
    prompt += '1. 提供准确的数值评估\n'
    prompt += '2. 确保标签和关键词具有代表性\n'
    prompt += '3. 置信度要基于内容的清晰度和一致性\n'
    prompt += '4. 返回格式必须是有效的JSON\n\n'

    prompt += '请直接返回JSON结果，不要添加其他说明文字。'

    return prompt
  }

  /**
   * 解析分析结果
   */
  private parseAnalysisResult(content: string, metadata: ProcessingMetadata): SemanticAnalysis {
    try {
      // 提取JSON部分
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                       content.match(/\{[\s\S]*\}/)

      if (!jsonMatch) {
        throw new Error('无法找到有效的JSON格式分析结果')
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(jsonStr)

      // 构建标准化的语义分析结果
      return {
        semanticType: parsed.semanticType || '未知类型',
        importanceLevel: this.normalizeImportance(parsed.importanceLevel),
        keyTerms: this.normalizeArray(parsed.keyTerms),
        sentiment: this.normalizeSentiment(parsed.sentiment),
        sentimentScore: this.normalizeScore(parsed.sentimentScore, 0),
        complexity: this.normalizeComplexity(parsed.complexity),
        complexityScore: this.normalizeScore(parsed.complexityScore, 5),
        readability: this.normalizeScore(parsed.readability, 5),
        topics: this.normalizeTopics(parsed.topics),
        entities: this.normalizeEntities(parsed.entities),
        tags: this.normalizeArray(parsed.tags),
        confidence: this.normalizeScore(parsed.confidence, 0.5),
        metadata
      }

    } catch (error) {
      // 如果解析失败，返回基础分析结果
      console.warn('语义分析结果解析失败，返回默认结果:', error)

      return {
        semanticType: '文本内容',
        importanceLevel: 5,
        keyTerms: this.extractBasicTerms(content),
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
   * 标准化重要性等级
   */
  private normalizeImportance(value: any): number {
    const num = Number(value)
    if (isNaN(num)) return 5
    return Math.max(1, Math.min(10, Math.round(num)))
  }

  /**
   * 标准化分数
   */
  private normalizeScore(value: any, defaultValue: number): number {
    const num = Number(value)
    if (isNaN(num)) return defaultValue
    return Math.max(0, Math.min(1, num))
  }

  /**
   * 标准化情感
   */
  private normalizeSentiment(value: any): 'positive' | 'neutral' | 'negative' {
    const sentiment = String(value).toLowerCase()
    if (['positive', 'negative', 'neutral'].includes(sentiment)) {
      return sentiment as 'positive' | 'neutral' | 'negative'
    }
    return 'neutral'
  }

  /**
   * 标准化复杂度
   */
  private normalizeComplexity(value: any): 'low' | 'medium' | 'high' {
    const complexity = String(value).toLowerCase()
    if (['low', 'medium', 'high'].includes(complexity)) {
      return complexity as 'low' | 'medium' | 'high'
    }
    return 'medium'
  }

  /**
   * 标准化数组
   */
  private normalizeArray(value: any): string[] {
    if (!Array.isArray(value)) return []
    return value.map(item => String(item)).filter(item => item.trim())
  }

  /**
   * 标准化主题
   */
  private normalizeTopics(value: any): Array<{name: string; relevance: number; confidence: number}> {
    if (!Array.isArray(value)) return []

    return value.map(topic => ({
      name: String(topic.name || '').trim(),
      relevance: this.normalizeScore(topic.relevance, 0.5),
      confidence: this.normalizeScore(topic.confidence, 0.5)
    })).filter(topic => topic.name)
  }

  /**
   * 标准化实体
   */
  private normalizeEntities(value: any): Array<{text: string; type: string; confidence: number}> {
    if (!Array.isArray(value)) return []

    return value.map(entity => ({
      text: String(entity.text || '').trim(),
      type: String(entity.type || '未知').trim(),
      confidence: this.normalizeScore(entity.confidence, 0.5)
    })).filter(entity => entity.text)
  }

  /**
   * 基础术语提取（备用方案）
   */
  private extractBasicTerms(content: string): string[] {
    // 简单的关键词提取
    const words = content
      .replace(/[^\u4e00-\u9fa5\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1)

    const wordCount: Record<string, number> = {}
    words.forEach(word => {
      const lower = word.toLowerCase()
      wordCount[lower] = (wordCount[lower] || 0) + 1
    })

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  /**
   * 批量分析多个内容
   */
  async analyzeBatch(contents: string[], options: SemanticOptions): Promise<SemanticAnalysis[]> {
    const promises = contents.map(content => this.analyze(content, options))
    return Promise.all(promises)
  }

  /**
   * 比较两个内容的语义相似性
   */
  async compareSemantics(content1: string, content2: string): Promise<{
    similarity: number
    commonTopics: string[]
    differences: string[]
    confidence: number
  }> {
    const [analysis1, analysis2] = await Promise.all([
      this.analyze(content1, { detectTopics: true, extractTags: true }),
      this.analyze(content2, { detectTopics: true, extractTags: true })
    ])

    // 计算相似性
    const tags1 = new Set(analysis1.tags)
    const tags2 = new Set(analysis2.tags)
    const commonTags = Array.from(tags1).filter(tag => tags2.has(tag))
    const allTags = new Set([...tags1, ...tags2])

    const similarity = allTags.size > 0 ? commonTags.length / allTags.size : 0

    // 提取共同主题
    const topics1 = analysis1.topics.map(t => t.name)
    const topics2 = analysis2.topics.map(t => t.name)
    const commonTopics = topics1.filter(topic => topics2.includes(topic))

    // 提取差异
    const uniqueTags1 = Array.from(tags1).filter(tag => !tags2.has(tag))
    const uniqueTags2 = Array.from(tags2).filter(tag => !tags1.has(tag))
    const differences = [...uniqueTags1, ...uniqueTags2]

    // 计算置信度
    const confidence = (analysis1.confidence + analysis2.confidence) / 2

    return {
      similarity,
      commonTopics,
      differences,
      confidence
    }
  }
}