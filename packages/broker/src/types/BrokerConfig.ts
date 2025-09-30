import type { Options } from 'amqplib'

// Broker配置类型
export interface BrokerConfig {
  // 连接配置
  connectionUrl: string
  connectionOptions?: Options.Connect

  // 交换机配置
  exchanges: Record<string, ExchangeConfig>

  // 队列配置
  queues: Record<string, QueueConfig>

  // 消费者配置
  prefetch?: number

  // 连接配置
  heartbeat?: number

  // 重试配置
  retry?: RetryConfig

  // 死信配置
  deadLetter?: DeadLetterConfig

  // 监控配置
  monitoring?: MonitoringConfig
}

// 交换机配置
export interface ExchangeConfig {
  type: 'direct' | 'topic' | 'fanout' | 'headers'
  durable?: boolean
  autoDelete?: boolean
  internal?: boolean
  arguments?: any
}

// 队列配置
export interface QueueConfig {
  durable?: boolean
  exclusive?: boolean
  autoDelete?: boolean
  arguments?: any
  exchange?: string
  routingKey?: string | string[]
  deadLetterExchange?: string
  deadLetterRoutingKey?: string
  maxLength?: number
  maxPriority?: number
  ttl?: number
}

// 重试配置
export interface RetryConfig {
  maxRetries: number
  maxAttempts?: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: string[]
}

// 死信配置
export interface DeadLetterConfig {
  enabled: boolean
  exchange: string
  routingKey: string
  ttl?: number
}

// 监控配置
export interface MonitoringConfig {
  enabled: boolean
  metricsInterval: number
  healthCheckInterval: number
  alertThresholds: {
    queueLength: number
    processingDelay: number
    errorRate: number
  }
}

// 消息选项
export interface MessageOptions {
  priority?: number
  expiration?: string
  persistent?: boolean
  mandatory?: boolean
  immediate?: boolean
  headers?: Record<string, any>
  correlationId?: string
  replyTo?: string
  messageId?: string
  timestamp?: Date
  type?: string
  userId?: string
  appId?: string
}

// 消费者选项
export interface ConsumerOptions {
  noAck?: boolean
  exclusive?: boolean
  priority?: number
  consumerTag?: string
  noLocal?: boolean
  arguments?: any
}

// 发布确认配置
export interface PublishConfirmConfig {
  enabled: boolean
  timeout: number
  maxPending: number
}