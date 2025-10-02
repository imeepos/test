/**
 * 协议契约导出
 *
 * 提供所有协议定义的统一导出
 */

// ============================================================================
// AI 任务协议
// ============================================================================

export {
  type TaskId,
  type NodeId,
  type ProjectId,
  type UserId,
  type AITaskType,
  type TaskPriority,
  type TaskStatus,
  type TaskMetadata,
  type AITaskMessage,
  type AIProcessingMetadata,
  type AIProcessingResult,
  type AIProcessingError,
  type ResultMetadata,
  type AIResultMessage,
  type BatchTaskOptions,
  type BatchTaskMessage,
  type BatchResultSummary,
  type BatchResultMessage,
  type TaskStatusUpdateMessage,
  type TaskCancelMessage,
  AITaskType as AITaskTypeSchema,
  TaskPriority as TaskPrioritySchema,
  TaskStatus as TaskStatusSchema,
  TaskMetadataSchema,
  AITaskMessageSchemaV1,
  AIProcessingMetadataSchema,
  AIProcessingResultSchema,
  AIProcessingErrorSchema,
  ResultMetadataSchema,
  AIResultMessageSchemaV1,
  BatchTaskOptionsSchema,
  BatchTaskMessageSchemaV1,
  BatchResultSummarySchema,
  BatchResultMessageSchemaV1,
  TaskStatusUpdateMessageSchema,
  TaskCancelMessageSchema,
  PRIORITY_VALUES,
  AI_TASK_PROTOCOL_VERSION,
  AITaskContractV1,
  isValidTaskType,
  isValidPriority,
  isValidTaskStatus,
  createTaskId,
  createNodeId,
  createProjectId,
  createUserId
} from './ai-task.contract.js'

// ============================================================================
// 节点协议
// ============================================================================

export {
  type NodeStatus,
  type NodePosition,
  type NodeMetadata,
  type Node,
  type CreateNodeRequest,
  type UpdateNodeRequest,
  type DeleteNodeRequest,
  type QueryNodesRequest,
  NodeStatus as NodeStatusSchema,
  NodePositionSchema,
  NodeMetadataSchema,
  NodeSchemaV1,
  CreateNodeRequestSchema,
  UpdateNodeRequestSchema,
  DeleteNodeRequestSchema,
  QueryNodesRequestSchema,
  NODE_PROTOCOL_VERSION,
  NodeContractV1,
  isValidNodeStatus,
  isValidNode as isValidNodeContract,
  calculateNodeConfidence,
  shouldAutoSaveNode
} from './node.contract.js'

// ============================================================================
// 事件协议
// ============================================================================

export {
  type EventMetadata,
  type DomainEvent,
  type DomainEventType,
  type NodeCreatedPayload,
  type NodeUpdatedPayload,
  type AITaskQueuedPayload,
  type AITaskCompletedPayload,
  type AITaskFailedPayload,
  type SystemErrorPayload,
  type EventSubscriptionPattern,
  type EventStore,
  type EventHandler,
  type Subscription,
  type EventProjection,
  EventMetadataSchema,
  DomainEventSchemaV1,
  DomainEventTypes,
  NodeCreatedPayloadSchema,
  NodeUpdatedPayloadSchema,
  AITaskQueuedPayloadSchema,
  AITaskCompletedPayloadSchema,
  AITaskFailedPayloadSchema,
  SystemErrorPayloadSchema,
  EventSubscriptionPatternSchema,
  EVENT_PROTOCOL_VERSION,
  EventContractV1,
  createDomainEvent,
  matchesPattern,
  sortEventsByVersion,
  sortEventsByTimestamp
} from './event.contract.js'
