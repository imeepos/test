// 队列相关的类型定义

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

export interface ExchangeConfig {
  type: 'direct' | 'topic' | 'fanout' | 'headers'
  durable?: boolean
  autoDelete?: boolean
  internal?: boolean
  arguments?: any
}