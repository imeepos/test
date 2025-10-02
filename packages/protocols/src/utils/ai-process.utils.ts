/**
 * AI 处理工具函数
 *
 * 提供 AI 任务处理相关的业务逻辑和计算函数
 */

import type { AIProcessRequest, AIProcessResponse, TaskStatus } from '../contracts/ai-process.contract.js'

// ============================================================================
// 任务优先级计算
// ============================================================================

/**
 * 计算任务的处理优先级
 *
 * 基于任务创建时间、上下文大小等因素计算优先级分数
 *
 * @param request - AI 处理请求
 * @returns 优先级分数 (数字越大优先级越高)
 *
 * @example
 * const priority = calculateTaskPriority(request)
 * console.log(priority) // 85
 */
export function calculateTaskPriority(request: AIProcessRequest): number {
  const now = Date.now()
  const taskAge = now - request.timestamp.getTime()

  // 基础优先级 (50)
  let priority = 50

  // 时间因素: 等待越久优先级越高 (最多 +30)
  const ageBonus = Math.min(30, Math.floor(taskAge / 1000 / 60)) // 每分钟 +1
  priority += ageBonus

  // 上下文大小: 较短的任务优先处理 (最多 +20)
  const contextLength = request.context.length + request.prompt.length
  if (contextLength < 500) {
    priority += 20
  } else if (contextLength < 2000) {
    priority += 10
  }

  // 元数据优先级调整
  if (request.metadata?.retryCount && request.metadata.retryCount > 0) {
    priority += 15 // 重试任务优先
  }

  return Math.min(100, priority) // 最高 100
}

// ============================================================================
// 上下文构建
// ============================================================================

/**
 * 构建 AI 处理的完整提示词
 *
 * 将上下文和用户提示词组合成完整的 AI 提示
 *
 * @param context - 上下文信息
 * @param prompt - 用户提示词
 * @returns 完整提示词
 *
 * @example
 * const fullPrompt = buildAIPrompt(context, '分析技术架构')
 * // 输出:
 * // 基于以下上下文：
 * //
 * // [context 内容]
 * //
 * // 请完成：分析技术架构
 */
export function buildAIPrompt(context: string, prompt: string): string {
  if (!context.trim()) {
    // 无上下文场景（一生万物）
    return prompt
  }

  // 有上下文场景
  return `基于以下上下文：

${context}

请完成：${prompt}`
}

// ============================================================================
// Token 估算
// ============================================================================

/**
 * 估算请求的 Token 数量
 *
 * 粗略估算文本的 Token 数（中文约 2 字符/token，英文约 4 字符/token）
 *
 * @param request - AI 处理请求
 * @returns 估算的 Token 数
 *
 * @example
 * const tokens = estimateTokenCount(request)
 * console.log(tokens) // 450
 */
export function estimateTokenCount(request: AIProcessRequest): number {
  const text = request.context + request.prompt

  // 简单估算: 中文约 2 字符/token，英文约 4 字符/token
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const otherChars = text.length - chineseChars

  return Math.ceil(chineseChars / 2 + otherChars / 4)
}

// ============================================================================
// 成本估算
// ============================================================================

/**
 * 估算任务处理成本（美元）
 *
 * 基于 Token 数量和模型定价估算成本
 *
 * @param tokenCount - Token 数量
 * @param modelName - 模型名称
 * @returns 估算成本（美元）
 *
 * @example
 * const cost = estimateTaskCost(500, 'gpt-4')
 * console.log(cost) // 0.015 (约 1.5 美分)
 */
export function estimateTaskCost(
  tokenCount: number,
  modelName: string = 'gpt-4'
): number {
  // 模型定价 (美元/1K tokens)
  const pricing: Record<string, number> = {
    'gpt-4': 0.03,
    'gpt-4-turbo': 0.01,
    'gpt-3.5-turbo': 0.0015,
    'gpt-4o': 0.005,
    'gpt-4o-mini': 0.00015
  }

  const pricePerToken = (pricing[modelName] ?? pricing['gpt-4'] ?? 0.03) / 1000
  return tokenCount * pricePerToken
}

// ============================================================================
// 模型选择
// ============================================================================

/**
 * 根据任务特征推荐合适的模型
 *
 * 基于上下文大小和任务复杂度自动选择模型
 *
 * @param request - AI 处理请求
 * @returns 推荐的模型名称
 *
 * @example
 * const model = recommendModel(request)
 * console.log(model) // 'gpt-4o'
 */
export function recommendModel(request: AIProcessRequest): string {
  const tokenCount = estimateTokenCount(request)
  const hasMultipleInputs = request.metadata?.sourceNodeIds &&
                            request.metadata.sourceNodeIds.length > 1

  // 大规模上下文或多输入融合 → gpt-4
  if (tokenCount > 2000 || hasMultipleInputs) {
    return 'gpt-4'
  }

  // 中等规模 → gpt-4o (性价比高)
  if (tokenCount > 500) {
    return 'gpt-4o'
  }

  // 简单任务 → gpt-4o-mini
  return 'gpt-4o-mini'
}

// ============================================================================
// 响应质量评估
// ============================================================================

/**
 * 评估 AI 响应的质量
 *
 * 基于多个维度计算质量分数
 *
 * @param response - AI 处理响应
 * @returns 质量分数 (0-100)
 *
 * @example
 * const quality = evaluateResponseQuality(response)
 * console.log(quality) // 85
 */
export function evaluateResponseQuality(response: AIProcessResponse): number {
  if (!response.success || !response.result) {
    return 0
  }

  const { result } = response
  let score = 0

  // 内容长度合理性 (最多 30 分)
  const contentLength = result.content.length
  if (contentLength >= 50 && contentLength <= 5000) {
    score += 30
  } else if (contentLength >= 20 && contentLength <= 10000) {
    score += 15
  }

  // AI 置信度 (最多 40 分)
  score += result.confidence * 40

  // 有标题 (+10 分)
  if (result.title && result.title.length > 0) {
    score += 10
  }

  // 有语义类型 (+10 分)
  if (result.semanticType) {
    score += 10
  }

  // 有重要性等级 (+10 分)
  if (result.importanceLevel) {
    score += 10
  }

  return Math.min(100, Math.round(score))
}

// ============================================================================
// 任务状态判断
// ============================================================================

/**
 * 判断任务是否处于终态
 *
 * @param status - 任务状态
 * @returns 是否为终态
 *
 * @example
 * isTerminalStatus('completed') // true
 * isTerminalStatus('processing') // false
 */
export function isTerminalStatus(status: TaskStatus): boolean {
  return status === 'completed' || status === 'failed' || status === 'cancelled'
}

/**
 * 判断任务是否可重试
 *
 * @param response - AI 处理响应
 * @returns 是否可重试
 *
 * @example
 * canRetryTask(response) // true (如果 error.retryable === true)
 */
export function canRetryTask(response: AIProcessResponse): boolean {
  return !response.success && response.error?.retryable === true
}
