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
} from '../types/index.js'
import { PromptBuilder } from '../templates/PromptBuilder.js'

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
    // 向后兼容：如果使用旧格式，自动构建 prompt
    let finalRequest = request
    if (!request.prompt && (request.inputs || request.instruction)) {
      const prompt = PromptBuilder.fromLegacyRequest(request)
      finalRequest = { ...request, prompt }
    }

    return await this.provider.generate(finalRequest)
  }

  /**
   * 优化内容
   */
  async optimize(request: OptimizeRequest): Promise<OptimizeResult> {
    // 向后兼容：如果使用旧格式，自动构建 prompt
    let finalPrompt = request.prompt
    if (!finalPrompt && (request.content || request.instruction)) {
      finalPrompt = PromptBuilder.buildOptimize({
        content: request.content,
        instruction: request.instruction,
        targetStyle: request.targetStyle,
        targetLength: request.targetLength
      })
    }

    return await this.provider.optimize({
      ...request,
      prompt: finalPrompt
    })
  }

  /**
   * 融合生成
   */
  async fusion(request: FusionRequest): Promise<FusionResult> {
    // 向后兼容：如果使用旧格式，自动构建 prompt
    let finalPrompt = request.prompt
    if (!finalPrompt && (request.inputs || request.instruction)) {
      finalPrompt = PromptBuilder.buildFusion({
        inputs: request.inputs,
        instruction: request.instruction,
        fusionType: request.fusionType
      })
    }

    const generateRequest: GenerateRequest = {
      prompt: finalPrompt,
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
    // 向后兼容：如果使用旧格式，自动构建 prompt
    let finalPrompt = request.prompt
    if (!finalPrompt && (request.baseContent || request.instruction)) {
      finalPrompt = PromptBuilder.buildExpand({
        content: request.baseContent,
        instruction: request.instruction,
        expansionType: request.expansionType
      })
    }

    const generateRequest: GenerateRequest = {
      prompt: finalPrompt,
      context: request.context,
      model: request.model
    }

    const result = await this.provider.generate(generateRequest)

    return this.convertToExpandResult(result, request)
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
      content: optimizedContent, // 统一的内容字段
      optimizedContent,
      title: result.title,
      improvementSummary,
      improvements: changes,
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
    const sourceInputs = request.inputs ?? []
    if (sourceInputs.length > 0) {
      const weight = 1.0 / sourceInputs.length
      sourceInputs.forEach((_, index) => {
        sourceMapping[`source_${index}`] = weight
      })
    }

    return {
      content: fusedContent, // 统一的内容字段
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
    const originalLength = request.baseContent?.length ?? 0
    const expandedLength = expandedContent.length

    if (originalLength === 0 && expandedLength > 0) {
      console.warn('⚠️ ExpandRequest 缺少 baseContent，使用扩展内容长度估算 expansionRatio')
    }

    const expansionRatio = originalLength > 0
      ? expandedLength / originalLength
      : expandedLength > 0
        ? 1
        : 0

    return {
      expandedContent,
      addedSections,
      confidence: result.confidence,
      expansionRatio,
      metadata: result.metadata
    }
  }
}
