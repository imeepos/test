/**
 * 默认提示词模板集合
 * 提供可选的、预设的提示词模板，用户可以选择使用或自定义
 */

export interface PromptTemplateOptions {
  inputs?: string[]
  context?: string
  instruction?: string
  content?: string
  style?: string
  length?: 'short' | 'medium' | 'long'
  targetStyle?: string
  targetLength?: 'shorter' | 'longer' | 'same'
  fusionType?: 'synthesis' | 'comparison' | 'integration' | 'summary'
  expansionType?: 'detail' | 'examples' | 'analysis' | 'implications'
}

/**
 * 默认提示词模板
 */
export const DEFAULT_PROMPTS = {
  /**
   * 生成内容提示词
   */
  generate: (options: PromptTemplateOptions): string => {
    const { inputs = [], context, instruction, style, length } = options

    let prompt = instruction || '请生成内容'

    if (inputs.length > 0) {
      prompt += '\n\n基于以下输入：\n'
      inputs.forEach((input, index) => {
        prompt += `${index + 1}. ${input}\n`
      })
    }

    if (context) {
      prompt += `\n\n上下文：${context}`
    }

    if (style) {
      prompt += `\n\n风格：${style}`
    }

    if (length) {
      const lengthMap = { short: '简洁', medium: '适中', long: '详细' }
      prompt += `\n\n长度要求：${lengthMap[length]}`
    }

    return prompt
  },

  /**
   * 优化内容提示词
   */
  optimize: (options: PromptTemplateOptions): string => {
    const { content = '', instruction, context, targetStyle, targetLength } = options

    let prompt = `请优化以下内容：\n\n"${content}"\n\n`

    if (instruction) {
      prompt += `优化要求：${instruction}\n\n`
    }

    if (context) {
      prompt += `上下文：${context}\n\n`
    }

    if (targetStyle) {
      prompt += `目标风格：${targetStyle}\n`
    }

    if (targetLength) {
      const lengthMap = { shorter: '更简洁', longer: '更详细', same: '保持相同长度' }
      prompt += `长度调整：${lengthMap[targetLength]}\n`
    }

    return prompt
  },

  /**
   * 融合内容提示词
   */
  fusion: (options: PromptTemplateOptions): string => {
    const { inputs = [], instruction, context, fusionType = 'synthesis' } = options

    const typeMap: Record<string, string> = {
      synthesis: '综合分析',
      comparison: '对比分析',
      integration: '整合',
      summary: '总结'
    }

    let prompt = `请将以下内容进行${typeMap[fusionType]}：\n\n`

    inputs.forEach((input, index) => {
      prompt += `内容 ${index + 1}：\n${input}\n\n`
    })

    if (instruction) {
      prompt += `融合指导：${instruction}\n\n`
    }

    if (context) {
      prompt += `上下文：${context}\n\n`
    }

    return prompt
  },

  /**
   * 扩展内容提示词
   */
  expand: (options: PromptTemplateOptions): string => {
    const { content = '', instruction, context, expansionType = 'detail' } = options

    const typeMap: Record<string, string> = {
      detail: '添加更多细节和说明',
      examples: '补充实例和案例',
      analysis: '深入分析和解释',
      implications: '探讨影响和意义'
    }

    let prompt = `请扩展以下内容：\n\n"${content}"\n\n`

    if (instruction) {
      prompt += `扩展指导：${instruction}\n\n`
    }

    if (context) {
      prompt += `上下文：${context}\n\n`
    }

    prompt += `扩展类型：${typeMap[expansionType]}\n\n`

    return prompt
  },

  /**
   * 语义分析提示词
   */
  analyze: (content: string): string => {
    return `请对以下内容进行详细的语义分析：\n\n"${content}"\n\n请以JSON格式返回分析结果。`
  }
}
