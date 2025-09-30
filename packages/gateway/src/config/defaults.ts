import type { GatewayConfig } from '../types/GatewayConfig'

/**
 * 默认Gateway配置
 */
export const DEFAULT_CONFIG: GatewayConfig = {
  // 服务器配置
  port: 8000,
  host: '0.0.0.0',

  // CORS配置
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // 认证配置
  auth: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: '24h',
    algorithm: 'HS256',
    issuer: '@sker/gateway',
    audience: '@sker/studio'
  },

  // 限流配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 每个IP每15分钟最多100个请求
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  },

  // WebSocket配置
  websocket: {
    path: '/socket.io',
    heartbeatInterval: 30000, // 30秒
    timeout: 60000, // 60秒
    maxConnections: 1000,
    compression: true
  },

  // 安全配置
  security: {
    helmet: true,
    compression: true,
    trustProxy: process.env.NODE_ENV === 'production',
    bodyLimit: '10mb'
  },

  // 监控配置
  monitoring: {
    enabled: process.env.NODE_ENV === 'production',
    endpoint: '/metrics',
    interval: 60000, // 1分钟
    includeMetrics: [
      'http_requests_total',
      'http_request_duration_seconds',
      'websocket_connections_total',
      'ai_requests_total',
      'errors_total'
    ]
  }
}

/**
 * 开发环境配置
 */
export const DEVELOPMENT_CONFIG: Partial<GatewayConfig> = {
  cors: {
    origin: '*', // 开发环境允许所有域名
    credentials: true
  },
  security: {
    helmet: false, // 开发环境禁用helmet以便调试
    compression: false,
    trustProxy: false
  },
  monitoring: {
    enabled: false
  }
}

/**
 * 生产环境配置
 */
export const PRODUCTION_CONFIG: Partial<GatewayConfig> = {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'https://studio.sker.ai',
      process.env.ADMIN_URL || 'https://admin.sker.ai'
    ],
    credentials: true
  },
  security: {
    helmet: true,
    compression: true,
    trustProxy: true,
    bodyLimit: '5mb' // 生产环境限制更小的请求体
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 50 // 生产环境更严格的限流
  },
  websocket: {
    path: '/socket.io',
    heartbeatInterval: 30000,
    timeout: 60000,
    maxConnections: 5000 // 生产环境支持更多连接
  },
  monitoring: {
    enabled: true,
    interval: 30000 // 30秒监控间隔
  }
}

/**
 * 测试环境配置
 */
export const TEST_CONFIG: Partial<GatewayConfig> = {
  port: 0, // 随机端口
  cors: {
    origin: '*'
  },
  auth: {
    secret: 'test-secret',
    expiresIn: '1h'
  },
  rateLimit: {
    windowMs: 60000, // 1分钟
    max: 1000 // 测试环境宽松限制
  },
  websocket: {
    path: '/socket.io',
    heartbeatInterval: 5000, // 5秒
    timeout: 10000, // 10秒
    maxConnections: 100
  },
  security: {
    helmet: false,
    compression: false,
    trustProxy: false
  },
  monitoring: {
    enabled: false
  }
}

/**
 * 根据环境获取配置
 */
export function getConfigForEnvironment(env: string = process.env.NODE_ENV || 'development'): Partial<GatewayConfig> {
  switch (env) {
    case 'production':
      return PRODUCTION_CONFIG
    case 'test':
      return TEST_CONFIG
    case 'development':
    default:
      return DEVELOPMENT_CONFIG
  }
}

/**
 * 合并配置
 */
export function mergeConfig(baseConfig: GatewayConfig, overrides: Partial<GatewayConfig>): GatewayConfig {
  return {
    ...baseConfig,
    ...overrides,
    cors: { ...baseConfig.cors, ...overrides.cors },
    auth: { ...baseConfig.auth, ...overrides.auth },
    rateLimit: { ...baseConfig.rateLimit, ...overrides.rateLimit },
    websocket: { ...baseConfig.websocket, ...overrides.websocket },
    security: { ...baseConfig.security, ...overrides.security },
    monitoring: { ...baseConfig.monitoring, ...overrides.monitoring }
  }
}