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

// 默认导出
import { ErrorHandler, createErrorHandler, globalErrorHandler } from './error/ErrorHandler'
import { SystemMonitor, createSystemMonitor, systemMonitor } from './monitoring/SystemMonitor'

const utils = {
  ErrorHandler,
  createErrorHandler,
  globalErrorHandler,
  SystemMonitor,
  createSystemMonitor,
  systemMonitor
}

export default utils