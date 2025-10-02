/**
 * 链条数据结构
 *
 * 用于定义线性执行序列，支持顺序AI任务处理、条件分支、循环控制
 */

import { z } from 'zod'

// ============================================================================
// 链条节点状态
// ============================================================================

export const ChainNodeStatus = z.enum([
  'pending',       // 等待执行
  'running',       // 执行中
  'completed',     // 已完成
  'failed',        // 失败
  'skipped',       // 已跳过
  'paused'         // 已暂停
])

export type ChainNodeStatus = z.infer<typeof ChainNodeStatus>

// ============================================================================
// 链条执行策略
// ============================================================================

export const ChainExecutionStrategy = z.enum([
  'sequential',    // 顺序执行
  'parallel',      // 并行执行
  'conditional',   // 条件执行
  'retry'          // 重试执行
])

export type ChainExecutionStrategy = z.infer<typeof ChainExecutionStrategy>

// ============================================================================
// 链条节点定义
// ============================================================================

export const ChainNodeSchema = z.object({
  id: z.string().uuid(),
  nodeId: z.string().uuid(),                   // 关联的实际节点ID
  order: z.number().int().nonnegative(),       // 执行顺序
  status: ChainNodeStatus.default('pending'),

  // 执行控制
  retryCount: z.number().int().nonnegative().default(0),
  maxRetries: z.number().int().nonnegative().default(3),
  timeout: z.number().int().positive().optional(), // 超时时间(ms)

  // 条件控制
  skipCondition: z.string().optional(),        // 跳过条件表达式
  continueOnError: z.boolean().default(false), // 错误时是否继续

  // 执行结果
  result: z.unknown().optional(),
  error: z.object({
    message: z.string(),
    code: z.string(),
    timestamp: z.date()
  }).optional(),

  // 时间戳
  startedAt: z.date().optional(),
  completedAt: z.date().optional()
}).strict()

export type ChainNode = z.infer<typeof ChainNodeSchema>

// ============================================================================
// 链条断点
// ============================================================================

export const ChainCheckpointSchema = z.object({
  id: z.string().uuid(),
  chainId: z.string().uuid(),
  currentNodeId: z.string().uuid(),
  completedNodeIds: z.array(z.string().uuid()),
  state: z.record(z.unknown()),                // 执行状态快照
  createdAt: z.date()
}).strict()

export type ChainCheckpoint = z.infer<typeof ChainCheckpointSchema>

// ============================================================================
// 链条实体 Schema
// ============================================================================

export const ChainSchema = z.object({
  // 核心标识
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),

  // 基本信息
  name: z.string().min(1).max(255),
  description: z.string().optional(),

  // 链条节点
  nodes: z.array(ChainNodeSchema).min(1),

  // 执行策略
  strategy: ChainExecutionStrategy.default('sequential'),

  // 执行状态
  status: z.enum(['idle', 'running', 'paused', 'completed', 'failed']).default('idle'),
  currentNodeIndex: z.number().int().nonnegative().default(0),

  // 执行控制
  autoStart: z.boolean().default(false),
  pauseOnError: z.boolean().default(true),
  enableCheckpoint: z.boolean().default(true),

  // 断点续传
  lastCheckpoint: ChainCheckpointSchema.optional(),

  // 元数据
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    priority: z.number().int().min(0).max(10).default(5),
    customData: z.record(z.unknown()).optional()
  }).optional(),

  // 时间戳
  createdAt: z.date(),
  updatedAt: z.date()
}).strict()

export type Chain = z.infer<typeof ChainSchema>

// ============================================================================
// 链条创建请求 Schema
// ============================================================================

export const CreateChainRequestSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  nodeIds: z.array(z.string().uuid()).min(1),
  strategy: ChainExecutionStrategy.optional(),
  autoStart: z.boolean().optional(),
  pauseOnError: z.boolean().optional(),
  enableCheckpoint: z.boolean().optional(),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    priority: z.number().int().min(0).max(10).optional(),
    customData: z.record(z.unknown()).optional()
  }).optional()
}).strict()

export type CreateChainRequest = z.infer<typeof CreateChainRequestSchema>

// ============================================================================
// 链条执行控制请求 Schema
// ============================================================================

export const ChainExecutionControlSchema = z.object({
  action: z.enum(['start', 'pause', 'resume', 'stop', 'retry']),
  fromCheckpoint: z.boolean().optional(),
  checkpointId: z.string().uuid().optional()
}).strict()

export type ChainExecutionControl = z.infer<typeof ChainExecutionControlSchema>

// ============================================================================
// 链条更新请求 Schema
// ============================================================================

export const UpdateChainRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  strategy: ChainExecutionStrategy.optional(),
  autoStart: z.boolean().optional(),
  pauseOnError: z.boolean().optional(),
  enableCheckpoint: z.boolean().optional(),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    priority: z.number().int().min(0).max(10).optional(),
    customData: z.record(z.unknown()).optional()
  }).optional()
}).strict()

export type UpdateChainRequest = z.infer<typeof UpdateChainRequestSchema>

// ============================================================================
// 类型守卫
// ============================================================================

export function isValidChain(value: unknown): value is Chain {
  return ChainSchema.safeParse(value).success
}

export function isValidChainNodeStatus(value: string): value is ChainNodeStatus {
  return ChainNodeStatus.safeParse(value).success
}

// ============================================================================
// 链条协议版本
// ============================================================================

export const CHAIN_PROTOCOL_VERSION = '1.0.0' as const

export const ChainContractV1 = {
  version: CHAIN_PROTOCOL_VERSION,
  schemas: {
    chain: ChainSchema,
    chainNode: ChainNodeSchema,
    checkpoint: ChainCheckpointSchema,
    create: CreateChainRequestSchema,
    update: UpdateChainRequestSchema,
    control: ChainExecutionControlSchema
  }
} as const
