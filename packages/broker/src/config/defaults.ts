import type { BrokerConfig } from '../types/BrokerConfig'

/**
 * 默认Broker配置
 */
export const DEFAULT_BROKER_CONFIG: BrokerConfig = {
  // 连接配置
  connectionUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  connectionOptions: {
    heartbeat: 60,
    locale: 'en_US'
  },

  // 交换机配置
  exchanges: {
    'llm.direct': {
      type: 'direct',
      durable: true,
      autoDelete: false
    },
    'events.topic': {
      type: 'topic',
      durable: true,
      autoDelete: false
    },
    'realtime.fanout': {
      type: 'fanout',
      durable: false,
      autoDelete: false
    }
  },

  // 队列配置
  queues: {
    'llm.process.queue': {
      durable: true,
      exclusive: false,
      autoDelete: false,
      exchange: 'llm.direct',
      routingKey: 'llm.process',
      maxPriority: 10,
      arguments: {
        'x-queue-type': 'classic'
      }
    },
    'result.notify.queue': {
      durable: true,
      exclusive: false,
      autoDelete: false,
      exchange: 'llm.direct',
      routingKey: 'result.notify'
    },
    'events.websocket.queue': {
      durable: false,
      exclusive: false,
      autoDelete: true,
      exchange: 'events.topic',
      routingKey: 'websocket.*'
    },
    'events.storage.queue': {
      durable: true,
      exclusive: false,
      autoDelete: false,
      exchange: 'events.topic',
      routingKey: ['node.*', 'project.*', 'user.*']
    },
    'realtime.broadcast.queue': {
      durable: false,
      exclusive: false,
      autoDelete: true,
      exchange: 'realtime.fanout',
      routingKey: ''
    }
  },

  // 消费者配置
  prefetch: 5,

  // 连接配置
  heartbeat: 60,

  // 重试配置
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableErrors: [
      'ECONNRESET',
      'ENOTFOUND',
      'TIMEOUT',
      'ECONNREFUSED',
      'EHOSTUNREACH'
    ]
  },

  // 死信配置
  deadLetter: {
    enabled: false,
    exchange: 'dlx',
    routingKey: 'failed'
  },

  // 监控配置
  monitoring: {
    enabled: false,
    metricsInterval: 60000, // 1分钟
    healthCheckInterval: 30000, // 30秒
    alertThresholds: {
      queueLength: 100,
      processingDelay: 10000, // 10秒
      errorRate: 0.1 // 10%
    }
  }
}

/**
 * AI专用队列配置
 */
export const AI_QUEUE_CONFIG = {
  exchanges: {
    'ai.direct': {
      type: 'direct' as const,
      durable: true,
      autoDelete: false
    },
    'ai.priority': {
      type: 'direct' as const,
      durable: true,
      autoDelete: false
    }
  },
  queues: {
    'ai.generate.queue': {
      durable: true,
      exclusive: false,
      autoDelete: false,
      exchange: 'ai.direct',
      routingKey: 'ai.generate',
      maxPriority: 10,
      ttl: 600000 // 10分钟TTL
    },
    'ai.optimize.queue': {
      durable: true,
      exclusive: false,
      autoDelete: false,
      exchange: 'ai.direct',
      routingKey: 'ai.optimize',
      maxPriority: 10,
      ttl: 300000 // 5分钟TTL
    },
    'ai.fusion.queue': {
      durable: true,
      exclusive: false,
      autoDelete: false,
      exchange: 'ai.direct',
      routingKey: 'ai.fusion',
      maxPriority: 10,
      ttl: 900000 // 15分钟TTL
    },
    'ai.batch.queue': {
      durable: true,
      exclusive: false,
      autoDelete: false,
      exchange: 'ai.direct',
      routingKey: 'ai.batch',
      maxPriority: 5,
      ttl: 1800000 // 30分钟TTL
    },
    'ai.priority.queue': {
      durable: true,
      exclusive: false,
      autoDelete: false,
      exchange: 'ai.priority',
      routingKey: 'ai.urgent',
      maxPriority: 15,
      ttl: 120000 // 2分钟TTL
    }
  }
}

/**
 * 事件队列配置
 */
export const EVENT_QUEUE_CONFIG = {
  exchanges: {
    'events.node': {
      type: 'topic' as const,
      durable: true,
      autoDelete: false
    },
    'events.project': {
      type: 'topic' as const,
      durable: true,
      autoDelete: false
    },
    'events.user': {
      type: 'topic' as const,
      durable: true,
      autoDelete: false
    },
    'events.system': {
      type: 'fanout' as const,
      durable: false,
      autoDelete: false
    }
  },
  queues: {
    'events.node.storage': {
      durable: true,
      exclusive: false,
      autoDelete: false,
      exchange: 'events.node',
      routingKey: ['node.created', 'node.updated', 'node.deleted']
    },
    'events.node.websocket': {
      durable: false,
      exclusive: false,
      autoDelete: true,
      exchange: 'events.node',
      routingKey: 'node.*'
    },
    'events.project.storage': {
      durable: true,
      exclusive: false,
      autoDelete: false,
      exchange: 'events.project',
      routingKey: ['project.created', 'project.updated', 'project.deleted']
    },
    'events.user.audit': {
      durable: true,
      exclusive: false,
      autoDelete: false,
      exchange: 'events.user',
      routingKey: 'user.*'
    },
    'events.system.broadcast': {
      durable: false,
      exclusive: false,
      autoDelete: true,
      exchange: 'events.system',
      routingKey: ''
    }
  }
}

/**
 * 获取完整的默认配置（包含AI和事件队列）
 */
export function getFullDefaultConfig(): BrokerConfig {
  return {
    ...DEFAULT_BROKER_CONFIG,
    exchanges: {
      ...DEFAULT_BROKER_CONFIG.exchanges,
      ...AI_QUEUE_CONFIG.exchanges,
      ...EVENT_QUEUE_CONFIG.exchanges
    },
    queues: {
      ...DEFAULT_BROKER_CONFIG.queues,
      ...AI_QUEUE_CONFIG.queues,
      ...EVENT_QUEUE_CONFIG.queues
    }
  }
}

/**
 * 获取轻量级配置（仅基础功能）
 */
export function getLightweightConfig(): BrokerConfig {
  return {
    ...DEFAULT_BROKER_CONFIG,
    exchanges: {
      'llm.direct': DEFAULT_BROKER_CONFIG.exchanges['llm.direct']
    },
    queues: {
      'llm.process.queue': DEFAULT_BROKER_CONFIG.queues['llm.process.queue'],
      'result.notify.queue': DEFAULT_BROKER_CONFIG.queues['result.notify.queue']
    }
  }
}