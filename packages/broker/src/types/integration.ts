/**
 * 服务集成相关类型定义
 */

/**
 * 服务集成器配置
 */
export interface ServiceIntegratorConfig {
  serviceExchange: string
  broadcastExchange: string
  services: ServiceRegistration[]
  healthCheck: {
    enabled: boolean
    interval: number
  }
}

/**
 * 服务注册信息
 */
export interface ServiceRegistration {
  serviceName: string
  version: string
  description?: string
  endpoints?: ServiceEndpoint[]
  capabilities?: string[]
  dependencies?: string[]
  messageHandlers?: Record<string, MessageHandler>
  broadcastHandlers?: Record<string, MessageHandler>
  healthCheck?: ServiceHealthCheck
  configuration?: Record<string, any>
  metadata?: Record<string, any>
  status?: ServiceStatus
  registeredAt?: Date
  lastSeen?: Date
  health?: ServiceHealthStatus
}

/**
 * 服务端点
 */
export interface ServiceEndpoint {
  name: string
  type: 'http' | 'websocket' | 'grpc' | 'queue'
  url: string
  methods?: string[]
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'api_key'
    config?: Record<string, any>
  }
}

/**
 * 服务状态
 */
export type ServiceStatus = 'active' | 'inactive' | 'healthy' | 'unhealthy' | 'unknown' | 'degraded'

/**
 * 消息处理器
 */
export type MessageHandler = (message: any, metadata?: MessageMetadata) => Promise<void>

/**
 * 消息元数据
 */
export interface MessageMetadata {
  messageId: string
  correlationId: string
  timestamp: Date
  fromService: string
  toService?: string
  messageType: string
  headers?: Record<string, any>
}

/**
 * 服务健康检查配置
 */
export interface ServiceHealthCheck {
  enabled: boolean
  endpoint?: string
  interval?: number
  timeout?: number
  retries?: number
  expectedStatus?: number
  customCheck?: () => Promise<ServiceHealthStatus>
}

/**
 * 服务健康状态
 */
export interface ServiceHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown'
  timestamp: Date
  details?: {
    uptime?: number
    memory?: number
    cpu?: number
    connections?: number
    messageCount?: number
    errorRate?: number
    [key: string]: any
  }
  error?: string
}

/**
 * 消息路由定义
 */
export interface MessageRouteDefinition {
  name: string
  description?: string
  sourcePattern: string
  targetPattern: string
  transformation?: (message: any) => any
  condition?: (message: any) => boolean
  priority?: number
  enabled: boolean
  retryPolicy?: RouteRetryPolicy
  metadata?: Record<string, any>
}

/**
 * 路由重试策略
 */
export interface RouteRetryPolicy {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: string[]
}

/**
 * 集成统计信息
 */
export interface IntegrationStats {
  totalMessages: number
  successfulRoutes: number
  failedRoutes: number
  servicesRegistered: number
  routesConfigured: number
  uptime: number
  startTime: Date
  lastActivity: Date
}

/**
 * 服务发现信息
 */
export interface ServiceDiscoveryInfo {
  serviceName: string
  version: string
  status: ServiceStatus
  endpoints: ServiceEndpoint[]
  capabilities: string[]
  lastSeen: Date
  health: ServiceHealthStatus
}

/**
 * 服务间通信消息
 */
export interface InterServiceMessage {
  id: string
  type: string
  fromService: string
  toService: string
  data: any
  timestamp: Date
  correlationId?: string
  replyTo?: string
  ttl?: number
  priority?: number
}

/**
 * 广播消息
 */
export interface BroadcastMessage {
  id: string
  type: string
  fromService: string
  data: any
  timestamp: Date
  excludeServices?: string[]
  priority?: number
  ttl?: number
}

/**
 * 服务事件
 */
export interface ServiceEvent {
  id: string
  type: ServiceEventType
  serviceName: string
  timestamp: Date
  data?: any
  metadata?: Record<string, any>
}

/**
 * 服务事件类型
 */
export type ServiceEventType =
  | 'service_registered'
  | 'service_unregistered'
  | 'service_started'
  | 'service_stopped'
  | 'service_health_changed'
  | 'service_error'
  | 'service_overloaded'
  | 'service_recovered'

/**
 * 负载均衡策略
 */
export interface LoadBalancingStrategy {
  type: 'round_robin' | 'least_connections' | 'weighted' | 'random' | 'hash'
  config?: {
    weights?: Record<string, number>
    hashKey?: string
    algorithm?: string
  }
}

/**
 * 服务网格配置
 */
export interface ServiceMeshConfig {
  enabled: boolean
  discovery: {
    enabled: boolean
    interval: number
    timeout: number
  }
  loadBalancing: LoadBalancingStrategy
  circuitBreaker: {
    enabled: boolean
    threshold: number
    timeout: number
    resetTimeout: number
  }
  rateLimit: {
    enabled: boolean
    requestsPerSecond: number
    burstSize: number
  }
  security: {
    authentication: boolean
    encryption: boolean
    authorization: boolean
  }
}

/**
 * 服务监控指标
 */
export interface ServiceMetrics {
  serviceName: string
  timestamp: Date
  performance: {
    responseTime: number
    throughput: number
    errorRate: number
    successRate: number
  }
  resources: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    networkIO: number
  }
  business: {
    activeUsers?: number
    requestCount?: number
    transactionCount?: number
    customMetrics?: Record<string, number>
  }
}

/**
 * 服务依赖关系
 */
export interface ServiceDependency {
  serviceName: string
  dependsOn: string[]
  dependents: string[]
  criticalPath: boolean
  lastChecked: Date
  status: 'satisfied' | 'unsatisfied' | 'unknown'
}

/**
 * 服务配置
 */
export interface ServiceConfiguration {
  serviceName: string
  config: Record<string, any>
  version: string
  updatedAt: Date
  updatedBy: string
  environment: string
  encrypted?: string[]
}

/**
 * 消息过滤器
 */
export interface MessageFilter {
  name: string
  condition: (message: InterServiceMessage) => boolean
  action: 'allow' | 'deny' | 'transform' | 'route'
  config?: Record<string, any>
}

/**
 * 服务代理配置
 */
export interface ServiceProxyConfig {
  enabled: boolean
  targetService: string
  endpoints: ProxyEndpoint[]
  authentication?: {
    type: string
    config: Record<string, any>
  }
  rateLimit?: {
    requestsPerSecond: number
    burstSize: number
  }
  caching?: {
    enabled: boolean
    ttl: number
    keys: string[]
  }
}

/**
 * 代理端点
 */
export interface ProxyEndpoint {
  path: string
  method: string
  target: string
  transformation?: {
    request?: (data: any) => any
    response?: (data: any) => any
  }
}

/**
 * 服务协议
 */
export interface ServiceContract {
  serviceName: string
  version: string
  endpoints: ContractEndpoint[]
  messageTypes: MessageTypeDefinition[]
  schemas: Record<string, any>
  documentation?: string
  examples?: Record<string, any>
}

/**
 * 契约端点
 */
export interface ContractEndpoint {
  name: string
  description?: string
  method: string
  path: string
  requestSchema?: any
  responseSchema?: any
  errorCodes?: number[]
}

/**
 * 消息类型定义
 */
export interface MessageTypeDefinition {
  name: string
  description?: string
  schema: any
  examples?: any[]
  deprecated?: boolean
}

/**
 * 服务治理策略
 */
export interface ServiceGovernancePolicy {
  name: string
  description?: string
  type: 'security' | 'performance' | 'reliability' | 'compliance'
  rules: GovernanceRule[]
  enforcement: 'strict' | 'advisory' | 'disabled'
  violations: PolicyViolation[]
}

/**
 * 治理规则
 */
export interface GovernanceRule {
  id: string
  description: string
  condition: string
  action: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
}

/**
 * 策略违规
 */
export interface PolicyViolation {
  id: string
  ruleId: string
  serviceName: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  resolved: boolean
}

/**
 * 服务拓扑
 */
export interface ServiceTopology {
  services: ServiceNode[]
  connections: ServiceConnection[]
  clusters: ServiceCluster[]
  metrics?: TopologyMetrics
}

/**
 * 服务节点
 */
export interface ServiceNode {
  id: string
  name: string
  type: 'service' | 'database' | 'cache' | 'queue' | 'external'
  status: ServiceStatus
  metadata: Record<string, any>
  position?: { x: number; y: number }
}

/**
 * 服务连接
 */
export interface ServiceConnection {
  id: string
  source: string
  target: string
  type: 'sync' | 'async' | 'stream' | 'batch'
  protocol: string
  status: 'active' | 'inactive' | 'degraded'
  metrics?: {
    latency: number
    throughput: number
    errorRate: number
  }
}

/**
 * 服务集群
 */
export interface ServiceCluster {
  id: string
  name: string
  services: string[]
  type: 'replica' | 'shard' | 'region' | 'environment'
  metadata: Record<string, any>
}

/**
 * 拓扑指标
 */
export interface TopologyMetrics {
  totalServices: number
  activeConnections: number
  averageLatency: number
  totalThroughput: number
  healthScore: number
  lastUpdated: Date
}