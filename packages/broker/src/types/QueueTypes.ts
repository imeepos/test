// 队列相关的类型定义 - 重命名以避免与BrokerConfig.ts冲突

export interface BrokerQueueConfig {
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

export interface BrokerExchangeConfig {
  type: 'direct' | 'topic' | 'fanout' | 'headers'
  durable?: boolean
  autoDelete?: boolean
  internal?: boolean
  arguments?: any
}