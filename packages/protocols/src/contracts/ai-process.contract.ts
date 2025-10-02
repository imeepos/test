/**
 * AI 处理协议 - 统一的 context + prompt 模式
 *
 * 所有 AI 任务都是平等的，不区分任务类型
 * 核心理念：context（上下文）+ prompt（用户意图）→ content（生成内容）
 *
 * @version 2.0.0
 */

import { z } from 'zod'

// ============================================================================
// 基础类型
// ============================================================================

/**
 * 任务状态
 */
export const TaskStatus = z.enum(['queued', 'processing', 'completed', 'failed', 'cancelled'])
export type TaskStatus = z.infer<typeof TaskStatus>

// ============================================================================
// AI 处理请求
// ============================================================================

/**
 * 任务元数据（用于追踪和调试）
 */
export const TaskMetadataSchema = z.object({
  /** 来源节点ID列表（用于多输入融合） */
  sourceNodeIds: z.array(z.string().uuid()).optional(),

  /** 重试次数 */
  retryCount: z.number().int().min(0).optional(),

  /** 会话ID */
  sessionId: z.string().optional(),

  /** 用户代理 */
  userAgent: z.string().optional(),

  /** 其他自定义元数据 */
  customMetadata: z.record(z.unknown()).optional()
}).strict()

export type TaskMetadata = z.infer<typeof TaskMetadataSchema>

/**
 * AI 处理请求 - 统一的任务格式
 *
 * 不区分任务类型，所有任务都是 context + prompt
 *
 * @example
 * // 场景1: 一生万物（双击画布创建）
 * {
 *   taskId: uuid(),
 *   nodeId: newNodeId,
 *   projectId: projectId,
 *   userId: userId,
 *   context: '',  // 无上下文
 *   prompt: '我想做一个电商网站',
 *   timestamp: new Date()
 * }
 *
 * @example
 * // 场景2: 一生二（拖拽连线扩展）
 * {
 *   taskId: uuid(),
 *   nodeId: newNodeId,
 *   projectId: projectId,
 *   userId: userId,
 *   context: parentNode.content,  // 父节点内容作为上下文
 *   prompt: '分析这个需求的技术架构',
 *   timestamp: new Date()
 * }
 *
 * @example
 * // 场景3: 二生三（多输入融合）
 * {
 *   taskId: uuid(),
 *   nodeId: fusionNodeId,
 *   projectId: projectId,
 *   userId: userId,
 *   context: `${node1.title}\n${node1.content}\n\n---\n\n${node2.title}\n${node2.content}`,
 *   prompt: '综合以上分析，制定产品MVP方案',
 *   timestamp: new Date(),
 *   metadata: {
 *     sourceNodeIds: [node1.id, node2.id]
 *   }
 * }
 *
 * @example
 * // 场景4: 万物重生（内容优化）
 * {
 *   taskId: uuid(),
 *   nodeId: existingNodeId,
 *   projectId: projectId,
 *   userId: userId,
 *   context: `${existingNode.title}\n${existingNode.content}`,
 *   prompt: '增加更详细的技术实现细节',
 *   timestamp: new Date()
 * }
 */
export const AIProcessRequestSchema = z.object({
  // ========================================
  // 任务标识
  // ========================================

  /** 任务ID（UUID v4） */
  taskId: z.string().uuid(),

  /** 关联的节点ID */
  nodeId: z.string().uuid(),

  /** 所属项目ID */
  projectId: z.string().uuid(),

  /** 发起用户ID */
  userId: z.string().uuid(),

  // ========================================
  // 核心：context + prompt
  // ========================================

  /**
   * 上下文信息
   *
   * 可以是：
   * - 空字符串（一生万物场景）
   * - 单个节点内容（一生二场景）
   * - 多个节点内容拼接（二生三场景）
   * - 当前节点内容（万物重生场景）
   *
   * 由前端/Broker负责组装
   */
  context: z.string(),

  /**
   * 用户提示词
   *
   * 用户的意图表达，描述期望的输出
   */
  prompt: z.string().min(1, 'Prompt cannot be empty'),

  // ========================================
  // 时间戳和元数据
  // ========================================

  /** 任务创建时间戳 */
  timestamp: z.date(),

  /** 任务元数据（可选，用于追踪和调试） */
  metadata: TaskMetadataSchema.optional()
}).strict()

export type AIProcessRequest = z.infer<typeof AIProcessRequestSchema>

// ============================================================================
// AI 处理结果
// ============================================================================

/**
 * AI 生成的内容结果
 */
export const AIGeneratedContentSchema = z.object({
  /** 生成的内容 */
  content: z.string(),

  /** 生成的标题 */
  title: z.string(),

  /** 语义类型（可选，由AI推断） */
  semanticType: z.enum([
    'requirement',
    'solution',
    'plan',
    'analysis',
    'idea',
    'question',
    'answer',
    'decision'
  ]).optional(),

  /** 重要性级别（可选，由AI推断，1-5） */
  importanceLevel: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5)
  ]).optional(),

  /** 置信度 (0-1) */
  confidence: z.number().min(0).max(1),

  /** 标签（可选） */
  tags: z.array(z.string()).optional()
}).strict()

export type AIGeneratedContent = z.infer<typeof AIGeneratedContentSchema>

/**
 * AI 处理的统计信息
 */
export const AIProcessingStatsSchema = z.object({
  /** 自动选择的模型（由系统根据 context + prompt 决定） */
  modelUsed: z.string(),

  /** 消耗的 Token 数 */
  tokenCount: z.number().int().nonnegative().optional(),

  /** 处理耗时（毫秒） */
  processingTime: z.number().nonnegative(),

  /** 请求ID（用于追踪） */
  requestId: z.string().optional()
}).strict()

export type AIProcessingStats = z.infer<typeof AIProcessingStatsSchema>

/**
 * AI 处理错误信息
 */
export const AIProcessErrorSchema = z.object({
  /** 错误代码 */
  code: z.string(),

  /** 错误消息 */
  message: z.string(),

  /** 是否可重试 */
  retryable: z.boolean(),

  /** 详细错误信息 */
  details: z.unknown().optional()
}).strict()

export type AIProcessError = z.infer<typeof AIProcessErrorSchema>

/**
 * AI 处理响应
 */
const AIProcessResponseSchemaBase = z.object({
  /** 任务ID */
  taskId: z.string().uuid(),

  /** 节点ID */
  nodeId: z.string().uuid(),

  /** 项目ID */
  projectId: z.string().uuid(),

  /** 用户ID */
  userId: z.string().uuid(),

  /** 任务状态 */
  status: TaskStatus,

  /** 是否成功 */
  success: z.boolean(),

  /** 生成结果（成功时必需） */
  result: AIGeneratedContentSchema.optional(),

  /** 错误信息（失败时必需） */
  error: AIProcessErrorSchema.optional(),

  /** 处理统计信息 */
  stats: AIProcessingStatsSchema.optional(),

  /** 响应时间戳 */
  timestamp: z.date()
}).strict()

/**
 * AI 处理响应 Schema（带精炼约束）
 */
export const AIProcessResponseSchema = AIProcessResponseSchemaBase.refine(
  (data): data is z.infer<typeof AIProcessResponseSchemaBase> => {
    // 成功时必须有 result
    if (data.success && !data.result) {
      return false
    }
    // 失败时必须有 error
    if (!data.success && !data.error) {
      return false
    }
    return true
  },
  {
    message: 'Success response must have result, failed response must have error'
  }
)

export type AIProcessResponse = z.infer<typeof AIProcessResponseSchema>

// ============================================================================
// 任务状态更新
// ============================================================================

/**
 * 任务进度更新
 */
export const TaskProgressUpdateSchema = z.object({
  /** 任务ID */
  taskId: z.string().uuid(),

  /** 节点ID */
  nodeId: z.string().uuid(),

  /** 当前状态 */
  status: TaskStatus,

  /** 进度百分比 (0-100) */
  progress: z.number().min(0).max(100),

  /** 进度消息 */
  message: z.string().optional(),

  /** 更新时间戳 */
  timestamp: z.date()
}).strict()

export type TaskProgressUpdate = z.infer<typeof TaskProgressUpdateSchema>

// ============================================================================
// 协议版本
// ============================================================================

export const AI_PROCESS_PROTOCOL_VERSION = '2.0.0' as const

/**
 * AI 处理协议契约 V2
 */
export const AIProcessContractV2 = {
  version: AI_PROCESS_PROTOCOL_VERSION,
  schemas: {
    request: AIProcessRequestSchema,
    response: AIProcessResponseSchema,
    progressUpdate: TaskProgressUpdateSchema,
    metadata: TaskMetadataSchema,
    generatedContent: AIGeneratedContentSchema,
    processingStats: AIProcessingStatsSchema,
    error: AIProcessErrorSchema
  }
} as const
