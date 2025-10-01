// 错误处理
export { ErrorHandler, createErrorHandler, globalErrorHandler } from './error/ErrorHandler'
export type {
  ErrorContext,
  ErrorSeverity,
  ErrorCategory,
  ErrorHandlerConfig,
  ErrorHandlingResult,
  ErrorMetrics,
  ErrorRecoveryStrategy
} from './error/types'

// 系统监控
export {
  SystemMonitor,
  createSystemMonitor,
  systemMonitor
} from './monitoring/SystemMonitor'
export type {
  SystemMetrics,
  ServiceMetrics,
  ErrorSummary,
  MonitorConfig
} from './monitoring/SystemMonitor'
