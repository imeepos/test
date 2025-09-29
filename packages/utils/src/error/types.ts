/**
 * 错误严重程度
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * 错误分类
 */
export type ErrorCategory =
  | 'network'
  | 'database'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'business'
  | 'system'
  | 'resource'
  | 'external'

/**
 * 错误上下文
 */
export interface ErrorContext {
  category: ErrorCategory
  severity: ErrorSeverity
  service: string
  context: Record<string, any>
  timestamp?: Date
  retryFunction?: () => Promise<any>
  reconnectFunction?: () => Promise<void>
  cleanupFunction?: () => Promise<void>
}

/**
 * 错误处理器配置
 */
export interface ErrorHandlerConfig {
  enableRecovery: boolean
  handleUncaughtExceptions: boolean
  handleUnhandledRejections: boolean
  exitOnUncaughtException: boolean
  maxErrorHistory: number
  loggers: {
    console: boolean
    file: boolean
    external: boolean
  }
  notifications: {
    enabled: boolean
    levels: ErrorSeverity[]
    webhook: boolean
  }
}

/**
 * 错误处理结果
 */
export interface ErrorHandlingResult {
  handled: boolean
  severity: ErrorSeverity
  category: ErrorCategory
  recovered: boolean
  recoveryResult?: {
    success: boolean
    result?: any
    error?: Error
  }
  processingTime: number
  timestamp: Date
  error?: Error
}

/**
 * 错误统计指标
 */
export interface ErrorMetrics {
  totalErrors: number
  errorsByCategory: Map<ErrorCategory, number>
  errorsBySeverity: Map<ErrorSeverity, number>
  errorsByService: Map<string, number>
  recoveryAttempts: number
  successfulRecoveries: number
  lastErrorTime: Date | null
  errorRate: number
  averageRecoveryTime: number
}

/**
 * 错误恢复策略
 */
export interface ErrorRecoveryStrategy {
  name: string
  description: string
  canHandle: (error: Error, context: ErrorContext) => boolean
  recover: (error: Error, context: ErrorContext) => Promise<{
    success: boolean
    result?: any
    error?: Error
  }>
}