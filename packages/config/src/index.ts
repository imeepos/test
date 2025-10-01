import * as dotenv from 'dotenv'
import Joi from 'joi'

// 加载环境变量
dotenv.config()

// 数据库配置接口
export interface DatabaseConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
  ssl?: boolean
  maxConnections?: number
  acquireConnectionTimeout?: number
  createTimeoutMillis?: number
  idleTimeoutMillis?: number
}

// Redis配置接口
export interface RedisConfig {
  url: string
  password?: string
  db?: number
  maxRetriesPerRequest?: number
  retryDelayOnFailover?: number
}

// 消息队列配置接口
export interface MessageQueueConfig {
  url: string
  heartbeat?: number
  connectionTimeout?: number
  channelMax?: number
}

// AI服务配置接口
export interface AIConfig {
  openaiApiKey: string
  defaultModel?: string
  maxTokens?: number
  temperature?: number
}

// 应用配置接口
export interface AppConfig {
  nodeEnv: string
  port: number
  jwtSecret: string
  corsOrigins?: string[]
  logLevel?: string
}

// 功能开关配置
export interface FeatureFlags {
  enableAI: boolean
  enableCollaboration: boolean
  enableVersionHistory: boolean
  enableRealTimeSync: boolean
  enableAdvancedAnalytics: boolean
  enableBatchProcessing: boolean
}

// 主题配置
export interface ThemeConfig {
  defaultTheme: 'light' | 'dark' | 'auto'
  supportedThemes: string[]
  customThemes?: Record<string, any>
}

// 缓存配置
export interface CacheConfig {
  ttl: number
  maxKeys: number
  enableRedis: boolean
}

// 完整的配置接口
export interface Config {
  app: AppConfig
  database: DatabaseConfig
  redis: RedisConfig
  messageQueue: MessageQueueConfig
  ai: AIConfig
  features: FeatureFlags
  theme: ThemeConfig
  cache: CacheConfig
}

// 环境变量验证模式
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  JWT_SECRET: Joi.string().required(),

  // 数据库配置
  PG_HOST: Joi.string().default('localhost'),
  PG_PORT: Joi.number().default(5432),
  PG_DATABASE: Joi.string().required(),
  PG_USER: Joi.string().required(),
  PG_PASSWORD: Joi.string().required(),
  PG_SSL: Joi.boolean().default(false),

  // Redis配置
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().default(0),

  // 消息队列配置
  RABBITMQ_URL: Joi.string().default('amqp://guest:guest@localhost:5672'),

  // AI配置
  OPENAI_API_KEY: Joi.string().required(),

  // 缓存配置
  CACHE_TTL: Joi.number().default(3600),
  CACHE_MAX_KEYS: Joi.number().default(10000),

  // 功能开关
  ENABLE_AI: Joi.boolean().default(true),
  ENABLE_COLLABORATION: Joi.boolean().default(true),
  ENABLE_VERSION_HISTORY: Joi.boolean().default(true),
  ENABLE_REALTIME_SYNC: Joi.boolean().default(true),
  ENABLE_ADVANCED_ANALYTICS: Joi.boolean().default(false),
  ENABLE_BATCH_PROCESSING: Joi.boolean().default(true)
})

// 验证并获取环境变量
function getValidatedEnv() {
  const { error, value } = envSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: false
  })

  if (error) {
    throw new Error(`环境变量验证失败: ${error.message}`)
  }

  return value
}

// 获取配置
export function getConfig(): Config {
  const env = getValidatedEnv()

  return {
    app: {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      jwtSecret: env.JWT_SECRET,
      corsOrigins: env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      logLevel: env.LOG_LEVEL || 'info'
    },
    database: {
      host: env.PG_HOST,
      port: env.PG_PORT,
      database: env.PG_DATABASE,
      user: env.PG_USER,
      password: env.PG_PASSWORD,
      ssl: env.PG_SSL,
      maxConnections: env.PG_MAX_CONNECTIONS || 20,
      acquireConnectionTimeout: env.PG_ACQUIRE_CONNECTION_TIMEOUT || 60000,
      createTimeoutMillis: env.PG_CREATE_TIMEOUT || 30000,
      idleTimeoutMillis: env.PG_IDLE_TIMEOUT || 30000
    },
    redis: {
      url: env.REDIS_URL,
      password: env.REDIS_PASSWORD,
      db: env.REDIS_DB,
      maxRetriesPerRequest: env.REDIS_MAX_RETRIES || 3,
      retryDelayOnFailover: env.REDIS_RETRY_DELAY || 100
    },
    messageQueue: {
      url: env.RABBITMQ_URL,
      heartbeat: env.RABBITMQ_HEARTBEAT || 60,
      connectionTimeout: env.RABBITMQ_CONNECTION_TIMEOUT || 60000,
      channelMax: env.RABBITMQ_CHANNEL_MAX || 0
    },
    ai: {
      openaiApiKey: env.OPENAI_API_KEY,
      defaultModel: env.OPENAI_DEFAULT_MODEL || 'gpt-3.5-turbo',
      maxTokens: env.OPENAI_MAX_TOKENS || 2000,
      temperature: env.OPENAI_TEMPERATURE || 0.7
    },
    features: {
      enableAI: env.ENABLE_AI,
      enableCollaboration: env.ENABLE_COLLABORATION,
      enableVersionHistory: env.ENABLE_VERSION_HISTORY,
      enableRealTimeSync: env.ENABLE_REALTIME_SYNC,
      enableAdvancedAnalytics: env.ENABLE_ADVANCED_ANALYTICS,
      enableBatchProcessing: env.ENABLE_BATCH_PROCESSING
    },
    theme: {
      defaultTheme: (env.DEFAULT_THEME as any) || 'light',
      supportedThemes: env.SUPPORTED_THEMES?.split(',') || ['light', 'dark', 'auto'],
      customThemes: env.CUSTOM_THEMES ? JSON.parse(env.CUSTOM_THEMES) : undefined
    },
    cache: {
      ttl: env.CACHE_TTL,
      maxKeys: env.CACHE_MAX_KEYS,
      enableRedis: env.ENABLE_REDIS_CACHE !== 'false'
    }
  }
}

// 获取默认数据库配置
export function getDefaultDatabaseConfig(): DatabaseConfig {
  return getConfig().database
}

// 检查功能是否启用
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return getConfig().features[feature]
}

// 获取AI配置
export function getAIConfig(): AIConfig {
  return getConfig().ai
}

// 获取Redis配置
export function getRedisConfig(): RedisConfig {
  return getConfig().redis
}

// 获取消息队列配置
export function getMessageQueueConfig(): MessageQueueConfig {
  return getConfig().messageQueue
}

// 获取主题配置
export function getThemeConfig(): ThemeConfig {
  return getConfig().theme
}

// 配置管理器类
export class ConfigManager {
  private config: Config

  constructor() {
    this.config = getConfig()
  }

  get<K extends keyof Config>(key: K): Config[K] {
    return this.config[key]
  }

  getAll(): Config {
    return { ...this.config }
  }

  isDevelopment(): boolean {
    return this.config.app.nodeEnv === 'development'
  }

  isProduction(): boolean {
    return this.config.app.nodeEnv === 'production'
  }

  isTest(): boolean {
    return this.config.app.nodeEnv === 'test'
  }

  reload() {
    this.config = getConfig()
  }
}

// 创建单例实例
export const configManager = new ConfigManager()
