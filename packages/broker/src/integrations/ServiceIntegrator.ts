import { MessageBroker } from '../core/MessageBroker.js'
import { EventEmitter } from 'events'
import type {
  ServiceIntegratorConfig,
  ServiceRegistration,
  MessageRouteDefinition,
  IntegrationStats,
  ServiceHealthStatus
} from '../types/integration'

/**
 * 服务集成器 - 协调多个服务之间的消息队列通信
 */
export class ServiceIntegrator extends EventEmitter {
  private broker: MessageBroker
  private config: ServiceIntegratorConfig
  private services: Map<string, ServiceRegistration> = new Map()
  private routes: Map<string, MessageRouteDefinition> = new Map()
  private isStarted: boolean = false
  private healthCheckTimer: NodeJS.Timeout | null = null
  private stats: IntegrationStats

  constructor(broker: MessageBroker, config: ServiceIntegratorConfig) {
    super()
    this.broker = broker
    this.config = config
    this.stats = this.initializeStats()
    this.setupBrokerEventHandlers()
  }

  /**
   * 初始化统计信息
   */
  private initializeStats(): IntegrationStats {
    return {
      totalMessages: 0,
      successfulRoutes: 0,
      failedRoutes: 0,
      servicesRegistered: 0,
      routesConfigured: 0,
      uptime: 0,
      startTime: new Date(),
      lastActivity: new Date()
    }
  }

  /**
   * 设置消息代理事件处理器
   */
  private setupBrokerEventHandlers(): void {
    this.broker.on('connected', () => {
      console.log('服务集成器: 消息代理已连接')
      this.emit('brokerConnected')
    })

    this.broker.on('disconnected', () => {
      console.log('服务集成器: 消息代理已断开')
      this.emit('brokerDisconnected')
    })

    this.broker.on('error', (error) => {
      console.error('服务集成器: 消息代理错误:', error)
      this.emit('brokerError', error)
    })
  }

  /**
   * 启动服务集成器
   */
  async start(): Promise<void> {
    try {
      if (this.isStarted) {
        console.log('服务集成器已经在运行')
        return
      }

      // 确保消息代理已连接
      if (!this.broker.isConnected()) {
        await this.broker.start()
      }

      // 初始化服务和路由
      await this.initializeServices()
      await this.setupMessageRoutes()

      // 启动健康检查
      if (this.config.healthCheck.enabled) {
        this.startHealthCheck()
      }

      this.isStarted = true
      this.stats.startTime = new Date()

      console.log('服务集成器启动成功')
      this.emit('started')

    } catch (error) {
      console.error('启动服务集成器失败:', error)
      throw error
    }
  }

  /**
   * 停止服务集成器
   */
  async stop(): Promise<void> {
    try {
      if (!this.isStarted) {
        console.log('服务集成器未运行')
        return
      }

      this.isStarted = false

      // 停止健康检查
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer)
        this.healthCheckTimer = null
      }

      // 注销所有服务
      await this.unregisterAllServices()

      console.log('服务集成器已停止')
      this.emit('stopped')

    } catch (error) {
      console.error('停止服务集成器失败:', error)
      throw error
    }
  }

  /**
   * 注册服务
   */
  async registerService(registration: ServiceRegistration): Promise<void> {
    try {
      console.log(`注册服务: ${registration.serviceName}`)

      // 验证服务配置
      await this.validateServiceRegistration(registration)

      // 为服务创建专用队列和交换机
      await this.setupServiceInfrastructure(registration)

      // 注册服务消费者
      await this.setupServiceConsumers(registration)

      // 保存服务注册信息
      this.services.set(registration.serviceName, {
        ...registration,
        status: 'active',
        registeredAt: new Date(),
        lastSeen: new Date()
      })

      this.stats.servicesRegistered = this.services.size

      console.log(`服务注册成功: ${registration.serviceName}`)
      this.emit('serviceRegistered', registration)

    } catch (error) {
      console.error(`注册服务失败 [${registration.serviceName}]:`, error)
      throw error
    }
  }

  /**
   * 注销服务
   */
  async unregisterService(serviceName: string): Promise<void> {
    try {
      const service = this.services.get(serviceName)
      if (!service) {
        console.warn(`服务不存在: ${serviceName}`)
        return
      }

      console.log(`注销服务: ${serviceName}`)

      // 清理服务相关的消费者和队列
      await this.cleanupServiceInfrastructure(service)

      // 从注册表中移除
      this.services.delete(serviceName)
      this.stats.servicesRegistered = this.services.size

      console.log(`服务注销成功: ${serviceName}`)
      this.emit('serviceUnregistered', serviceName)

    } catch (error) {
      console.error(`注销服务失败 [${serviceName}]:`, error)
      throw error
    }
  }

  /**
   * 配置消息路由
   */
  configureRoute(route: MessageRouteDefinition): void {
    console.log(`配置消息路由: ${route.name}`)

    // 验证路由配置
    this.validateRoute(route)

    // 保存路由配置
    this.routes.set(route.name, route)
    this.stats.routesConfigured = this.routes.size

    console.log(`路由配置成功: ${route.name}`)
    this.emit('routeConfigured', route)
  }

  /**
   * 移除消息路由
   */
  removeRoute(routeName: string): void {
    if (this.routes.has(routeName)) {
      this.routes.delete(routeName)
      this.stats.routesConfigured = this.routes.size
      console.log(`移除路由: ${routeName}`)
      this.emit('routeRemoved', routeName)
    }
  }

  /**
   * 发送服务间消息
   */
  async sendMessage(
    fromService: string,
    toService: string,
    messageType: string,
    data: any,
    options: {
      priority?: number
      timeout?: number
      waitForReply?: boolean
      correlationId?: string
    } = {}
  ): Promise<any> {
    try {
      const message = {
        id: this.generateMessageId(),
        type: messageType,
        fromService,
        toService,
        data,
        timestamp: new Date(),
        correlationId: options.correlationId || this.generateMessageId()
      }

      const routingKey = `service.${toService}.${messageType}`

      // 根据是否需要回复选择发送方式
      if (options.waitForReply) {
        const result = await this.broker.sendRPC(
          this.config.serviceExchange,
          routingKey,
          message,
          options.timeout || 30000
        )

        this.updateStats('success')
        return result
      } else {
        await this.broker.publishWithConfirm(
          this.config.serviceExchange,
          routingKey,
          message,
          {
            persistent: true,
            priority: options.priority || 5,
            correlationId: message.correlationId,
            headers: {
              fromService,
              toService,
              messageType
            }
          }
        )

        this.updateStats('success')
        return message.correlationId
      }

    } catch (error) {
      this.updateStats('failed')
      console.error(`发送服务间消息失败 [${fromService} -> ${toService}]:`, error)
      throw error
    }
  }

  /**
   * 广播消息给所有服务
   */
  async broadcastMessage(
    fromService: string,
    messageType: string,
    data: any,
    options: {
      excludeServices?: string[]
      priority?: number
    } = {}
  ): Promise<void> {
    try {
      const message = {
        id: this.generateMessageId(),
        type: messageType,
        fromService,
        toService: 'all',
        data,
        timestamp: new Date()
      }

      await this.broker.publishWithConfirm(
        this.config.broadcastExchange,
        'broadcast.all',
        message,
        {
          persistent: false,
          priority: options.priority || 3,
          headers: {
            fromService,
            messageType,
            excludeServices: options.excludeServices?.join(',') || ''
          }
        }
      )

      this.updateStats('success')
      console.log(`广播消息: ${messageType} from ${fromService}`)

    } catch (error) {
      this.updateStats('failed')
      console.error(`广播消息失败 [${fromService}]:`, error)
      throw error
    }
  }

  /**
   * 初始化预配置的服务
   */
  private async initializeServices(): Promise<void> {
    for (const serviceConfig of this.config.services) {
      try {
        await this.registerService(serviceConfig)
      } catch (error) {
        console.error(`初始化服务失败 [${serviceConfig.serviceName}]:`, error)
        // 继续初始化其他服务
      }
    }
  }

  /**
   * 设置消息路由
   */
  private async setupMessageRoutes(): Promise<void> {
    // 设置服务发现路由
    this.configureRoute({
      name: 'service_discovery',
      description: '服务发现路由',
      sourcePattern: 'service.discovery.*',
      targetPattern: 'discovery.response',
      transformation: (message) => ({
        ...message,
        services: Array.from(this.services.keys())
      }),
      enabled: true
    })

    // 设置健康检查路由
    this.configureRoute({
      name: 'health_check',
      description: '健康检查路由',
      sourcePattern: 'service.*.health',
      targetPattern: 'health.response',
      transformation: (message) => ({
        ...message,
        status: this.getServiceHealth(message.fromService)
      }),
      enabled: true
    })

    // 设置错误处理路由
    this.configureRoute({
      name: 'error_handling',
      description: '错误处理路由',
      sourcePattern: 'service.*.error',
      targetPattern: 'error.log',
      transformation: (message) => ({
        ...message,
        severity: this.calculateErrorSeverity(message.data)
      }),
      enabled: true
    })
  }

  /**
   * 验证服务注册
   */
  private async validateServiceRegistration(registration: ServiceRegistration): Promise<void> {
    if (!registration.serviceName || !registration.version) {
      throw new Error('服务名称和版本是必需的')
    }

    if (this.services.has(registration.serviceName)) {
      throw new Error(`服务已存在: ${registration.serviceName}`)
    }

    // 验证服务健康检查端点
    if (registration.healthCheck?.enabled && registration.healthCheck.endpoint) {
      // 这里可以添加健康检查端点验证逻辑
    }
  }

  /**
   * 为服务设置基础设施
   */
  private async setupServiceInfrastructure(registration: ServiceRegistration): Promise<void> {
    const serviceName = registration.serviceName

    // 为服务创建专用队列
    const serviceQueue = `service.${serviceName}.messages`
    const serviceRpcQueue = `service.${serviceName}.rpc`

    // 这里需要根据实际的 MessageBroker API 来创建队列
    // 由于 MessageBroker 没有直接的队列创建方法，我们假设它会自动创建

    console.log(`为服务 ${serviceName} 设置基础设施`)
  }

  /**
   * 为服务设置消费者
   */
  private async setupServiceConsumers(registration: ServiceRegistration): Promise<void> {
    const serviceName = registration.serviceName

    // 设置普通消息消费者
    if (registration.messageHandlers) {
      for (const [messageType, handler] of Object.entries(registration.messageHandlers)) {
        const routingKey = `service.${serviceName}.${messageType}`

        await this.broker.consume(
          `service.${serviceName}.messages`,
          async (message) => {
            if (!message) return

            try {
              const messageData = JSON.parse(message.content.toString())
              await handler(messageData)
              this.broker.ack(message)
              this.updateServiceActivity(serviceName)
            } catch (error) {
              console.error(`处理消息失败 [${serviceName}.${messageType}]:`, error)
              this.broker.nack(message, false)
            }
          },
          { noAck: false }
        )
      }
    }

    // 设置广播消息消费者
    if (registration.broadcastHandlers) {
      for (const [messageType, handler] of Object.entries(registration.broadcastHandlers)) {
        await this.broker.consume(
          `broadcast.${serviceName}`,
          async (message) => {
            if (!message) return

            try {
              const messageData = JSON.parse(message.content.toString())

              // 检查是否应该排除此服务
              const excludeServices = message.properties.headers?.excludeServices?.split(',') || []
              if (excludeServices.includes(serviceName)) {
                this.broker.ack(message)
                return
              }

              await handler(messageData)
              this.broker.ack(message)
              this.updateServiceActivity(serviceName)
            } catch (error) {
              console.error(`处理广播消息失败 [${serviceName}.${messageType}]:`, error)
              this.broker.nack(message, false)
            }
          },
          { noAck: false }
        )
      }
    }
  }

  /**
   * 清理服务基础设施
   */
  private async cleanupServiceInfrastructure(service: ServiceRegistration): Promise<void> {
    // 这里应该清理服务相关的队列和消费者
    // 具体实现取决于 MessageBroker 的 API
    console.log(`清理服务基础设施: ${service.serviceName}`)
  }

  /**
   * 注销所有服务
   */
  private async unregisterAllServices(): Promise<void> {
    const serviceNames = Array.from(this.services.keys())
    for (const serviceName of serviceNames) {
      await this.unregisterService(serviceName)
    }
  }

  /**
   * 验证路由配置
   */
  private validateRoute(route: MessageRouteDefinition): void {
    if (!route.name || !route.sourcePattern || !route.targetPattern) {
      throw new Error('路由名称、源模式和目标模式是必需的')
    }

    if (this.routes.has(route.name)) {
      throw new Error(`路由已存在: ${route.name}`)
    }
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    this.healthCheckTimer = setInterval(
      () => this.performHealthCheck(),
      this.config.healthCheck.interval
    )
    console.log('健康检查已启动')
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    for (const [serviceName, service] of this.services) {
      try {
        const health = await this.checkServiceHealth(service)
        const currentStatus = service.status

        if (health.status !== currentStatus) {
          service.status = health.status
          console.log(`服务状态变更 [${serviceName}]: ${currentStatus} -> ${health.status}`)
          this.emit('serviceStatusChanged', serviceName, health.status, currentStatus)
        }

        service.lastSeen = new Date()
        service.health = health

      } catch (error) {
        console.error(`健康检查失败 [${serviceName}]:`, error)
        service.status = 'unhealthy'
        service.health = {
          status: 'unhealthy',
          timestamp: new Date(),
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }
  }

  /**
   * 检查单个服务健康状态
   */
  private async checkServiceHealth(service: ServiceRegistration): Promise<ServiceHealthStatus> {
    // 这里可以实现具体的健康检查逻辑
    // 例如调用服务的健康检查端点、检查消息队列状态等

    return {
      status: 'healthy',
      timestamp: new Date(),
      details: {
        uptime: Date.now() - (service.registeredAt?.getTime() || 0),
        messageCount: 0 // 可以从统计信息中获取
      }
    }
  }

  /**
   * 获取服务健康状态
   */
  private getServiceHealth(serviceName: string): ServiceHealthStatus {
    const service = this.services.get(serviceName)
    return service?.health || {
      status: 'unknown',
      timestamp: new Date()
    }
  }

  /**
   * 计算错误严重程度
   */
  private calculateErrorSeverity(errorData: any): 'low' | 'medium' | 'high' | 'critical' {
    // 这里可以实现错误严重程度的计算逻辑
    return 'medium'
  }

  /**
   * 更新服务活动时间
   */
  private updateServiceActivity(serviceName: string): void {
    const service = this.services.get(serviceName)
    if (service) {
      service.lastSeen = new Date()
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(result: 'success' | 'failed'): void {
    this.stats.totalMessages++
    this.stats.lastActivity = new Date()
    this.stats.uptime = Date.now() - this.stats.startTime.getTime()

    if (result === 'success') {
      this.stats.successfulRoutes++
    } else {
      this.stats.failedRoutes++
    }
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取集成器状态
   */
  getStatus(): {
    isStarted: boolean
    brokerConnected: boolean
    stats: IntegrationStats
    services: Array<{
      name: string
      status: string
      lastSeen: Date
    }>
    routes: string[]
  } {
    return {
      isStarted: this.isStarted,
      brokerConnected: this.broker.isConnected(),
      stats: { ...this.stats },
      services: Array.from(this.services.entries()).map(([name, service]) => ({
        name,
        status: service.status || 'unknown',
        lastSeen: service.lastSeen || new Date()
      })),
      routes: Array.from(this.routes.keys())
    }
  }

  /**
   * 获取服务列表
   */
  getServices(): ServiceRegistration[] {
    return Array.from(this.services.values())
  }

  /**
   * 获取路由列表
   */
  getRoutes(): MessageRouteDefinition[] {
    return Array.from(this.routes.values())
  }
}

/**
 * 创建服务集成器的工厂函数
 */
export function createServiceIntegrator(
  broker: MessageBroker,
  config?: Partial<ServiceIntegratorConfig>
): ServiceIntegrator {
  const defaultConfig: ServiceIntegratorConfig = {
    serviceExchange: 'sker.services',
    broadcastExchange: 'sker.broadcast',
    services: [],
    healthCheck: {
      enabled: true,
      interval: 30000 // 30秒
    }
  }

  const finalConfig = { ...defaultConfig, ...config }
  return new ServiceIntegrator(broker, finalConfig)
}