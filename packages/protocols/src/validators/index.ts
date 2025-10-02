/**
 * 验证器模块导出
 *
 * 提供所有验证器和相关工具的统一导出
 */

// ============================================================================
// Result 类型和工具
// ============================================================================

export {
  type Result,
  type Ok,
  type Err,
  type ExtractOk,
  type ExtractErr,
  ok,
  err,
  isOk,
  isErr,
  map,
  mapErr,
  flatMap,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  combine,
  tryCatch,
  tryCatchAsync,
  fromPromise,
  toPromise
} from './result.js'

// ============================================================================
// 错误类型
// ============================================================================

export {
  ValidationError,
  SchemaValidationError,
  ProtocolVersionError,
  TypeMismatchError,
  RequiredFieldError,
  InvalidFieldError,
  type ValidationIssue,
  formatZodIssues,
  formatZodIssue,
  fromZodError,
  createValidationError,
  createVersionError,
  createTypeMismatchError,
  createRequiredFieldError,
  createInvalidFieldError,
  isValidationError,
  isSchemaValidationError,
  isProtocolVersionError
} from './errors.js'

// ============================================================================
// 核心验证器
// ============================================================================

export {
  type ValidatorConfig,
  ProtocolValidator,
  defaultValidator,
  devValidator,
  validate,
  validateAsync,
  validateBatch,
  validateOrThrow,
  type InferSchema
} from './message.validator.js'

// ============================================================================
// AI 任务验证器
// ============================================================================

export {
  validateAITask,
  validateAIResult,
  validateBatchTask,
  validateBatchResult,
  validateTaskStatusUpdate,
  validateTaskCancel,
  validateAITaskBatch,
  validateAIResultBatch,
  validateTaskType,
  validateTaskPriority,
  validateTaskStatus,
  validateAITaskFromJSON,
  validateAIResultFromJSON,
  validateAITaskFromBuffer,
  validateAIResultFromBuffer,
  isValidAITask,
  isValidAIResult,
  isValidBatchTask
} from './ai-task.validator.js'

// ============================================================================
// 节点验证器
// ============================================================================

export {
  validateNode,
  validateCreateNode,
  validateUpdateNode,
  validateDeleteNode,
  validateQueryNodes,
  validateNodeBatch,
  validateCreateNodeBatch,
  validateNodeStatus,
  validateNodeFromJSON,
  validateCreateNodeFromJSON,
  validateUpdateNodeFromJSON,
  isValidNode,
  isValidCreateNodeRequest,
  isValidUpdateNodeRequest
} from './node.validator.js'

// ============================================================================
// 事件验证器
// ============================================================================

export {
  validateDomainEvent,
  validateEventMetadata,
  validateNodeCreatedPayload,
  validateNodeUpdatedPayload,
  validateAITaskQueuedPayload,
  validateAITaskCompletedPayload,
  validateAITaskFailedPayload,
  validateSystemErrorPayload,
  validateEventPayloadByType,
  validateDomainEventWithPayload,
  validateDomainEventBatch,
  validateDomainEventFromJSON,
  validateDomainEventWithPayloadFromJSON,
  validateDomainEventFromBuffer,
  validateDomainEventWithPayloadFromBuffer,
  isValidDomainEvent,
  isValidEventMetadata,
  isEventOfType,
  isNodeEvent,
  isAITaskEvent,
  isSystemEvent
} from './event.validator.js'
