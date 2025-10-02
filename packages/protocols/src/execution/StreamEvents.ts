/**
 * 流式事件定义
 *
 * 用于流式执行过程中的事件通知
 */

import { z } from 'zod'

// ============================================================================
// 事件类型
// ============================================================================

export const StreamEventType = z.enum([
  'start',           // 执行开始
  'node_start',      // 节点开始
  'node_progress',   // 节点进度
  'node_output',     // 节点输出（流式）
  'node_complete',   // 节点完成
  'node_error',      // 节点错误
  'state_update',    // 状态更新
  'complete',        // 执行完成
  'error',           // 执行错误
  'metadata'         // 元数据事件
])

export type StreamEventType = z.infer<typeof StreamEventType>

// ============================================================================
// 基础事件结构
// ============================================================================

export const BaseStreamEventSchema = z.object({
  id: z.string().uuid(),
  type: StreamEventType,
  timestamp: z.date(),
  executionId: z.string().uuid(),
  metadata: z.record(z.unknown()).optional()
})

export type BaseStreamEvent = z.infer<typeof BaseStreamEventSchema>

// ============================================================================
// 执行开始事件
// ============================================================================

export const ExecutionStartEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('start'),
  data: z.object({
    graphId: z.string().uuid(),
    totalNodes: z.number(),
    initialState: z.record(z.unknown()).optional()
  })
})

export type ExecutionStartEvent = z.infer<typeof ExecutionStartEventSchema>

// ============================================================================
// 节点开始事件
// ============================================================================

export const NodeStartEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('node_start'),
  data: z.object({
    nodeId: z.string().uuid(),
    nodeName: z.string().optional(),
    inputs: z.record(z.unknown()).optional()
  })
})

export type NodeStartEvent = z.infer<typeof NodeStartEventSchema>

// ============================================================================
// 节点进度事件
// ============================================================================

export const NodeProgressEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('node_progress'),
  data: z.object({
    nodeId: z.string().uuid(),
    progress: z.number().min(0).max(1),
    message: z.string().optional()
  })
})

export type NodeProgressEvent = z.infer<typeof NodeProgressEventSchema>

// ============================================================================
// 节点输出事件（流式）
// ============================================================================

export const NodeOutputEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('node_output'),
  data: z.object({
    nodeId: z.string().uuid(),
    chunk: z.unknown(),              // 输出数据块
    isComplete: z.boolean(),          // 是否是最后一块
    chunkIndex: z.number().optional() // 块索引
  })
})

export type NodeOutputEvent = z.infer<typeof NodeOutputEventSchema>

// ============================================================================
// 节点完成事件
// ============================================================================

export const NodeCompleteEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('node_complete'),
  data: z.object({
    nodeId: z.string().uuid(),
    result: z.unknown(),
    duration: z.number(),
    retryCount: z.number().optional()
  })
})

export type NodeCompleteEvent = z.infer<typeof NodeCompleteEventSchema>

// ============================================================================
// 节点错误事件
// ============================================================================

export const NodeErrorEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('node_error'),
  data: z.object({
    nodeId: z.string().uuid(),
    error: z.object({
      message: z.string(),
      code: z.string().optional(),
      stack: z.string().optional()
    }),
    willRetry: z.boolean()
  })
})

export type NodeErrorEvent = z.infer<typeof NodeErrorEventSchema>

// ============================================================================
// 状态更新事件
// ============================================================================

export const StateUpdateEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('state_update'),
  data: z.object({
    updates: z.record(z.unknown()),
    fullState: z.record(z.unknown()).optional()
  })
})

export type StateUpdateEvent = z.infer<typeof StateUpdateEventSchema>

// ============================================================================
// 执行完成事件
// ============================================================================

export const ExecutionCompleteEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('complete'),
  data: z.object({
    success: z.boolean(),
    finalState: z.record(z.unknown()),
    duration: z.number(),
    completedNodes: z.array(z.string().uuid()),
    failedNodes: z.array(z.string().uuid()).optional()
  })
})

export type ExecutionCompleteEvent = z.infer<typeof ExecutionCompleteEventSchema>

// ============================================================================
// 执行错误事件
// ============================================================================

export const ExecutionErrorEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('error'),
  data: z.object({
    error: z.object({
      message: z.string(),
      code: z.string().optional(),
      stack: z.string().optional()
    }),
    failedNodeId: z.string().uuid().optional(),
    partialState: z.record(z.unknown()).optional()
  })
})

export type ExecutionErrorEvent = z.infer<typeof ExecutionErrorEventSchema>

// ============================================================================
// 元数据事件
// ============================================================================

export const MetadataEventSchema = BaseStreamEventSchema.extend({
  type: z.literal('metadata'),
  data: z.object({
    key: z.string(),
    value: z.unknown()
  })
})

export type MetadataEvent = z.infer<typeof MetadataEventSchema>

// ============================================================================
// 联合事件类型
// ============================================================================

export const StreamEventSchema = z.discriminatedUnion('type', [
  ExecutionStartEventSchema,
  NodeStartEventSchema,
  NodeProgressEventSchema,
  NodeOutputEventSchema,
  NodeCompleteEventSchema,
  NodeErrorEventSchema,
  StateUpdateEventSchema,
  ExecutionCompleteEventSchema,
  ExecutionErrorEventSchema,
  MetadataEventSchema
])

export type StreamEvent = z.infer<typeof StreamEventSchema>

// ============================================================================
// 事件过滤器
// ============================================================================

export interface StreamEventFilter {
  types?: StreamEventType[]
  nodeIds?: string[]
  afterTimestamp?: Date
  beforeTimestamp?: Date
}

/**
 * 检查事件是否匹配过滤器
 */
export function matchesFilter(event: StreamEvent, filter: StreamEventFilter): boolean {
  if (filter.types && !filter.types.includes(event.type)) {
    return false
  }

  if (filter.afterTimestamp && event.timestamp < filter.afterTimestamp) {
    return false
  }

  if (filter.beforeTimestamp && event.timestamp > filter.beforeTimestamp) {
    return false
  }

  if (filter.nodeIds && 'nodeId' in event.data) {
    const nodeId = (event.data as { nodeId?: string }).nodeId
    if (!nodeId || !filter.nodeIds.includes(nodeId)) {
      return false
    }
  }

  return true
}

// ============================================================================
// 事件构建器辅助函数
// ============================================================================

export function createExecutionStartEvent(
  executionId: string,
  graphId: string,
  totalNodes: number,
  initialState?: Record<string, unknown>
): ExecutionStartEvent {
  return {
    id: crypto.randomUUID(),
    type: 'start',
    timestamp: new Date(),
    executionId,
    data: {
      graphId,
      totalNodes,
      initialState
    }
  }
}

export function createNodeStartEvent(
  executionId: string,
  nodeId: string,
  nodeName?: string,
  inputs?: Record<string, unknown>
): NodeStartEvent {
  return {
    id: crypto.randomUUID(),
    type: 'node_start',
    timestamp: new Date(),
    executionId,
    data: {
      nodeId,
      nodeName,
      inputs
    }
  }
}

export function createNodeOutputEvent(
  executionId: string,
  nodeId: string,
  chunk: unknown,
  isComplete: boolean,
  chunkIndex?: number
): NodeOutputEvent {
  return {
    id: crypto.randomUUID(),
    type: 'node_output',
    timestamp: new Date(),
    executionId,
    data: {
      nodeId,
      chunk,
      isComplete,
      chunkIndex
    }
  }
}

export function createNodeCompleteEvent(
  executionId: string,
  nodeId: string,
  result: unknown,
  duration: number,
  retryCount?: number
): NodeCompleteEvent {
  return {
    id: crypto.randomUUID(),
    type: 'node_complete',
    timestamp: new Date(),
    executionId,
    data: {
      nodeId,
      result,
      duration,
      retryCount
    }
  }
}

export function createNodeErrorEvent(
  executionId: string,
  nodeId: string,
  error: Error,
  willRetry: boolean
): NodeErrorEvent {
  return {
    id: crypto.randomUUID(),
    type: 'node_error',
    timestamp: new Date(),
    executionId,
    data: {
      nodeId,
      error: {
        message: error.message,
        code: (error as any).code,
        stack: error.stack
      },
      willRetry
    }
  }
}

export function createStateUpdateEvent(
  executionId: string,
  updates: Record<string, unknown>,
  fullState?: Record<string, unknown>
): StateUpdateEvent {
  return {
    id: crypto.randomUUID(),
    type: 'state_update',
    timestamp: new Date(),
    executionId,
    data: {
      updates,
      fullState
    }
  }
}

export function createExecutionCompleteEvent(
  executionId: string,
  success: boolean,
  finalState: Record<string, unknown>,
  duration: number,
  completedNodes: string[],
  failedNodes?: string[]
): ExecutionCompleteEvent {
  return {
    id: crypto.randomUUID(),
    type: 'complete',
    timestamp: new Date(),
    executionId,
    data: {
      success,
      finalState,
      duration,
      completedNodes,
      failedNodes
    }
  }
}
