/**
 * 日志工具函数
 * 统一的日志输出接口
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  data?: any
}

class Logger {
  private isDev: boolean
  private logs: LogEntry[] = []
  private maxLogs = 1000

  constructor() {
    this.isDev = import.meta.env.DEV
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      data,
    }

    // 保存到内存
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // 控制台输出
    if (this.isDev || level === 'error') {
      const timestamp = entry.timestamp.toLocaleTimeString()
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`

      switch (level) {
        case 'debug':
          console.debug(prefix, message, data || '')
          break
        case 'info':
          console.info(prefix, message, data || '')
          break
        case 'warn':
          console.warn(prefix, message, data || '')
          break
        case 'error':
          console.error(prefix, message, data || '')
          break
      }
    }
  }

  /**
   * Debug 日志
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data)
  }

  /**
   * Info 日志
   */
  info(message: string, data?: any): void {
    this.log('info', message, data)
  }

  /**
   * Warning 日志
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data)
  }

  /**
   * Error 日志
   */
  error(message: string, error?: any): void {
    this.log('error', message, error)

    // 生产环境可以在这里添加错误上报
    if (!this.isDev) {
      // TODO: 上报错误到服务器
      // reportError(message, error)
    }
  }

  /**
   * 获取所有日志
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level)
    }
    return this.logs
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * 导出日志
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// 导出单例
export const logger = new Logger()

export default logger
