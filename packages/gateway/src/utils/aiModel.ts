import { getAIConfig } from '@sker/config'

const FALLBACK_MODEL = 'gpt-3.5-turbo'

const cachedAIConfig = (() => {
  try {
    return getAIConfig()
  } catch (error) {
    console.warn('[Gateway] 无法加载AI配置，使用默认模型', error)
    return undefined
  }
})()

const configuredDefault = process.env.OPENAI_DEFAULT_MODEL?.trim()
const resolvedDefaultModel = configuredDefault || cachedAIConfig?.defaultModel || FALLBACK_MODEL

/**
 * 获取系统默认的AI模型名称
 */
export function getDefaultModel(): string {
  return resolvedDefaultModel
}

/**
 * 根据传入的候选值解析模型名称，返回第一个有效值，否则退回默认模型
 */
export function resolveModel(preferred?: string | null): string {
  const trimmed = preferred?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : resolvedDefaultModel
}

/**
 * 从多个候选值中挑选第一个有效的模型名称
 */
export function selectRequestedModel(...candidates: Array<unknown>): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim()
      if (trimmed.length > 0) {
        return trimmed
      }
    }
  }
  return undefined
}
