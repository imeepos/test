import { MessageBroker } from '../core/MessageBroker.js'
import { DEFAULT_BROKER_CONFIG } from '../config/defaults.js'
import type { BrokerConfig } from '../types/BrokerConfig.js'

/**
 * 创建MessageBroker的工厂函数
 */
export function createBroker(userConfig: Partial<BrokerConfig> = {}): MessageBroker {
  // 合并配置
  const config = mergeConfig(DEFAULT_BROKER_CONFIG, userConfig)

  // 验证配置
  validateConfig(config)

  // 创建MessageBroker实例
  return new MessageBroker(config)
}

/**
 * 创建开发环境Broker
 */
export function createDevelopmentBroker(userConfig: Partial<BrokerConfig> = {}): MessageBroker {
  const devConfig: Partial<BrokerConfig> = {
    connectionUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    prefetch: 1,
    retry: {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'TIMEOUT']
    },
    ...userConfig
  }

  return createBroker(devConfig)
}

/**
 * 创建生产环境Broker
 */
export function createProductionBroker(userConfig: Partial<BrokerConfig> = {}): MessageBroker {
  const prodConfig: Partial<BrokerConfig> = {
    connectionUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    prefetch: 10,
    heartbeat: 60,
    retry: {
      maxRetries: 5,
      initialDelay: 2000,
      maxDelay: 60000,
      backoffMultiplier: 2,
      retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'TIMEOUT']
    },
    deadLetter: {
      enabled: true,
      exchange: 'dlx',
      routingKey: 'failed',
      ttl: 24 * 60 * 60 * 1000 // 24小时
    },
    monitoring: {
      enabled: true,
      metricsInterval: 30000,
      healthCheckInterval: 10000,
      alertThresholds: {
        queueLength: 1000,
        processingDelay: 30000,
        errorRate: 0.05
      }
    },
    ...userConfig
  }

  return createBroker(prodConfig)
}

/**
 * 创建测试环境Broker
 */
export function createTestBroker(userConfig: Partial<BrokerConfig> = {}): MessageBroker {
  const testConfig: Partial<BrokerConfig> = {
    connectionUrl: process.env.RABBITMQ_TEST_URL || 'amqp://guest:guest@localhost:5672',
    prefetch: 1,
    exchanges: {
      'test.direct': { type: 'direct', durable: false, autoDelete: true }
    },
    queues: {
      'test.queue': { durable: false, autoDelete: true, exclusive: true }
    },
    retry: {
      maxRetries: 1,
      initialDelay: 100,
      maxDelay: 1000,
      backoffMultiplier: 1,
      retryableErrors: []
    },
    ...userConfig
  }

  return createBroker(testConfig)
}

/**
 * 从环境变量创建配置
 */
export function createConfigFromEnv(): Partial<BrokerConfig> {
  const config: Partial<BrokerConfig> = {}

  // 连接配置
  if (process.env.RABBITMQ_URL) {
    config.connectionUrl = process.env.RABBITMQ_URL
  }

  if (process.env.RABBITMQ_PREFETCH) {
    config.prefetch = parseInt(process.env.RABBITMQ_PREFETCH)
  }

  if (process.env.RABBITMQ_HEARTBEAT) {
    config.heartbeat = parseInt(process.env.RABBITMQ_HEARTBEAT)
  }

  // 重试配置
  if (process.env.RABBITMQ_MAX_RETRIES) {
    config.retry = {
      maxRetries: parseInt(process.env.RABBITMQ_MAX_RETRIES),
      initialDelay: parseInt(process.env.RABBITMQ_RETRY_DELAY || '1000'),
      maxDelay: parseInt(process.env.RABBITMQ_MAX_RETRY_DELAY || '30000'),
      backoffMultiplier: parseFloat(process.env.RABBITMQ_BACKOFF_MULTIPLIER || '2'),
      retryableErrors: (process.env.RABBITMQ_RETRYABLE_ERRORS || 'ECONNRESET,ENOTFOUND,TIMEOUT').split(',')
    }
  }

  // 死信配置
  if (process.env.RABBITMQ_DLX_ENABLED === 'true') {
    config.deadLetter = {
      enabled: true,
      exchange: process.env.RABBITMQ_DLX_EXCHANGE || 'dlx',
      routingKey: process.env.RABBITMQ_DLX_ROUTING_KEY || 'failed',
      ttl: parseInt(process.env.RABBITMQ_DLX_TTL || '86400000') // 24小时
    }
  }

  return config
}

/**
 * 快速启动Broker
 */
export async function startBroker(userConfig: Partial<BrokerConfig> = {}): Promise<MessageBroker> {
  const broker = createBroker(userConfig)
  await broker.start()
  return broker
}

/**
 * 快速启动开发环境Broker
 */
export async function startDevelopmentBroker(userConfig: Partial<BrokerConfig> = {}): Promise<MessageBroker> {
  const broker = createDevelopmentBroker(userConfig)
  await broker.start()
  return broker
}

/**
 * 快速启动生产环境Broker
 */
export async function startProductionBroker(userConfig: Partial<BrokerConfig> = {}): Promise<MessageBroker> {
  const broker = createProductionBroker(userConfig)
  await broker.start()
  return broker
}

/**
 * 合并配置
 */
function mergeConfig(baseConfig: BrokerConfig, overrides: Partial<BrokerConfig>): BrokerConfig {
  return {
    ...baseConfig,
    ...overrides,
    exchanges: { ...baseConfig.exchanges, ...overrides.exchanges },
    queues: { ...baseConfig.queues, ...overrides.queues },
    retry: { ...baseConfig.retry, ...overrides.retry },
    deadLetter: { ...baseConfig.deadLetter, ...overrides.deadLetter },
    monitoring: { ...baseConfig.monitoring, ...overrides.monitoring }
  }
}

/**
 * 验证配置
 */
function validateConfig(config: BrokerConfig): void {
  const errors: string[] = []

  // 验证连接URL
  if (!config.connectionUrl) {
    errors.push('Connection URL is required')
  }

  // 验证交换机配置
  for (const [name, exchangeConfig] of Object.entries(config.exchanges)) {
    if (!['direct', 'topic', 'fanout', 'headers'].includes(exchangeConfig.type)) {
      errors.push(`Invalid exchange type for ${name}: ${exchangeConfig.type}`)
    }
  }

  // 验证队列配置
  for (const [name, queueConfig] of Object.entries(config.queues)) {
    if (queueConfig.exchange && !config.exchanges[queueConfig.exchange]) {
      errors.push(`Queue ${name} references non-existent exchange: ${queueConfig.exchange}`)
    }

    if (queueConfig.maxLength && queueConfig.maxLength <= 0) {
      errors.push(`Invalid maxLength for queue ${name}: ${queueConfig.maxLength}`)
    }

    if (queueConfig.maxPriority && (queueConfig.maxPriority < 1 || queueConfig.maxPriority > 255)) {
      errors.push(`Invalid maxPriority for queue ${name}: ${queueConfig.maxPriority}`)
    }
  }

  // 验证prefetch
  if (config.prefetch && config.prefetch <= 0) {
    errors.push(`Invalid prefetch value: ${config.prefetch}`)
  }

  // 验证心跳
  if (config.heartbeat && config.heartbeat <= 0) {
    errors.push(`Invalid heartbeat value: ${config.heartbeat}`)
  }

  // 验证重试配置
  if (config.retry) {
    if (config.retry.maxRetries < 0) {
      errors.push(`Invalid maxRetries: ${config.retry.maxRetries}`)
    }
    if (config.retry.initialDelay <= 0) {
      errors.push(`Invalid initialDelay: ${config.retry.initialDelay}`)
    }
    if (config.retry.maxDelay <= config.retry.initialDelay) {
      errors.push('maxDelay must be greater than initialDelay')
    }
    if (config.retry.backoffMultiplier <= 1) {
      errors.push(`Invalid backoffMultiplier: ${config.retry.backoffMultiplier}`)
    }
  }

  if (errors.length > 0) {
    throw new Error(`Broker configuration validation failed:\n${errors.join('\n')}`)
  }
}