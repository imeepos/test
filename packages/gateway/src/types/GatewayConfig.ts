import type { CorsOptions } from 'cors'

// Gateway配置类型
export interface GatewayConfig {
  // 服务器配置
  port: number
  host?: string

  // CORS配置
  cors: CorsOptions

  // 认证配置
  auth: AuthConfig

  // 限流配置
  rateLimit: RateLimitConfig

  // WebSocket配置
  websocket: WebSocketConfig

  // 安全配置
  security: SecurityConfig

  // 监控配置
  monitoring?: MonitoringConfig
}

// 认证配置
export interface AuthConfig {
  secret: string
  expiresIn: string
  algorithm?: string
  issuer?: string
  audience?: string
}

// 限流配置
export interface RateLimitConfig {
  enabled?: boolean  // 是否启用限流，默认true
  windowMs: number
  max: number
  message?: string
  standardHeaders?: boolean
  legacyHeaders?: boolean
}

// WebSocket配置
export interface WebSocketConfig {
  path: string
  heartbeatInterval: number
  timeout: number
  maxConnections?: number
  compression?: boolean
}

// 安全配置
export interface SecurityConfig {
  helmet: boolean
  compression: boolean
  trustProxy?: boolean
  bodyLimit?: string
}

// 监控配置
export interface MonitoringConfig {
  enabled: boolean
  endpoint?: string
  interval?: number
  includeMetrics?: string[]
}