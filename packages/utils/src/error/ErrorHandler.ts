import { EventEmitter } from 'events'
import type {
  ErrorContext,
  ErrorSeverity,
  ErrorCategory,
  ErrorHandlerConfig,
  ErrorHandlingResult,
  ErrorMetrics,
  ErrorRecoveryStrategy
} from './types'

/**
 * 统一错误处理器 - 处理应用程序中的所有错误
 */
export class ErrorHandler extends EventEmitter {
  private config: ErrorHandlerConfig
  private errorMetrics: ErrorMetrics
  private recoveryStrategies: Map<string, ErrorRecoveryStrategy> = new Map()
  private errorHistory: Array<{ error: Error; context: ErrorContext; timestamp: Date }> = []

  constructor(config: ErrorHandlerConfig) {
    super()
    this.config = config
    this.errorMetrics = this.initializeMetrics()
    this.setupDefaultRecoveryStrategies()
    this.setupProcessHandlers()
  }

  /**
   * 初始化错误指标
   */
  private initializeMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      errorsByCategory: new Map(),
      errorsBySeverity: new Map(),
      errorsByService: new Map(),
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      lastErrorTime: null,
      errorRate: 0,
      averageRecoveryTime: 0
    }
  }

  /**
   * 设置默认恢复策略
   */
  private setupDefaultRecoveryStrategies(): void {
    // 网络错误恢复策略
    this.addRecoveryStrategy('network_error', {
      name: 'network_retry',
      description: '网络错误重试策略',
      canHandle: (error, context) => {
        return context.category === 'network' ||
               error.message.includes('ECONNREFUSED') ||
               error.message.includes('ETIMEDOUT')
      },
      recover: async (error, context) => {
        const maxRetries = 3
        const baseDelay = 1000

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const delay = baseDelay * Math.pow(2, attempt - 1)
            await this.delay(delay)

            if (context.retryFunction) {
              const result = await context.retryFunction()
              console.log(`网络错误恢复成功，尝试次数: ${attempt}`)
              return { success: true, result }
            }
          } catch (retryError) {
            if (attempt === maxRetries) {
              console.error(`网络错误恢复失败，已尝试 ${maxRetries} 次`)
              return { success: false, error: retryError instanceof Error ? retryError : new Error(String(retryError)) }
            }
          }
        }

        return { success: false, error }
      }
    })

    // 数据库错误恢复策略
    this.addRecoveryStrategy('database_error', {
      name: 'database_reconnect',
      description: '数据库重连策略',
      canHandle: (error, context) => {
        return context.category === 'database' ||
               error.message.includes('connection') ||
               error.message.includes('ECONNRESET')
      },
      recover: async (error, context) => {
        try {
          if (context.reconnectFunction) {
            console.log('尝试重新连接数据库...')
            await context.reconnectFunction()
            console.log('数据库重连成功')
            return { success: true }
          }
        } catch (reconnectError) {
          console.error('数据库重连失败:', reconnectError)
          return { success: false, error: reconnectError instanceof Error ? reconnectError : new Error(String(reconnectError)) }
        }

        return { success: false, error }
      }
    })

    // 资源耗尽恢复策略
    this.addRecoveryStrategy('resource_exhaustion', {
      name: 'resource_cleanup',
      description: '资源清理策略',
      canHandle: (error, context) => {
        return context.category === 'resource' ||
               error.message.includes('out of memory') ||
               error.message.includes('too many connections')
      },
      recover: async (error, context) => {
        try {
          console.log('执行资源清理...')

          if (context.cleanupFunction) {
            await context.cleanupFunction()
          }

          // 强制垃圾回收（如果可用）
          if (global.gc) {
            global.gc()
          }

          console.log('资源清理完成')
          return { success: true }
        } catch (cleanupError) {
          console.error('资源清理失败:', cleanupError)
          return { success: false, error: cleanupError instanceof Error ? cleanupError : new Error(String(cleanupError)) }
        }
      }
    })
  }

  /**
   * 设置进程级错误处理器
   */
  private setupProcessHandlers(): void {
    if (this.config.handleUncaughtExceptions) {
      process.on('uncaughtException', (error: Error) => {
        this.handleError(error, {
          category: 'system',
          severity: 'critical',
          service: 'process',
          context: { type: 'uncaughtException' }
        })

        if (this.config.exitOnUncaughtException) {
          console.error('严重错误，进程将退出')
          process.exit(1)
        }
      })
    }

    if (this.config.handleUnhandledRejections) {
      process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
        const error = reason instanceof Error ? reason : new Error(String(reason))

        this.handleError(error, {
          category: 'system',
          severity: 'high',
          service: 'process',
          context: { type: 'unhandledRejection', promise }
        })
      })
    }
  }

  /**
   * 处理错误
   */
  async handleError(error: Error, context: ErrorContext): Promise<ErrorHandlingResult> {
    const startTime = Date.now()

    try {
      // 更新错误指标
      this.updateMetrics(error, context)

      // 记录错误历史
      this.recordError(error, context)

      // 发出错误事件
      this.emit('error', error, context)

      // 记录错误日志
      await this.logError(error, context)

      // 发送错误通知
      if (this.shouldNotify(context.severity)) {
        await this.notifyError(error, context)
      }

      // 尝试错误恢复
      let recoveryResult: { success: boolean; result?: any; error?: Error } | undefined
      if (this.config.enableRecovery && context.severity !== 'critical') {
        recoveryResult = await this.attemptRecovery(error, context)
      }

      const result: ErrorHandlingResult = {
        handled: true,
        severity: context.severity,
        category: context.category,
        recovered: recoveryResult?.success || false,
        recoveryResult,
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      }

      this.emit('errorHandled', result)
      return result

    } catch (handlingError) {
      console.error('错误处理器本身出错:', handlingError)

      return {
        handled: false,
        severity: 'critical',
        category: 'system',
        recovered: false,
        error: handlingError instanceof Error ? handlingError : new Error(String(handlingError)),
        processingTime: Date.now() - startTime,
        timestamp: new Date()
      }
    }
  }

  /**
   * 尝试错误恢复
   */
  private async attemptRecovery(error: Error, context: ErrorContext): Promise<{ success: boolean; result?: any; error?: Error }> {
    this.errorMetrics.recoveryAttempts++

    for (const [strategyName, strategy] of this.recoveryStrategies) {
      if (strategy.canHandle(error, context)) {
        try {
          console.log(`尝试使用恢复策略: ${strategy.name}`)
          const result = await strategy.recover(error, context)

          if (result.success) {
            this.errorMetrics.successfulRecoveries++
            console.log(`错误恢复成功: ${strategy.name}`)
            return result
          }
        } catch (recoveryError) {
          console.error(`恢复策略失败 [${strategy.name}]:`, recoveryError)
        }
      }
    }

    return { success: false, error }
  }

  /**
   * 记录错误日志
   */
  private async logError(error: Error, context: ErrorContext): Promise<void> {
    const logLevel = this.mapSeverityToLogLevel(context.severity)
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: logLevel,
      message: error.message,
      stack: error.stack,
      context,
      service: context.service,
      category: context.category,
      severity: context.severity
    }

    // 根据配置选择日志输出方式
    if (this.config.loggers?.console) {
      console.error(`[${logLevel.toUpperCase()}] ${error.message}`, logEntry)
    }

    if (this.config.loggers?.file) {
      // 这里可以添加文件日志输出
    }

    if (this.config.loggers?.external) {
      // 这里可以添加外部日志服务输出
      this.emit('logExternal', logEntry)
    }
  }

  /**
   * 发送错误通知
   */
  private async notifyError(error: Error, context: ErrorContext): Promise<void> {
    const notification = {
      title: `${context.severity.toUpperCase()} Error in ${context.service}`,
      message: error.message,
      severity: context.severity,
      service: context.service,
      category: context.category,
      timestamp: new Date(),
      context
    }

    this.emit('errorNotification', notification)

    // 如果配置了外部通知服务，在这里调用
    if (this.config.notifications?.webhook) {
      try {
        // 发送 webhook 通知
        this.emit('webhookNotification', notification)
      } catch (webhookError) {
        console.error('发送 webhook 通知失败:', webhookError)
      }
    }
  }

  /**
   * 更新错误指标
   */
  private updateMetrics(error: Error, context: ErrorContext): void {
    this.errorMetrics.totalErrors++
    this.errorMetrics.lastErrorTime = new Date()

    // 按类别统计
    const categoryCount = this.errorMetrics.errorsByCategory.get(context.category) || 0
    this.errorMetrics.errorsByCategory.set(context.category, categoryCount + 1)

    // 按严重程度统计
    const severityCount = this.errorMetrics.errorsBySeverity.get(context.severity) || 0
    this.errorMetrics.errorsBySeverity.set(context.severity, severityCount + 1)

    // 按服务统计
    const serviceCount = this.errorMetrics.errorsByService.get(context.service) || 0
    this.errorMetrics.errorsByService.set(context.service, serviceCount + 1)

    // 计算错误率（简化计算）
    const timeWindow = 60000 // 1分钟
    const now = Date.now()
    const recentErrors = this.errorHistory.filter(
      entry => now - entry.timestamp.getTime() < timeWindow
    )
    this.errorMetrics.errorRate = recentErrors.length / (timeWindow / 1000) // 每秒错误数
  }

  /**
   * 记录错误历史
   */
  private recordError(error: Error, context: ErrorContext): void {
    this.errorHistory.push({
      error,
      context,
      timestamp: new Date()
    })

    // 限制历史记录数量
    const maxHistorySize = this.config.maxErrorHistory || 1000
    if (this.errorHistory.length > maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-maxHistorySize)
    }
  }

  /**
   * 判断是否应该发送通知
   */
  private shouldNotify(severity: ErrorSeverity): boolean {
    if (!this.config.notifications?.enabled) {
      return false
    }

    const notificationLevels = this.config.notifications.levels || ['high', 'critical']
    return notificationLevels.includes(severity)
  }

  /**
   * 映射严重程度到日志级别
   */
  private mapSeverityToLogLevel(severity: ErrorSeverity): string {
    const mapping = {
      low: 'info',
      medium: 'warn',
      high: 'error',
      critical: 'fatal'
    }
    return mapping[severity] || 'error'
  }

  /**
   * 添加恢复策略
   */
  addRecoveryStrategy(name: string, strategy: ErrorRecoveryStrategy): void {
    this.recoveryStrategies.set(name, strategy)
    console.log(`添加错误恢复策略: ${name}`)
  }

  /**
   * 移除恢复策略
   */
  removeRecoveryStrategy(name: string): void {
    this.recoveryStrategies.delete(name)
    console.log(`移除错误恢复策略: ${name}`)
  }

  /**
   * 获取错误指标
   */
  getMetrics(): ErrorMetrics {
    return {
      ...this.errorMetrics,
      errorsByCategory: new Map(this.errorMetrics.errorsByCategory),
      errorsBySeverity: new Map(this.errorMetrics.errorsBySeverity),
      errorsByService: new Map(this.errorMetrics.errorsByService)
    }
  }

  /**
   * 获取错误历史
   */
  getErrorHistory(limit?: number): Array<{ error: Error; context: ErrorContext; timestamp: Date }> {
    const history = [...this.errorHistory].reverse()
    return limit ? history.slice(0, limit) : history
  }

  /**
   * 清理错误历史
   */
  clearErrorHistory(): void {
    this.errorHistory = []
    console.log('错误历史已清理')
  }

  /**
   * 重置错误指标
   */
  resetMetrics(): void {
    this.errorMetrics = this.initializeMetrics()
    console.log('错误指标已重置')
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 创建错误上下文
   */
  static createContext(
    category: ErrorCategory,
    severity: ErrorSeverity,
    service: string,
    additionalContext?: any
  ): ErrorContext {
    return {
      category,
      severity,
      service,
      context: additionalContext || {},
      timestamp: new Date()
    }
  }

  /**
   * 包装异步函数以自动处理错误
   */
  wrapAsync<T>(
    fn: (...args: any[]) => Promise<T>,
    context: ErrorContext
  ): (...args: any[]) => Promise<T> {
    return async (...args: any[]): Promise<T> => {
      try {
        return await fn(...args)
      } catch (error) {
        await this.handleError(error as Error, context)
        throw error
      }
    }
  }

  /**
   * 包装同步函数以自动处理错误
   */
  wrapSync<T>(
    fn: (...args: any[]) => T,
    context: ErrorContext
  ): (...args: any[]) => T {
    return (...args: any[]): T => {
      try {
        return fn(...args)
      } catch (error) {
        this.handleError(error as Error, context)
        throw error
      }
    }
  }
}

/**
 * 创建全局错误处理器实例
 */
export function createErrorHandler(config?: Partial<ErrorHandlerConfig>): ErrorHandler {
  const defaultConfig: ErrorHandlerConfig = {
    enableRecovery: true,
    handleUncaughtExceptions: true,
    handleUnhandledRejections: true,
    exitOnUncaughtException: false,
    maxErrorHistory: 1000,
    loggers: {
      console: true,
      file: false,
      external: false
    },
    notifications: {
      enabled: true,
      levels: ['high', 'critical'],
      webhook: false
    }
  }

  const finalConfig = { ...defaultConfig, ...config }
  return new ErrorHandler(finalConfig)
}

// 创建全局错误处理器实例
export const globalErrorHandler = createErrorHandler()