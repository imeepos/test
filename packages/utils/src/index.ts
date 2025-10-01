// 错误处理
export { ErrorHandler, createErrorHandler, globalErrorHandler } from './error/ErrorHandler.js'
export type {
  ErrorContext,
  ErrorSeverity,
  ErrorCategory,
  ErrorHandlerConfig,
  ErrorHandlingResult,
  ErrorMetrics,
  ErrorRecoveryStrategy
} from './error/types.js'

// 系统监控
export {
  SystemMonitor,
  createSystemMonitor,
  systemMonitor
} from './monitoring/SystemMonitor.js'
export type {
  SystemMetrics,
  ServiceMetrics,
  ErrorSummary,
  MonitorConfig
} from './monitoring/SystemMonitor.js'
