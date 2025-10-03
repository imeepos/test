import { DEFAULT_PROMPTS, type PromptTemplateOptions } from './DefaultPrompts.js'

/**
 * 提示词构建器
 * 提供便捷的方法来构建各种类型的提示词
 */
export class PromptBuilder {
  /**
   * 构建生成内容的提示词
   */
  static buildGenerate(options: PromptTemplateOptions): string {
    return DEFAULT_PROMPTS.generate(options)
  }

  /**
   * 构建优化内容的提示词
   */
  static buildOptimize(options: PromptTemplateOptions): string {
    return DEFAULT_PROMPTS.optimize(options)
  }

  /**
   * 构建融合内容的提示词
   */
  static buildFusion(options: PromptTemplateOptions): string {
    return DEFAULT_PROMPTS.fusion(options)
  }

  /**
   * 构建扩展内容的提示词
   */
  static buildExpand(options: PromptTemplateOptions): string {
    return DEFAULT_PROMPTS.expand(options)
  }

  /**
   * 构建语义分析的提示词
   */
  static buildAnalyze(content: string): string {
    return DEFAULT_PROMPTS.analyze(content)
  }

  /**
   * 通用构建方法 - 根据类型自动选择模板
   */
  static build(
    type: 'generate' | 'optimize' | 'fusion' | 'expand' | 'analyze',
    options: PromptTemplateOptions | string
  ): string {
    if (type === 'analyze' && typeof options === 'string') {
      return DEFAULT_PROMPTS.analyze(options)
    }

    if (typeof options === 'string') {
      throw new Error('Invalid options type for non-analyze task')
    }

    switch (type) {
      case 'generate':
        return DEFAULT_PROMPTS.generate(options)
      case 'optimize':
        return DEFAULT_PROMPTS.optimize(options)
      case 'fusion':
        return DEFAULT_PROMPTS.fusion(options)
      case 'expand':
        return DEFAULT_PROMPTS.expand(options)
      default:
        throw new Error(`Unknown prompt type: ${type}`)
    }
  }

  /**
   * 合并 prompt 和 context
   */
  static merge(prompt: string, context?: string): string {
    if (!context) return prompt
    return `${context}\n\n${prompt}`
  }

  /**
   * 从旧格式请求转换为 prompt
   * 用于向后兼容
   */
  static fromLegacyRequest(request: {
    type?: string
    prompt?: string
    inputs?: string[]
    instruction?: string
    content?: string
    context?: string
    [key: string]: any
  }): string {
    // 如果已经有 prompt，直接返回
    if (request.prompt) {
      return request.prompt
    }

    // 根据类型构建 prompt
    const type = request.type || 'generate'

    switch (type) {
      case 'generate':
        return this.buildGenerate({
          inputs: request.inputs,
          instruction: request.instruction,
          context: request.context
        })

      case 'optimize':
        return this.buildOptimize({
          content: request.content || (request.inputs?.[0]),
          instruction: request.instruction || '',
          context: request.context
        })

      case 'fusion':
        return this.buildFusion({
          inputs: request.inputs,
          instruction: request.instruction || '',
          context: request.context
        })

      case 'expand':
        return this.buildExpand({
          content: request.content || (request.inputs?.[0]),
          instruction: request.instruction || '',
          context: request.context
        })

      default:
        return request.instruction || '请处理以下内容'
    }
  }
}
