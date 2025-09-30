import { GatewayServer } from '../server/GatewayServer.js'
import { DEFAULT_CONFIG, getConfigForEnvironment, mergeConfig } from '../config/defaults.js'
import type { GatewayConfig } from '../types/GatewayConfig.js'
import type { AIEngine } from '@sker/engine'
import { StoreClient } from '@sker/store'
import { MessageBroker } from '@sker/broker'

export interface GatewayDependencies {
  aiEngine?: AIEngine
  storeClient?: StoreClient
  messageBroker?: MessageBroker
}

/**
 * 创建Gateway服务器的工厂函数
 */
export function createGateway(
  userConfig: Partial<GatewayConfig> = {},
  dependencies?: GatewayDependencies
): GatewayServer {
  // 获取环境特定配置
  const envConfig = getConfigForEnvironment()

  // 合并配置：默认配置 + 环境配置 + 用户配置
  const finalConfig = mergeConfig(
    mergeConfig(DEFAULT_CONFIG, envConfig),
    userConfig
  )

  // 验证必要的配置
  validateConfig(finalConfig)

  // 创建Gateway服务器实例
  return new GatewayServer(finalConfig, dependencies)
}

/**
 * 创建开发环境Gateway
 */
export function createDevelopmentGateway(
  userConfig: Partial<GatewayConfig> = {},
  dependencies?: GatewayDependencies
): GatewayServer {
  const devConfig: Partial<GatewayConfig> = {
    ...getConfigForEnvironment('development'),
    ...userConfig
  }

  return createGateway(devConfig, dependencies)
}

/**
 * 创建生产环境Gateway
 */
export function createProductionGateway(
  userConfig: Partial<GatewayConfig> = {},
  dependencies?: GatewayDependencies
): GatewayServer {
  const prodConfig: Partial<GatewayConfig> = {
    ...getConfigForEnvironment('production'),
    ...userConfig
  }

  return createGateway(prodConfig, dependencies)
}

/**
 * 创建测试环境Gateway
 */
export function createTestGateway(
  userConfig: Partial<GatewayConfig> = {},
  dependencies?: GatewayDependencies
): GatewayServer {
  const testConfig: Partial<GatewayConfig> = {
    ...getConfigForEnvironment('test'),
    ...userConfig
  }

  return createGateway(testConfig, dependencies)
}

/**
 * 验证配置
 */
function validateConfig(config: GatewayConfig): void {
  const errors: string[] = []

  // 验证端口
  if (!config.port || config.port < 1 || config.port > 65535) {
    errors.push('Port must be between 1 and 65535')
  }

  // 验证JWT密钥
  if (!config.auth.secret || config.auth.secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      errors.push('JWT secret must be at least 32 characters in production')
    } else {
      console.warn('Warning: JWT secret should be at least 32 characters')
    }
  }

  // 验证CORS配置
  if (!config.cors.origin) {
    errors.push('CORS origin must be specified')
  }

  // 验证限流配置
  if (config.rateLimit.windowMs < 1000) {
    errors.push('Rate limit window must be at least 1 second')
  }

  if (config.rateLimit.max < 1) {
    errors.push('Rate limit max must be at least 1')
  }

  // 验证WebSocket配置
  if (config.websocket.heartbeatInterval < 5000) {
    errors.push('WebSocket heartbeat interval must be at least 5 seconds')
  }

  if (config.websocket.timeout < config.websocket.heartbeatInterval * 2) {
    errors.push('WebSocket timeout must be at least 2x heartbeat interval')
  }

  // 在生产环境中建议配置消息队列
  if (process.env.NODE_ENV === 'production') {
    console.warn('建议在生产环境中配置MessageBroker以获得更好的性能和可靠性')
  }

  // 如果有错误，抛出异常
  if (errors.length > 0) {
    throw new Error(`Gateway configuration validation failed:\n${errors.join('\n')}`)
  }
}

/**
 * 从环境变量创建配置
 */
export function createConfigFromEnv(): Partial<GatewayConfig> {
  const config: Partial<GatewayConfig> = {}

  // 基础配置
  if (process.env.PORT) {
    config.port = parseInt(process.env.PORT)
  }

  if (process.env.HOST) {
    config.host = process.env.HOST
  }

  // CORS配置
  if (process.env.FRONTEND_URL) {
    config.cors = {
      origin: process.env.FRONTEND_URL.split(','),
      credentials: true
    }
  }

  // 认证配置
  if (process.env.JWT_SECRET) {
    config.auth = {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE
    }
  }

  // 限流配置
  if (process.env.RATE_LIMIT_WINDOW || process.env.RATE_LIMIT_MAX) {
    config.rateLimit = {
      windowMs: process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : 15 * 60 * 1000,
      max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100
    }
  }

  // WebSocket配置
  if (process.env.WS_PATH || process.env.WS_HEARTBEAT_INTERVAL || process.env.WS_TIMEOUT) {
    config.websocket = {
      path: process.env.WS_PATH || '/socket.io',
      heartbeatInterval: process.env.WS_HEARTBEAT_INTERVAL ? parseInt(process.env.WS_HEARTBEAT_INTERVAL) : 30000,
      timeout: process.env.WS_TIMEOUT ? parseInt(process.env.WS_TIMEOUT) : 60000,
      maxConnections: process.env.WS_MAX_CONNECTIONS ? parseInt(process.env.WS_MAX_CONNECTIONS) : undefined
    }
  }

  // 安全配置
  config.security = {
    helmet: process.env.SECURITY_HELMET !== 'false',
    compression: process.env.SECURITY_COMPRESSION !== 'false',
    trustProxy: process.env.SECURITY_TRUST_PROXY === 'true',
    bodyLimit: process.env.SECURITY_BODY_LIMIT || '10mb'
  }

  // 监控配置
  if (process.env.MONITORING_ENABLED) {
    config.monitoring = {
      enabled: process.env.MONITORING_ENABLED === 'true',
      endpoint: process.env.MONITORING_ENDPOINT || '/metrics',
      interval: process.env.MONITORING_INTERVAL ? parseInt(process.env.MONITORING_INTERVAL) : 60000
    }
  }

  return config
}

/**
 * 快速启动Gateway
 */
export async function startGateway(
  userConfig: Partial<GatewayConfig> = {},
  dependencies?: GatewayDependencies
): Promise<GatewayServer> {
  const gateway = createGateway(userConfig, dependencies)
  await gateway.start()
  return gateway
}

/**
 * 快速启动开发环境Gateway
 */
export async function startDevelopmentGateway(
  userConfig: Partial<GatewayConfig> = {},
  dependencies?: GatewayDependencies
): Promise<GatewayServer> {
  const gateway = createDevelopmentGateway(userConfig, dependencies)
  await gateway.start()
  return gateway
}

/**
 * 快速启动生产环境Gateway
 */
export async function startProductionGateway(
  userConfig: Partial<GatewayConfig> = {},
  dependencies?: GatewayDependencies
): Promise<GatewayServer> {
  const gateway = createProductionGateway(userConfig, dependencies)
  await gateway.start()
  return gateway
}