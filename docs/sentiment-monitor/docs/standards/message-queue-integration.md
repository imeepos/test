# 消息队列集成方案

## 1. 整体设计

消息队列作为事件驱动架构的核心基础设施，提供可靠的异步消息传递、服务解耦和流量削峰能力。

### 1.1 架构原则

- **可靠性**: 消息持久化、确认机制、重试策略
- **可扩展性**: 支持水平扩展、分区机制
- **高性能**: 批量处理、异步投递
- **监控性**: 完整的消息链路追踪

### 1.2 技术选型

```typescript
// config/message-queue.config.ts
export const MessageQueueConfig = {
  // 主消息队列 - RabbitMQ
  primary: {
    type: 'rabbitmq',
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT || '5672'),
    username: process.env.RABBITMQ_USER || 'guest',
    password: process.env.RABBITMQ_PASSWORD || 'guest',
    vhost: process.env.RABBITMQ_VHOST || '/',
    ssl: process.env.RABBITMQ_SSL === 'true'
  },

  // 高吞吐量场景 - Kafka
  streaming: {
    type: 'kafka',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.SERVICE_NAME || 'sentiment-monitor',
    ssl: process.env.KAFKA_SSL === 'true'
  },

  // 轻量级场景 - Redis
  cache: {
    type: 'redis',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0')
  }
};
```

## 2. 消息队列抽象层

### 2.1 统一接口设计

```typescript
// interfaces/message-queue.interface.ts
export interface Message {
  id: string;
  type: string;
  payload: any;
  headers?: Record<string, string>;
  timestamp: Date;
  correlationId?: string;
  replyTo?: string;
  expiration?: number;
  priority?: number;
}

export interface MessageQueue {
  // 连接管理
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // 消息发布
  publish(exchange: string, routingKey: string, message: Message): Promise<void>;
  publishBatch(exchange: string, messages: Array<{routingKey: string, message: Message}>): Promise<void>;

  // 消息订阅
  subscribe(queue: string, handler: MessageHandler): Promise<void>;
  unsubscribe(queue: string): Promise<void>;

  // 队列管理
  declareQueue(queueName: string, options?: QueueOptions): Promise<void>;
  declareExchange(exchangeName: string, type: ExchangeType, options?: ExchangeOptions): Promise<void>;
  bindQueue(queue: string, exchange: string, routingKey: string): Promise<void>;

  // 消息确认
  ack(message: Message): Promise<void>;
  nack(message: Message, requeue?: boolean): Promise<void>;
  reject(message: Message, requeue?: boolean): Promise<void>;
}

export interface MessageHandler {
  handle(message: Message): Promise<void>;
  onError?(error: Error, message: Message): Promise<void>;
}

export interface QueueOptions {
  durable?: boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
  deadLetterExchange?: string;
  messageTtl?: number;
  maxLength?: number;
}

export interface ExchangeOptions {
  durable?: boolean;
  autoDelete?: boolean;
  internal?: boolean;
}

export enum ExchangeType {
  DIRECT = 'direct',
  TOPIC = 'topic',
  FANOUT = 'fanout',
  HEADERS = 'headers'
}
```

### 2.2 RabbitMQ实现

```typescript
// implementations/rabbitmq.implementation.ts
import * as amqp from 'amqplib';

export class RabbitMQQueue implements MessageQueue {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private subscribers = new Map<string, MessageHandler>();

  constructor(private config: any) {}

  async connect(): Promise<void> {
    try {
      const connectionString = this.buildConnectionString();
      this.connection = await amqp.connect(connectionString);

      this.connection.on('error', this.handleConnectionError.bind(this));
      this.connection.on('close', this.handleConnectionClose.bind(this));

      this.channel = await this.connection.createChannel();

      // 设置预取数量，控制消费速率
      await this.channel.prefetch(10);

      console.log('RabbitMQ connected successfully');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }

    if (this.connection) {
      await this.connection.close();
      this.connection = null;
    }
  }

  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  async publish(exchange: string, routingKey: string, message: Message): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    const messageBuffer = Buffer.from(JSON.stringify(message.payload));
    const options: amqp.Options.Publish = {
      messageId: message.id,
      correlationId: message.correlationId,
      timestamp: message.timestamp.getTime(),
      headers: message.headers,
      persistent: true, // 消息持久化
      priority: message.priority,
      expiration: message.expiration?.toString()
    };

    const published = this.channel.publish(exchange, routingKey, messageBuffer, options);

    if (!published) {
      throw new Error('Failed to publish message to RabbitMQ');
    }
  }

  async publishBatch(exchange: string, messages: Array<{routingKey: string, message: Message}>): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    // 批量发布消息
    for (const { routingKey, message } of messages) {
      await this.publish(exchange, routingKey, message);
    }
  }

  async subscribe(queue: string, handler: MessageHandler): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    this.subscribers.set(queue, handler);

    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const message: Message = {
          id: msg.properties.messageId || '',
          type: msg.properties.type || '',
          payload: JSON.parse(msg.content.toString()),
          headers: msg.properties.headers as Record<string, string>,
          timestamp: new Date(msg.properties.timestamp || Date.now()),
          correlationId: msg.properties.correlationId,
          replyTo: msg.properties.replyTo
        };

        await handler.handle(message);
        this.channel!.ack(msg);

      } catch (error) {
        console.error(`Error processing message from queue ${queue}:`, error);

        if (handler.onError) {
          await handler.onError(error, {} as Message);
        }

        // 拒绝消息并重新排队
        this.channel!.nack(msg, false, true);
      }
    });
  }

  async declareQueue(queueName: string, options: QueueOptions = {}): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    const queueOptions: amqp.Options.AssertQueue = {
      durable: options.durable ?? true,
      exclusive: options.exclusive ?? false,
      autoDelete: options.autoDelete ?? false,
      arguments: {}
    };

    if (options.deadLetterExchange) {
      queueOptions.arguments!['x-dead-letter-exchange'] = options.deadLetterExchange;
    }

    if (options.messageTtl) {
      queueOptions.arguments!['x-message-ttl'] = options.messageTtl;
    }

    if (options.maxLength) {
      queueOptions.arguments!['x-max-length'] = options.maxLength;
    }

    await this.channel.assertQueue(queueName, queueOptions);
  }

  async declareExchange(exchangeName: string, type: ExchangeType, options: ExchangeOptions = {}): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    await this.channel.assertExchange(exchangeName, type, {
      durable: options.durable ?? true,
      autoDelete: options.autoDelete ?? false,
      internal: options.internal ?? false
    });
  }

  async bindQueue(queue: string, exchange: string, routingKey: string): Promise<void> {
    if (!this.channel) {
      throw new Error('Not connected to RabbitMQ');
    }

    await this.channel.bindQueue(queue, exchange, routingKey);
  }

  // 其他方法实现...
  async ack(message: Message): Promise<void> { /* 实现 */ }
  async nack(message: Message, requeue?: boolean): Promise<void> { /* 实现 */ }
  async reject(message: Message, requeue?: boolean): Promise<void> { /* 实现 */ }

  private buildConnectionString(): string {
    const { host, port, username, password, vhost, ssl } = this.config;
    const protocol = ssl ? 'amqps' : 'amqp';
    return `${protocol}://${username}:${password}@${host}:${port}${vhost}`;
  }

  private handleConnectionError(error: Error): void {
    console.error('RabbitMQ connection error:', error);
    // 实现重连逻辑
  }

  private handleConnectionClose(): void {
    console.warn('RabbitMQ connection closed');
    // 实现重连逻辑
  }
}
```

### 2.3 Kafka实现

```typescript
// implementations/kafka.implementation.ts
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

export class KafkaQueue implements MessageQueue {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers = new Map<string, Consumer>();

  constructor(private config: any) {
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      ssl: config.ssl
    });
  }

  async connect(): Promise<void> {
    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000
    });

    await this.producer.connect();
    console.log('Kafka producer connected');
  }

  async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      this.producer = null;
    }

    for (const [topic, consumer] of this.consumers) {
      await consumer.disconnect();
    }
    this.consumers.clear();
  }

  isConnected(): boolean {
    return this.producer !== null;
  }

  async publish(topic: string, partition: string, message: Message): Promise<void> {
    if (!this.producer) {
      throw new Error('Kafka producer not connected');
    }

    await this.producer.send({
      topic,
      messages: [{
        key: message.id,
        value: JSON.stringify(message.payload),
        partition: parseInt(partition) || undefined,
        headers: {
          ...message.headers,
          messageId: message.id,
          messageType: message.type,
          correlationId: message.correlationId || '',
          timestamp: message.timestamp.toISOString()
        }
      }]
    });
  }

  async publishBatch(topic: string, messages: Array<{routingKey: string, message: Message}>): Promise<void> {
    if (!this.producer) {
      throw new Error('Kafka producer not connected');
    }

    const kafkaMessages = messages.map(({ routingKey, message }) => ({
      key: message.id,
      value: JSON.stringify(message.payload),
      partition: parseInt(routingKey) || undefined,
      headers: {
        ...message.headers,
        messageId: message.id,
        messageType: message.type,
        correlationId: message.correlationId || '',
        timestamp: message.timestamp.toISOString()
      }
    }));

    await this.producer.send({
      topic,
      messages: kafkaMessages
    });
  }

  async subscribe(topic: string, handler: MessageHandler): Promise<void> {
    const groupId = `${this.config.clientId}-${topic}`;
    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message, partition }: EachMessagePayload) => {
        try {
          const headers = message.headers || {};
          const msg: Message = {
            id: headers.messageId?.toString() || '',
            type: headers.messageType?.toString() || '',
            payload: JSON.parse(message.value?.toString() || '{}'),
            headers: Object.fromEntries(
              Object.entries(headers).map(([k, v]) => [k, v?.toString() || ''])
            ),
            timestamp: new Date(headers.timestamp?.toString() || Date.now()),
            correlationId: headers.correlationId?.toString()
          };

          await handler.handle(msg);

        } catch (error) {
          console.error(`Error processing Kafka message from topic ${topic}:`, error);

          if (handler.onError) {
            await handler.onError(error, {} as Message);
          }
        }
      }
    });

    this.consumers.set(topic, consumer);
  }

  // Kafka不需要声明队列和交换机
  async declareQueue(): Promise<void> {}
  async declareExchange(): Promise<void> {}
  async bindQueue(): Promise<void> {}
  async ack(): Promise<void> {}
  async nack(): Promise<void> {}
  async reject(): Promise<void> {}
}
```

## 3. 队列管理器

### 3.1 队列配置管理

```typescript
// core/queue-manager.ts
interface QueueConfig {
  name: string;
  type: 'rabbitmq' | 'kafka' | 'redis';
  exchange?: string;
  routingKey?: string;
  options?: QueueOptions;
  deadLetterQueue?: string;
  retryQueue?: string;
}

class QueueManager {
  private queues = new Map<string, MessageQueue>();
  private configs = new Map<string, QueueConfig>();

  constructor() {
    this.loadQueueConfigs();
  }

  private loadQueueConfigs(): void {
    // 舆情数据采集队列
    this.addConfig('sentiment.collection', {
      name: 'sentiment_collection',
      type: 'rabbitmq',
      exchange: 'sentiment.events',
      routingKey: 'sentiment.collected',
      options: {
        durable: true,
        deadLetterExchange: 'sentiment.dlx',
        messageTtl: 86400000 // 24小时
      },
      deadLetterQueue: 'sentiment.collection.dlq'
    });

    // 舆情数据处理队列
    this.addConfig('sentiment.processing', {
      name: 'sentiment_processing',
      type: 'rabbitmq',
      exchange: 'sentiment.events',
      routingKey: 'sentiment.process',
      options: {
        durable: true,
        maxLength: 10000
      }
    });

    // 实时分析队列 (高吞吐量)
    this.addConfig('sentiment.analysis', {
      name: 'sentiment_analysis',
      type: 'kafka',
      routingKey: '0' // 分区
    });

    // 告警通知队列
    this.addConfig('alerts.notification', {
      name: 'alert_notifications',
      type: 'rabbitmq',
      exchange: 'alerts.events',
      routingKey: 'alert.triggered',
      options: {
        durable: true,
        deadLetterExchange: 'alerts.dlx'
      }
    });

    // 系统事件队列
    this.addConfig('system.events', {
      name: 'system_events',
      type: 'redis',
      routingKey: 'system'
    });
  }

  addConfig(id: string, config: QueueConfig): void {
    this.configs.set(id, config);
  }

  async getQueue(id: string): Promise<MessageQueue> {
    if (this.queues.has(id)) {
      return this.queues.get(id)!;
    }

    const config = this.configs.get(id);
    if (!config) {
      throw new Error(`Queue config not found: ${id}`);
    }

    const queue = await this.createQueue(config);
    this.queues.set(id, queue);

    return queue;
  }

  private async createQueue(config: QueueConfig): Promise<MessageQueue> {
    let queue: MessageQueue;

    switch (config.type) {
      case 'rabbitmq':
        queue = new RabbitMQQueue(MessageQueueConfig.primary);
        break;
      case 'kafka':
        queue = new KafkaQueue(MessageQueueConfig.streaming);
        break;
      case 'redis':
        queue = new RedisQueue(MessageQueueConfig.cache);
        break;
      default:
        throw new Error(`Unsupported queue type: ${config.type}`);
    }

    await queue.connect();

    // 声明队列和交换机
    if (config.exchange) {
      await queue.declareExchange(config.exchange, ExchangeType.TOPIC);
    }

    await queue.declareQueue(config.name, config.options);

    if (config.exchange && config.routingKey) {
      await queue.bindQueue(config.name, config.exchange, config.routingKey);
    }

    // 创建死信队列
    if (config.deadLetterQueue) {
      await queue.declareQueue(config.deadLetterQueue, { durable: true });
    }

    return queue;
  }

  async publishToQueue(queueId: string, message: Message): Promise<void> {
    const queue = await this.getQueue(queueId);
    const config = this.configs.get(queueId)!;

    await queue.publish(
      config.exchange || config.name,
      config.routingKey || '',
      message
    );
  }

  async subscribeToQueue(queueId: string, handler: MessageHandler): Promise<void> {
    const queue = await this.getQueue(queueId);
    const config = this.configs.get(queueId)!;

    await queue.subscribe(config.name, handler);
  }

  async shutdown(): Promise<void> {
    for (const [id, queue] of this.queues) {
      try {
        await queue.disconnect();
        console.log(`Queue ${id} disconnected`);
      } catch (error) {
        console.error(`Error disconnecting queue ${id}:`, error);
      }
    }

    this.queues.clear();
  }
}

export const queueManager = new QueueManager();
```

### 3.2 消息路由器

```typescript
// core/message-router.ts
interface RoutingRule {
  condition: (message: Message) => boolean;
  queues: string[];
  transform?: (message: Message) => Message;
}

class MessageRouter {
  private rules: RoutingRule[] = [];

  constructor() {
    this.setupRoutingRules();
  }

  private setupRoutingRules(): void {
    // 舆情数据路由规则
    this.addRule({
      condition: (msg) => msg.type === 'sentiment.collected',
      queues: ['sentiment.processing', 'sentiment.analysis'],
      transform: (msg) => ({
        ...msg,
        headers: {
          ...msg.headers,
          routed: 'true',
          routedAt: new Date().toISOString()
        }
      })
    });

    // 高优先级告警路由
    this.addRule({
      condition: (msg) =>
        msg.type === 'alert.triggered' &&
        msg.payload.severity === 'critical',
      queues: ['alerts.notification', 'alerts.escalation']
    });

    // 系统事件路由
    this.addRule({
      condition: (msg) => msg.type.startsWith('system.'),
      queues: ['system.events', 'monitoring.events']
    });

    // 负面情感快速处理
    this.addRule({
      condition: (msg) =>
        msg.type === 'sentiment.analyzed' &&
        msg.payload.sentiment?.label === 'negative',
      queues: ['sentiment.negative', 'alerts.evaluation']
    });
  }

  addRule(rule: RoutingRule): void {
    this.rules.push(rule);
  }

  async route(message: Message): Promise<void> {
    const matchingRules = this.rules.filter(rule => rule.condition(message));

    if (matchingRules.length === 0) {
      console.warn(`No routing rules matched for message type: ${message.type}`);
      return;
    }

    // 收集所有目标队列
    const targetQueues = new Set<string>();
    let transformedMessage = message;

    for (const rule of matchingRules) {
      rule.queues.forEach(queue => targetQueues.add(queue));

      if (rule.transform) {
        transformedMessage = rule.transform(transformedMessage);
      }
    }

    // 并行发送到所有目标队列
    const promises = Array.from(targetQueues).map(queueId =>
      queueManager.publishToQueue(queueId, transformedMessage)
    );

    await Promise.allSettled(promises);
  }
}

export const messageRouter = new MessageRouter();
```

## 4. 高级特性

### 4.1 消息重试机制

```typescript
// features/message-retry.ts
interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
  multiplier?: number;
}

class MessageRetryHandler {
  private retryPolicies = new Map<string, RetryPolicy>();

  constructor() {
    this.setupRetryPolicies();
  }

  private setupRetryPolicies(): void {
    // 舆情处理重试策略
    this.setRetryPolicy('sentiment.processing', {
      maxRetries: 3,
      backoffStrategy: 'exponential',
      initialDelay: 1000,
      maxDelay: 30000,
      multiplier: 2
    });

    // 告警通知重试策略
    this.setRetryPolicy('alerts.notification', {
      maxRetries: 5,
      backoffStrategy: 'linear',
      initialDelay: 2000,
      maxDelay: 10000
    });

    // 系统事件重试策略
    this.setRetryPolicy('system.events', {
      maxRetries: 1,
      backoffStrategy: 'fixed',
      initialDelay: 5000,
      maxDelay: 5000
    });
  }

  setRetryPolicy(queueId: string, policy: RetryPolicy): void {
    this.retryPolicies.set(queueId, policy);
  }

  async handleFailedMessage(queueId: string, message: Message, error: Error): Promise<void> {
    const policy = this.retryPolicies.get(queueId);
    if (!policy) {
      console.error(`No retry policy found for queue: ${queueId}`);
      await this.sendToDeadLetter(queueId, message, error);
      return;
    }

    const retryCount = (message.headers?.retryCount ? parseInt(message.headers.retryCount) : 0) + 1;

    if (retryCount > policy.maxRetries) {
      console.log(`Max retries exceeded for message ${message.id}, sending to dead letter`);
      await this.sendToDeadLetter(queueId, message, error);
      return;
    }

    const delay = this.calculateDelay(policy, retryCount);

    // 更新消息元数据
    const retryMessage: Message = {
      ...message,
      headers: {
        ...message.headers,
        retryCount: retryCount.toString(),
        lastError: error.message,
        retryAt: new Date(Date.now() + delay).toISOString()
      }
    };

    // 延迟重试
    setTimeout(async () => {
      try {
        await queueManager.publishToQueue(queueId, retryMessage);
        console.log(`Message ${message.id} scheduled for retry ${retryCount}/${policy.maxRetries}`);
      } catch (retryError) {
        console.error(`Failed to schedule retry for message ${message.id}:`, retryError);
        await this.sendToDeadLetter(queueId, message, retryError);
      }
    }, delay);
  }

  private calculateDelay(policy: RetryPolicy, attempt: number): number {
    let delay: number;

    switch (policy.backoffStrategy) {
      case 'linear':
        delay = policy.initialDelay * attempt;
        break;
      case 'exponential':
        delay = policy.initialDelay * Math.pow(policy.multiplier || 2, attempt - 1);
        break;
      case 'fixed':
      default:
        delay = policy.initialDelay;
        break;
    }

    return Math.min(delay, policy.maxDelay);
  }

  private async sendToDeadLetter(queueId: string, message: Message, error: Error): Promise<void> {
    const dlqMessage: Message = {
      ...message,
      type: 'dead_letter',
      headers: {
        ...message.headers,
        originalType: message.type,
        originalQueue: queueId,
        deadLetterReason: error.message,
        deadLetterAt: new Date().toISOString()
      }
    };

    try {
      await queueManager.publishToQueue('dead.letter.queue', dlqMessage);
      console.log(`Message ${message.id} sent to dead letter queue`);
    } catch (dlqError) {
      console.error(`Failed to send message to dead letter queue:`, dlqError);
    }
  }
}

export const messageRetryHandler = new MessageRetryHandler();
```

### 4.2 消息优先级处理

```typescript
// features/message-priority.ts
enum MessagePriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 8,
  CRITICAL = 10
}

class PriorityMessageHandler {
  private priorityQueues = new Map<number, Message[]>();
  private isProcessing = false;

  constructor() {
    this.startProcessing();
  }

  async addMessage(message: Message): Promise<void> {
    const priority = message.priority || MessagePriority.NORMAL;

    if (!this.priorityQueues.has(priority)) {
      this.priorityQueues.set(priority, []);
    }

    this.priorityQueues.get(priority)!.push(message);
  }

  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.isProcessing) {
      const message = this.getNextMessage();

      if (message) {
        await this.processMessage(message);
      } else {
        // 没有消息时等待一段时间
        await this.sleep(100);
      }
    }
  }

  private getNextMessage(): Message | null {
    // 从高优先级到低优先级查找消息
    const priorities = Array.from(this.priorityQueues.keys()).sort((a, b) => b - a);

    for (const priority of priorities) {
      const queue = this.priorityQueues.get(priority)!;
      if (queue.length > 0) {
        return queue.shift()!;
      }
    }

    return null;
  }

  private async processMessage(message: Message): Promise<void> {
    try {
      await messageRouter.route(message);
    } catch (error) {
      console.error(`Failed to process priority message ${message.id}:`, error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop(): void {
    this.isProcessing = false;
  }
}

export const priorityMessageHandler = new PriorityMessageHandler();
```

### 4.3 消息去重

```typescript
// features/message-deduplication.ts
interface DeduplicationConfig {
  windowSize: number; // 去重时间窗口 (ms)
  keyExtractor: (message: Message) => string;
  storage: 'memory' | 'redis';
}

class MessageDeduplicator {
  private memoryStore = new Map<string, number>();
  private redis: Redis;
  private configs = new Map<string, DeduplicationConfig>();

  constructor(redis: Redis) {
    this.redis = redis;
    this.setupConfigs();
    this.startCleanup();
  }

  private setupConfigs(): void {
    // 舆情数据去重
    this.setConfig('sentiment.collection', {
      windowSize: 3600000, // 1小时
      keyExtractor: (msg) => `${msg.payload.source}:${msg.payload.content_hash}`,
      storage: 'redis'
    });

    // 告警去重
    this.setConfig('alerts.notification', {
      windowSize: 1800000, // 30分钟
      keyExtractor: (msg) => `${msg.payload.alertType}:${msg.payload.entityId}`,
      storage: 'redis'
    });

    // 系统事件去重
    this.setConfig('system.events', {
      windowSize: 300000, // 5分钟
      keyExtractor: (msg) => `${msg.type}:${msg.payload.serviceId}`,
      storage: 'memory'
    });
  }

  setConfig(messageType: string, config: DeduplicationConfig): void {
    this.configs.set(messageType, config);
  }

  async isDuplicate(message: Message): Promise<boolean> {
    const config = this.configs.get(message.type);
    if (!config) {
      return false; // 没有配置则不去重
    }

    const key = config.keyExtractor(message);
    const now = Date.now();

    if (config.storage === 'redis') {
      return await this.checkRedisDeduplication(key, now, config.windowSize);
    } else {
      return this.checkMemoryDeduplication(key, now, config.windowSize);
    }
  }

  private async checkRedisDeduplication(key: string, now: number, windowSize: number): Promise<boolean> {
    const redisKey = `dedup:${key}`;
    const lastSeen = await this.redis.get(redisKey);

    if (lastSeen && (now - parseInt(lastSeen)) < windowSize) {
      return true; // 是重复消息
    }

    // 更新最后见到的时间
    await this.redis.setex(redisKey, Math.ceil(windowSize / 1000), now.toString());
    return false;
  }

  private checkMemoryDeduplication(key: string, now: number, windowSize: number): boolean {
    const lastSeen = this.memoryStore.get(key);

    if (lastSeen && (now - lastSeen) < windowSize) {
      return true; // 是重复消息
    }

    this.memoryStore.set(key, now);
    return false;
  }

  private startCleanup(): void {
    // 每5分钟清理一次过期的内存记录
    setInterval(() => {
      const now = Date.now();
      for (const [key, timestamp] of this.memoryStore.entries()) {
        if (now - timestamp > 3600000) { // 1小时过期
          this.memoryStore.delete(key);
        }
      }
    }, 300000);
  }
}

export const messageDeduplicator = new MessageDeduplicator(redisClient);
```

## 5. 监控与指标

### 5.1 队列监控

```typescript
// monitoring/queue-monitor.ts
interface QueueMetrics {
  messageCount: number;
  consumerCount: number;
  publishRate: number;
  consumeRate: number;
  avgProcessingTime: number;
  errorRate: number;
}

class QueueMonitor {
  private metrics = new Map<string, QueueMetrics>();
  private metricsHistory = new Map<string, QueueMetrics[]>();

  constructor(private metricsClient: MetricsClient) {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    setInterval(async () => {
      await this.collectMetrics();
      await this.publishMetrics();
    }, 30000); // 每30秒收集一次
  }

  private async collectMetrics(): Promise<void> {
    for (const [queueId] of queueManager.configs) {
      try {
        const metrics = await this.getQueueMetrics(queueId);
        this.metrics.set(queueId, metrics);

        // 保存历史数据
        if (!this.metricsHistory.has(queueId)) {
          this.metricsHistory.set(queueId, []);
        }

        const history = this.metricsHistory.get(queueId)!;
        history.push({ ...metrics, timestamp: Date.now() });

        // 只保留最近1小时的数据
        const oneHourAgo = Date.now() - 3600000;
        this.metricsHistory.set(queueId,
          history.filter(m => m.timestamp > oneHourAgo)
        );

      } catch (error) {
        console.error(`Failed to collect metrics for queue ${queueId}:`, error);
      }
    }
  }

  private async getQueueMetrics(queueId: string): Promise<QueueMetrics> {
    const queue = await queueManager.getQueue(queueId);

    // 这里需要根据具体的队列实现来获取指标
    // 以下是示例实现
    return {
      messageCount: await this.getMessageCount(queueId),
      consumerCount: await this.getConsumerCount(queueId),
      publishRate: this.calculatePublishRate(queueId),
      consumeRate: this.calculateConsumeRate(queueId),
      avgProcessingTime: this.calculateAvgProcessingTime(queueId),
      errorRate: this.calculateErrorRate(queueId)
    };
  }

  private async publishMetrics(): Promise<void> {
    for (const [queueId, metrics] of this.metrics) {
      const tags = { queue: queueId };

      this.metricsClient.gauge('queue.message_count', metrics.messageCount, tags);
      this.metricsClient.gauge('queue.consumer_count', metrics.consumerCount, tags);
      this.metricsClient.gauge('queue.publish_rate', metrics.publishRate, tags);
      this.metricsClient.gauge('queue.consume_rate', metrics.consumeRate, tags);
      this.metricsClient.gauge('queue.avg_processing_time', metrics.avgProcessingTime, tags);
      this.metricsClient.gauge('queue.error_rate', metrics.errorRate, tags);
    }
  }

  getMetrics(queueId: string): QueueMetrics | null {
    return this.metrics.get(queueId) || null;
  }

  getMetricsHistory(queueId: string): QueueMetrics[] {
    return this.metricsHistory.get(queueId) || [];
  }

  // 其他辅助方法...
  private async getMessageCount(queueId: string): Promise<number> { /* 实现 */ }
  private async getConsumerCount(queueId: string): Promise<number> { /* 实现 */ }
  private calculatePublishRate(queueId: string): number { /* 实现 */ }
  private calculateConsumeRate(queueId: string): number { /* 实现 */ }
  private calculateAvgProcessingTime(queueId: string): number { /* 实现 */ }
  private calculateErrorRate(queueId: string): number { /* 实现 */ }
}

export const queueMonitor = new QueueMonitor(metricsClient);
```

### 5.2 告警规则

```typescript
// monitoring/queue-alerts.ts
interface AlertRule {
  name: string;
  condition: (metrics: QueueMetrics) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // 冷却时间，避免重复告警
}

class QueueAlertManager {
  private rules: AlertRule[] = [];
  private lastAlertTime = new Map<string, number>();

  constructor() {
    this.setupAlertRules();
    this.startAlerting();
  }

  private setupAlertRules(): void {
    // 消息积压告警
    this.addRule({
      name: 'high_message_count',
      condition: (metrics) => metrics.messageCount > 1000,
      severity: 'high',
      cooldown: 300000 // 5分钟
    });

    // 错误率告警
    this.addRule({
      name: 'high_error_rate',
      condition: (metrics) => metrics.errorRate > 0.1, // 10%
      severity: 'critical',
      cooldown: 180000 // 3分钟
    });

    // 处理时间过长告警
    this.addRule({
      name: 'slow_processing',
      condition: (metrics) => metrics.avgProcessingTime > 30000, // 30秒
      severity: 'medium',
      cooldown: 600000 // 10分钟
    });

    // 消费者离线告警
    this.addRule({
      name: 'no_consumers',
      condition: (metrics) => metrics.consumerCount === 0 && metrics.messageCount > 0,
      severity: 'critical',
      cooldown: 60000 // 1分钟
    });
  }

  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  private startAlerting(): void {
    setInterval(() => {
      this.checkAlerts();
    }, 60000); // 每分钟检查一次
  }

  private async checkAlerts(): Promise<void> {
    for (const [queueId, metrics] of queueMonitor.metrics) {
      for (const rule of this.rules) {
        if (rule.condition(metrics)) {
          await this.triggerAlert(queueId, rule, metrics);
        }
      }
    }
  }

  private async triggerAlert(queueId: string, rule: AlertRule, metrics: QueueMetrics): Promise<void> {
    const alertKey = `${queueId}:${rule.name}`;
    const now = Date.now();
    const lastAlert = this.lastAlertTime.get(alertKey) || 0;

    // 检查冷却时间
    if (now - lastAlert < rule.cooldown) {
      return;
    }

    this.lastAlertTime.set(alertKey, now);

    const alert = {
      id: generateId(),
      type: 'queue.alert',
      source: 'queue-monitor',
      timestamp: new Date(),
      version: '1.0.0',
      data: {
        queueId,
        ruleName: rule.name,
        severity: rule.severity,
        metrics,
        message: this.generateAlertMessage(queueId, rule, metrics)
      }
    };

    // 发布告警事件
    await eventBus.publish(alert);
    console.log(`Queue alert triggered: ${alertKey}`);
  }

  private generateAlertMessage(queueId: string, rule: AlertRule, metrics: QueueMetrics): string {
    switch (rule.name) {
      case 'high_message_count':
        return `Queue ${queueId} has ${metrics.messageCount} pending messages`;
      case 'high_error_rate':
        return `Queue ${queueId} error rate is ${(metrics.errorRate * 100).toFixed(2)}%`;
      case 'slow_processing':
        return `Queue ${queueId} average processing time is ${metrics.avgProcessingTime}ms`;
      case 'no_consumers':
        return `Queue ${queueId} has no active consumers with ${metrics.messageCount} pending messages`;
      default:
        return `Queue ${queueId} triggered alert: ${rule.name}`;
    }
  }
}

export const queueAlertManager = new QueueAlertManager();
```

通过这套消息队列集成方案，我们实现了：

1. **统一接口**: 支持多种消息队列的统一抽象
2. **智能路由**: 基于规则的消息路由和分发
3. **可靠性保障**: 重试机制、死信队列、去重处理
4. **性能优化**: 优先级处理、批量操作、连接池
5. **完整监控**: 队列指标收集、告警规则、链路追踪

这为事件驱动架构提供了坚实的消息传递基础设施。