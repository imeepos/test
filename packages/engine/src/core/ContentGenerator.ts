import type {
  AIProvider,
  GenerateRequest,
  GenerateResult,
  OptimizeRequest,
  OptimizeResult,
  FusionRequest,
  FusionResult,
  ExpandRequest,
  ExpandResult
} from '@/types'

/**
 * 内容生成器类
 * 负责处理各种类型的内容生成任务
 */
export class ContentGenerator {
  private provider: AIProvider

  constructor(provider: AIProvider) {
    this.provider = provider
  }

  /**
   * 生成内容
   */
  async generate(request: GenerateRequest): Promise<GenerateResult> {
    // 构建生成提示词
    const fullPrompt = this.buildGeneratePrompt(request)

    const enhancedRequest: GenerateRequest = {
      ...request,
      prompt: fullPrompt
    }

    return await this.provider.generate(enhancedRequest)
  }

  /**
   * 优化内容
   */
  async optimize(request: OptimizeRequest): Promise<OptimizeResult> {
    // 构建优化提示词
    const optimizePrompt = this.buildOptimizePrompt(request)

    const generateRequest: GenerateRequest = {
      prompt: optimizePrompt,
      inputs: [request.content],
      context: request.context,
      model: request.model
    }

    const result = await this.provider.generate(generateRequest)

    return this.convertToOptimizeResult(result, request)
  }

  /**
   * 融合生成
   */
  async fusion(request: FusionRequest): Promise<FusionResult> {
    // 构建融合提示词
    const fusionPrompt = this.buildFusionPrompt(request)

    const generateRequest: GenerateRequest = {
      prompt: fusionPrompt,
      inputs: request.inputs,
      context: request.context,
      model: request.model
    }

    const result = await this.provider.generate(generateRequest)

    return this.convertToFusionResult(result, request)
  }

  /**
   * 扩展内容
   */
  async expand(request: ExpandRequest): Promise<ExpandResult> {
    // 构建扩展提示词
    const expandPrompt = this.buildExpandPrompt(request)

    const generateRequest: GenerateRequest = {
      prompt: expandPrompt,
      inputs: [request.baseContent],
      context: request.context,
      model: request.model
    }

    const result = await this.provider.generate(generateRequest)

    return this.convertToExpandResult(result, request)
  }

  /**
   * 构建生成提示词
   */
  private buildGeneratePrompt(request: GenerateRequest): string {
    let prompt = `${request.prompt}\n\n`

    // 添加输入内容
    if (request.inputs && request.inputs.length > 0) {
      prompt += '基于以下输入内容：\n'
      request.inputs.forEach((input, index) => {
        prompt += `${index + 1}. ${input}\n`
      })
      prompt += '\n'
    }

    // 添加上下文
    if (request.context) {
      prompt += `上下文信息：${request.context}\n\n`
    }

    // 添加风格要求
    if (request.style) {
      prompt += `请使用${request.style}风格。`
    }

    // 添加长度要求
    if (request.length) {
      const lengthMap = {
        short: '简洁',
        medium: '适中',
        long: '详细'
      }
      prompt += `内容长度应该${lengthMap[request.length]}。`
    }

    prompt += '\n\n请生成高质量的内容，确保逻辑清晰、表达准确。'

    return prompt
  }

  /**
   * 构建优化提示词
   */
  private buildOptimizePrompt(request: OptimizeRequest): string {
    let prompt = `请优化以下内容：\n\n"${request.content}"\n\n`

    prompt += `优化要求：${request.instruction}\n\n`

    if (request.context) {
      prompt += `上下文信息：${request.context}\n\n`
    }

    if (request.targetStyle) {
      prompt += `目标风格：${request.targetStyle}\n`
    }

    if (request.targetLength) {
      const lengthMap = {
        shorter: '更简洁',
        longer: '更详细',
        same: '保持相同长度'
      }
      prompt += `长度调整：${lengthMap[request.targetLength]}\n`
    }

    prompt += `\n请提供优化后的内容，并说明主要改进点。格式如下：\n`
    prompt += `优化后的内容：\n[优化后的内容]\n\n`
    prompt += `主要改进：\n[改进说明]`

    return prompt
  }

  /**
   * 构建融合提示词
   */
  private buildFusionPrompt(request: FusionRequest): string {
    let prompt = `请将以下内容进行${this.getFusionTypeDescription(request.fusionType)}：\n\n`

    request.inputs.forEach((input, index) => {
      prompt += `内容 ${index + 1}：\n${input}\n\n`
    })

    prompt += `融合指导：${request.instruction}\n\n`

    if (request.context) {
      prompt += `上下文：${request.context}\n\n`
    }

    prompt += `请提供融合后的内容，确保：\n`
    prompt += `1. 保持各部分内容的核心价值\n`
    prompt += `2. 形成连贯的整体\n`
    prompt += `3. 突出关键洞察\n\n`
    prompt += `格式如下：\n`
    prompt += `融合内容：\n[融合后的内容]\n\n`
    prompt += `关键洞察：\n[重要发现和洞察]`

    return prompt
  }

  /**
   * 构建扩展提示词
   */
  private buildExpandPrompt(request: ExpandRequest): string {
    let prompt = `请扩展以下内容：\n\n"${request.baseContent}"\n\n`

    prompt += `扩展指导：${request.instruction}\n\n`

    if (request.context) {
      prompt += `上下文信息：${request.context}\n\n`
    }

    prompt += `扩展类型：${this.getExpansionTypeDescription(request.expansionType)}\n\n`

    if (request.targetLength) {
      prompt += `目标长度：约${request.targetLength}字\n\n`
    }

    prompt += `请提供扩展后的内容，确保：\n`
    prompt += `1. 保持原内容的核心观点\n`
    prompt += `2. 添加有价值的新信息\n`
    prompt += `3. 保持逻辑连贯性\n\n`
    prompt += `格式如下：\n`
    prompt += `扩展内容：\n[扩展后的完整内容]\n\n`
    prompt += `新增部分：\n[列出主要新增的部分]`

    return prompt
  }

  /**
   * 获取融合类型描述
   */
  private getFusionTypeDescription(type: string): string {
    const typeMap: Record<string, string> = {
      synthesis: '综合分析',
      comparison: '对比分析',
      integration: '整合',
      summary: '总结'
    }
    return typeMap[type] || '融合'
  }

  /**
   * 获取扩展类型描述
   */
  private getExpansionTypeDescription(type: string): string {
    const typeMap: Record<string, string> = {
      detail: '添加更多细节和说明',
      examples: '补充实例和案例',
      analysis: '深入分析和解释',
      implications: '探讨影响和意义'
    }
    return typeMap[type] || '详细扩展'
  }

  /**
   * 转换为优化结果
   */
  private convertToOptimizeResult(result: GenerateResult, request: OptimizeRequest): OptimizeResult {
    // 解析生成的内容，提取优化后的内容和改进说明
    const content = result.content
    const parts = content.split('主要改进：')

    let optimizedContent = content
    let improvementSummary = '内容已优化'
    let changes: string[] = []

    if (parts.length >= 2) {
      // 提取优化后的内容
      const contentPart = parts[0].replace('优化后的内容：', '').trim()
      if (contentPart) {
        optimizedContent = contentPart
      }

      // 提取改进说明
      const improvementPart = parts[1].trim()
      if (improvementPart) {
        improvementSummary = improvementPart
        changes = improvementPart.split('\n').filter(line => line.trim())
      }
    }

    return {
      optimizedContent,
      improvementSummary,
      confidence: result.confidence,
      changes,
      metadata: result.metadata
    }
  }

  /**
   * 转换为融合结果
   */
  private convertToFusionResult(result: GenerateResult, request: FusionRequest): FusionResult {
    // 解析生成的内容，提取融合内容和关键洞察
    const content = result.content
    const parts = content.split('关键洞察：')

    let fusedContent = content
    let keyInsights: string[] = []

    if (parts.length >= 2) {
      // 提取融合内容
      const contentPart = parts[0].replace('融合内容：', '').trim()
      if (contentPart) {
        fusedContent = contentPart
      }

      // 提取关键洞察
      const insightsPart = parts[1].trim()
      if (insightsPart) {
        keyInsights = insightsPart.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('[') && !line.endsWith(']'))
      }
    }

    // 简单的源映射（平均分配权重）
    const sourceMapping: Record<string, number> = {}
    request.inputs.forEach((_, index) => {
      sourceMapping[`source_${index}`] = 1.0 / request.inputs.length
    })

    return {
      fusedContent,
      keyInsights,
      confidence: result.confidence,
      sourceMapping,
      metadata: result.metadata
    }
  }

  /**
   * 转换为扩展结果
   */
  private convertToExpandResult(result: GenerateResult, request: ExpandRequest): ExpandResult {
    // 解析生成的内容，提取扩展内容和新增部分
    const content = result.content
    const parts = content.split('新增部分：')

    let expandedContent = content
    let addedSections: string[] = []

    if (parts.length >= 2) {
      // 提取扩展内容
      const contentPart = parts[0].replace('扩展内容：', '').trim()
      if (contentPart) {
        expandedContent = contentPart
      }

      // 提取新增部分
      const addedPart = parts[1].trim()
      if (addedPart) {
        addedSections = addedPart.split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('[') && !line.endsWith(']'))
      }
    }

    // 计算扩展比例
    const originalLength = request.baseContent.length
    const expandedLength = expandedContent.length
    const expansionRatio = expandedLength / originalLength

    return {
      expandedContent,
      addedSections,
      confidence: result.confidence,
      expansionRatio,
      metadata: result.metadata
    }
  }
}