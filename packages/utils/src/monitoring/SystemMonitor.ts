import { EventEmitter } from 'events'

/**
 * 系统监控指标
 */
export interface SystemMetrics {
  timestamp: Date
  system: {
    uptime: number
    memory: {
      used: number
      total: number
      percentage: number
    }
    cpu: {
      percentage: number
    }
    load: number[]
  }
  services: Record<string, ServiceMetrics>
  errors: {
    total: number
    rate: number
    recent: ErrorSummary[]
  }
}

/**
 * 服务指标
 */
export interface ServiceMetrics {
  name: string
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown'
  uptime: number
  requests: {
    total: number
    success: number
    failed: number
    rate: number
  }
  response: {
    averageTime: number
    p95: number
    p99: number
  }
  errors: {
    total: number
    rate: number
  }
  resources: {
    memory: number
    cpu: number
  }
}

/**
 * 错误摘要
 */
export interface ErrorSummary {
  type: string
  count: number
  lastOccurred: Date
  message: string
  service: string
}

/**
 * 监控配置
 */
export interface MonitorConfig {
  collectInterval: number // 收集间隔（毫秒）
  retentionDays: number // 数据保留天数
  alertThresholds: {
    errorRate: number // 错误率阈值
    responseTime: number // 响应时间阈值
    memoryUsage: number // 内存使用率阈值
    cpuUsage: number // CPU使用率阈值
  }
  services: string[] // 监控的服务列表
}

/**
 * 系统监控器 - 收集和分析系统指标
 */
export class SystemMonitor extends EventEmitter {
  private config: MonitorConfig
  private metrics: SystemMetrics[] = []
  private collectTimer: NodeJS.Timeout | null = null
  private serviceHealthCheckers: Map<string, () => Promise<ServiceMetrics>> = new Map()
  private isRunning = false

  constructor(config: MonitorConfig) {
    super()
    this.config = config
  }

  /**
   * 启动监控
   */
  start(): void {
    if (this.isRunning) return

    console.log('🔍 启动系统监控...')

    this.collectTimer = setInterval(
      () => this.collectMetrics(),
      this.config.collectInterval
    )

    this.isRunning = true
    console.log('✅ 系统监控已启动')
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (!this.isRunning) return

    if (this.collectTimer) {
      clearInterval(this.collectTimer)
      this.collectTimer = null
    }

    this.isRunning = false
    console.log('🛑 系统监控已停止')
  }

  /**
   * 注册服务健康检查器
   */
  registerService(name: string, healthChecker: () => Promise<ServiceMetrics>): void {
    this.serviceHealthCheckers.set(name, healthChecker)
    console.log(`📊 注册服务监控: ${name}`)
  }

  /**
   * 取消注册服务
   */
  unregisterService(name: string): void {
    this.serviceHealthCheckers.delete(name)
    console.log(`❌ 取消注册服务监控: ${name}`)
  }

  /**
   * 收集系统指标
   */
  private async collectMetrics(): Promise<void> {
    try {
      const systemMetrics: SystemMetrics = {
        timestamp: new Date(),
        system: await this.collectSystemMetrics(),
        services: {},
        errors: await this.collectErrorMetrics()
      }

      // 收集各服务指标
      for (const [serviceName, healthChecker] of this.serviceHealthCheckers) {
        try {
          systemMetrics.services[serviceName] = await healthChecker()
        } catch (error) {
          console.error(`收集服务指标失败 [${serviceName}]:`, error)
          systemMetrics.services[serviceName] = {
            name: serviceName,
            status: 'unknown',
            uptime: 0,
            requests: { total: 0, success: 0, failed: 0, rate: 0 },
            response: { averageTime: 0, p95: 0, p99: 0 },
            errors: { total: 0, rate: 0 },
            resources: { memory: 0, cpu: 0 }
          }
        }
      }

      // 存储指标
      this.metrics.push(systemMetrics)

      // 清理旧指标
      this.cleanupOldMetrics()

      // 检查告警
      this.checkAlerts(systemMetrics)

      // 发出事件
      this.emit('metricsCollected', systemMetrics)

    } catch (error) {
      console.error('收集系统指标失败:', error)
      this.emit('error', error)
    }
  }

  /**
   * 收集系统资源指标
   */
  private async collectSystemMetrics(): Promise<SystemMetrics['system']> {
    const memUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    return {
      uptime: process.uptime(),
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      cpu: {
        percentage: this.calculateCpuPercentage(cpuUsage)
      },
      load: [] // Node.js 没有内置的负载平均值
    }
  }

  /**
   * 收集错误指标
   */
  private async collectErrorMetrics(): Promise<SystemMetrics['errors']> {
    // 这里可以集成 ErrorHandler 的指标
    const recentWindow = 5 * 60 * 1000 // 5分钟
    const now = Date.now()

    // 从最近的指标中计算错误率
    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp.getTime() < recentWindow
    )

    const totalErrors = recentMetrics.reduce((sum, m) => sum + m.errors.total, 0)
    const errorRate = recentMetrics.length > 0 ? totalErrors / recentMetrics.length : 0

    return {
      total: totalErrors,
      rate: errorRate,
      recent: [] // 这里可以填充最近的错误摘要
    }
  }

  /**
   * 计算CPU使用率
   */
  private calculateCpuPercentage(cpuUsage: NodeJS.CpuUsage): number {
    // 简化的CPU使用率计算
    const totalCpuTime = cpuUsage.user + cpuUsage.system
    return Math.min(100, (totalCpuTime / 1000000) * 100) // 转换为百分比
  }

  /**
   * 清理旧指标
   */
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000)

    this.metrics = this.metrics.filter(
      metric => metric.timestamp.getTime() > cutoffTime
    )
  }

  /**
   * 检查告警条件
   */
  private checkAlerts(metrics: SystemMetrics): void {
    const alerts: Array<{ type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical' }> = []

    // 检查系统资源告警
    if (metrics.system.memory.percentage > this.config.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'high_memory_usage',
        message: `内存使用率过高: ${metrics.system.memory.percentage.toFixed(2)}%`,
        severity: 'high'
      })
    }

    if (metrics.system.cpu.percentage > this.config.alertThresholds.cpuUsage) {
      alerts.push({
        type: 'high_cpu_usage',
        message: `CPU使用率过高: ${metrics.system.cpu.percentage.toFixed(2)}%`,
        severity: 'high'
      })
    }

    // 检查错误率告警
    if (metrics.errors.rate > this.config.alertThresholds.errorRate) {
      alerts.push({
        type: 'high_error_rate',
        message: `错误率过高: ${metrics.errors.rate.toFixed(2)}`,
        severity: 'critical'
      })
    }

    // 检查服务健康状态
    Object.values(metrics.services).forEach(service => {
      if (service.status === 'unhealthy') {
        alerts.push({
          type: 'service_unhealthy',
          message: `服务不健康: ${service.name}`,
          severity: 'critical'
        })
      }

      if (service.response.averageTime > this.config.alertThresholds.responseTime) {
        alerts.push({
          type: 'slow_response',
          message: `服务响应时间过慢: ${service.name} - ${service.response.averageTime}ms`,
          severity: 'medium'
        })
      }
    })

    // 发出告警事件
    if (alerts.length > 0) {
      this.emit('alerts', alerts)
    }
  }

  /**
   * 获取当前指标
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metrics[this.metrics.length - 1] || null
  }

  /**
   * 获取历史指标
   */
  getHistoryMetrics(hours: number = 24): SystemMetrics[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000)
    return this.metrics.filter(
      metric => metric.timestamp.getTime() > cutoffTime
    )
  }

  /**
   * 获取服务统计
   */
  getServiceStats(serviceName: string): ServiceMetrics | null {
    const current = this.getCurrentMetrics()
    return current?.services[serviceName] || null
  }

  /**
   * 获取监控摘要
   */
  getSummary(): {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
    totalServices: number
    healthyServices: number
    alerts: number
    uptime: number
  } {
    const current = this.getCurrentMetrics()

    if (!current) {
      return {
        status: 'unknown',
        totalServices: 0,
        healthyServices: 0,
        alerts: 0,
        uptime: process.uptime()
      }
    }

    const services = Object.values(current.services)
    const totalServices = services.length
    const healthyServices = services.filter(s => s.status === 'healthy').length
    const unhealthyServices = services.filter(s => s.status === 'unhealthy').length

    let status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
    if (unhealthyServices > 0) {
      status = 'unhealthy'
    } else if (healthyServices < totalServices) {
      status = 'degraded'
    } else if (totalServices > 0) {
      status = 'healthy'
    } else {
      status = 'unknown'
    }

    return {
      status,
      totalServices,
      healthyServices,
      alerts: 0, // 这里可以计算当前活跃告警数
      uptime: current.system.uptime
    }
  }
}

/**
 * 创建系统监控器
 */
export function createSystemMonitor(config?: Partial<MonitorConfig>): SystemMonitor {
  const defaultConfig: MonitorConfig = {
    collectInterval: 30000, // 30秒
    retentionDays: 7, // 7天
    alertThresholds: {
      errorRate: 0.05, // 5% 错误率
      responseTime: 2000, // 2秒响应时间
      memoryUsage: 80, // 80% 内存使用率
      cpuUsage: 80 // 80% CPU使用率
    },
    services: []
  }

  const finalConfig = { ...defaultConfig, ...config }
  return new SystemMonitor(finalConfig)
}

/**
 * 默认监控器实例
 */
export const systemMonitor = createSystemMonitor()