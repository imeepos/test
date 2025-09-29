# 事件驱动架构设计

## 1. 核心概念

事件驱动架构通过异步事件传递实现服务间的松耦合通信，提高系统的可扩展性和响应性。

### 1.1 设计原则

- **事件优先**: 业务状态变更通过事件传播
- **最终一致性**: 接受数据的最终一致性
- **幂等性**: 事件处理支持重试和去重
- **可观测性**: 完整的事件链路追踪

## 2. 事件架构体系

### 2.1 事件分类

```typescript
// types/events.ts
export enum EventCategory {
  DOMAIN = 'domain',      // 领域事件
  INTEGRATION = 'integration', // 集成事件
  SYSTEM = 'system',      // 系统事件
  NOTIFICATION = 'notification' // 通知事件
}

export enum EventType {
  // 舆情相关事件
  SENTIMENT_COLLECTED = 'sentiment.collected',
  SENTIMENT_PROCESSED = 'sentiment.processed',
  SENTIMENT_ANALYZED = 'sentiment.analyzed',
  SENTIMENT_CLASSIFIED = 'sentiment.classified',

  // 预警相关事件
  ALERT_TRIGGERED = 'alert.triggered',
  ALERT_RESOLVED = 'alert.resolved',
  ALERT_ESCALATED = 'alert.escalated',

  // 用户相关事件
  USER_LOGGED_IN = 'user.logged_in',
  USER_PERMISSION_CHANGED = 'user.permission_changed',

  // 系统事件
  SERVICE_STARTED = 'service.started',
  SERVICE_STOPPED = 'service.stopped',
  HEALTH_CHECK_FAILED = 'health.check_failed'
}
```

### 2.2 事件总线设计

```typescript
// core/event-bus.ts
interface Event {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  version: string;
  data: any;
  metadata?: Record<string, any>;
  correlationId?: string;
  causationId?: string;
}

interface EventHandler<T = any> {
  handle(event: Event<T>): Promise<void>;
  canHandle(event: Event): boolean;
  priority?: number;
}

class EventBus {
  private handlers = new Map<string, EventHandler[]>();
  private middlewares: EventMiddleware[] = [];
  private eventStore: EventStore;
  private messageQueue: MessageQueue;

  constructor(eventStore: EventStore, messageQueue: MessageQueue) {
    this.eventStore = eventStore;
    this.messageQueue = messageQueue;
  }

  // 注册事件处理器
  subscribe<T>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const handlers = this.handlers.get(eventType)!;
    handlers.push(handler);

    // 按优先级排序
    handlers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  // 发布事件
  async publish(event: Event): Promise<void> {
    // 应用中间件
    const processedEvent = await this.applyMiddlewares(event);

    // 存储事件
    await this.eventStore.append(processedEvent);

    // 本地处理
    await this.handleLocal(processedEvent);

    // 发布到消息队列
    await this.messageQueue.publish(processedEvent);
  }

  // 本地事件处理
  private async handleLocal(event: Event): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];

    const handlerPromises = handlers
      .filter(handler => handler.canHandle(event))
      .map(handler => this.executeHandler(handler, event));

    await Promise.allSettled(handlerPromises);
  }

  private async executeHandler(handler: EventHandler, event: Event): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      console.error(`Handler failed for event ${event.type}:`, error);

      // 发布错误事件
      await this.publish({
        id: generateId(),
        type: 'handler.failed',
        source: 'event-bus',
        timestamp: new Date(),
        version: '1.0.0',
        data: {
          originalEvent: event,
          handler: handler.constructor.name,
          error: error.message
        }
      });
    }
  }

  private async applyMiddlewares(event: Event): Promise<Event> {
    let processedEvent = event;

    for (const middleware of this.middlewares) {
      processedEvent = await middleware.process(processedEvent);
    }

    return processedEvent;
  }

  // 添加中间件
  use(middleware: EventMiddleware): void {
    this.middlewares.push(middleware);
  }
}
```

### 2.3 事件存储

```typescript
// core/event-store.ts
interface EventStoreRecord {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  eventData: any;
  metadata: any;
  version: number;
  timestamp: Date;
}

class EventStore {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async append(event: Event): Promise<void> {
    const record: EventStoreRecord = {
      id: event.id,
      aggregateId: event.metadata?.aggregateId || event.id,
      aggregateType: event.metadata?.aggregateType || 'unknown',
      eventType: event.type,
      eventData: event.data,
      metadata: event.metadata || {},
      version: parseInt(event.version.split('.')[0]),
      timestamp: event.timestamp
    };

    await this.db.collection('events').insertOne(record);
  }

  async getEvents(aggregateId: string, fromVersion?: number): Promise<Event[]> {
    const query: any = { aggregateId };

    if (fromVersion !== undefined) {
      query.version = { $gte: fromVersion };
    }

    const records = await this.db
      .collection('events')
      .find(query)
      .sort({ version: 1 })
      .toArray();

    return records.map(this.recordToEvent);
  }

  async getEventsByType(eventType: string, limit = 100): Promise<Event[]> {
    const records = await this.db
      .collection('events')
      .find({ eventType })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return records.map(this.recordToEvent);
  }

  private recordToEvent(record: EventStoreRecord): Event {
    return {
      id: record.id,
      type: record.eventType,
      source: record.metadata.source || 'unknown',
      timestamp: record.timestamp,
      version: `${record.version}.0.0`,
      data: record.eventData,
      metadata: record.metadata
    };
  }

  // 事件回放
  async replay(aggregateId: string, toVersion?: number): Promise<any> {
    const events = await this.getEvents(aggregateId);

    const filteredEvents = toVersion
      ? events.filter(e => parseInt(e.version.split('.')[0]) <= toVersion)
      : events;

    // 根据事件重建聚合状态
    return this.rebuildAggregate(filteredEvents);
  }

  private rebuildAggregate(events: Event[]): any {
    // 事件溯源重建逻辑
    const state = {};

    for (const event of events) {
      this.applyEvent(state, event);
    }

    return state;
  }

  private applyEvent(state: any, event: Event): void {
    // 根据事件类型应用状态变更
    switch (event.type) {
      case EventType.SENTIMENT_COLLECTED:
        // 应用采集事件
        break;
      case EventType.SENTIMENT_ANALYZED:
        // 应用分析事件
        break;
      // ... 其他事件类型
    }
  }
}
```

## 3. 事件中间件

### 3.1 验证中间件

```typescript
// middleware/validation.middleware.ts
class EventValidationMiddleware implements EventMiddleware {
  async process(event: Event): Promise<Event> {
    // 基础字段验证
    if (!event.id || !event.type || !event.source) {
      throw new Error('Event missing required fields');
    }

    // Schema验证
    const schema = schemaRegistry.get(`${event.type}Event`);
    if (schema) {
      try {
        schema.parse(event);
      } catch (error) {
        throw new Error(`Event validation failed: ${error.message}`);
      }
    }

    return event;
  }
}
```

### 3.2 丰富化中间件

```typescript
// middleware/enrichment.middleware.ts
class EventEnrichmentMiddleware implements EventMiddleware {
  async process(event: Event): Promise<Event> {
    const enrichedEvent = { ...event };

    // 添加追踪ID
    if (!enrichedEvent.correlationId) {
      enrichedEvent.correlationId = generateTraceId();
    }

    // 添加时间戳
    if (!enrichedEvent.timestamp) {
      enrichedEvent.timestamp = new Date();
    }

    // 添加服务信息
    enrichedEvent.metadata = {
      ...enrichedEvent.metadata,
      serviceId: process.env.SERVICE_ID,
      serviceVersion: process.env.SERVICE_VERSION,
      hostname: os.hostname(),
      environment: process.env.NODE_ENV
    };

    return enrichedEvent;
  }
}
```

### 3.3 重试中间件

```typescript
// middleware/retry.middleware.ts
class EventRetryMiddleware implements EventMiddleware {
  private retryStore: RetryStore;
  private maxRetries = 3;
  private retryDelays = [1000, 5000, 15000]; // ms

  constructor(retryStore: RetryStore) {
    this.retryStore = retryStore;
  }

  async process(event: Event): Promise<Event> {
    const retryInfo = await this.retryStore.getRetryInfo(event.id);

    if (retryInfo) {
      event.metadata = {
        ...event.metadata,
        retryCount: retryInfo.retryCount,
        lastRetryAt: retryInfo.lastRetryAt,
        isRetry: true
      };
    }

    return event;
  }

  async scheduleRetry(event: Event, error: Error): Promise<void> {
    const retryInfo = await this.retryStore.getRetryInfo(event.id) || {
      eventId: event.id,
      retryCount: 0,
      lastRetryAt: null,
      errors: []
    };

    retryInfo.retryCount++;
    retryInfo.lastRetryAt = new Date();
    retryInfo.errors.push({
      message: error.message,
      timestamp: new Date()
    });

    if (retryInfo.retryCount <= this.maxRetries) {
      const delay = this.retryDelays[retryInfo.retryCount - 1] || 15000;

      await this.retryStore.saveRetryInfo(retryInfo);

      // 调度延迟重试
      setTimeout(async () => {
        await eventBus.publish(event);
      }, delay);
    } else {
      // 超过最大重试次数，发送到死信队列
      await this.sendToDeadLetterQueue(event, retryInfo.errors);
    }
  }

  private async sendToDeadLetterQueue(event: Event, errors: any[]): Promise<void> {
    const dlqEvent = {
      ...event,
      type: 'dead_letter',
      metadata: {
        ...event.metadata,
        originalType: event.type,
        failures: errors,
        deadLetterAt: new Date()
      }
    };

    await eventBus.publish(dlqEvent);
  }
}
```

## 4. 事件处理器

### 4.1 舆情处理器

```typescript
// handlers/sentiment.handler.ts
@EventHandler(EventType.SENTIMENT_COLLECTED)
class SentimentCollectedHandler implements EventHandler {
  priority = 100;

  constructor(
    private processorService: ProcessorService,
    private notificationService: NotificationService
  ) {}

  canHandle(event: Event): boolean {
    return event.type === EventType.SENTIMENT_COLLECTED;
  }

  async handle(event: Event): Promise<void> {
    const { data } = event;

    try {
      // 1. 数据清洗
      const cleanedData = await this.processorService.cleanData(data);

      // 2. 发布数据处理事件
      await eventBus.publish({
        id: generateId(),
        type: EventType.SENTIMENT_PROCESSED,
        source: 'sentiment-handler',
        timestamp: new Date(),
        version: '1.0.0',
        data: cleanedData,
        correlationId: event.correlationId,
        causationId: event.id
      });

      // 3. 发送处理通知
      await this.notificationService.notifyProcessingComplete(data.id);

    } catch (error) {
      console.error('Failed to process sentiment:', error);
      throw error;
    }
  }
}

@EventHandler(EventType.SENTIMENT_PROCESSED)
class SentimentProcessedHandler implements EventHandler {
  priority = 90;

  constructor(
    private sentimentService: SentimentService,
    private mlService: MLService
  ) {}

  canHandle(event: Event): boolean {
    return event.type === EventType.SENTIMENT_PROCESSED;
  }

  async handle(event: Event): Promise<void> {
    const { data } = event;

    // 并行执行情感分析
    const [sentimentResult, keywordResult] = await Promise.all([
      this.mlService.analyzeSentiment(data.content),
      this.mlService.extractKeywords(data.content)
    ]);

    const analyzedData = {
      ...data,
      sentiment: sentimentResult,
      keywords: keywordResult
    };

    // 保存分析结果
    await this.sentimentService.save(analyzedData);

    // 发布分析完成事件
    await eventBus.publish({
      id: generateId(),
      type: EventType.SENTIMENT_ANALYZED,
      source: 'sentiment-processor',
      timestamp: new Date(),
      version: '1.0.0',
      data: analyzedData,
      correlationId: event.correlationId,
      causationId: event.id
    });
  }
}
```

### 4.2 预警处理器

```typescript
// handlers/alert.handler.ts
@EventHandler(EventType.SENTIMENT_ANALYZED)
class AlertEvaluationHandler implements EventHandler {
  priority = 80;

  constructor(
    private alertService: AlertService,
    private ruleEngine: RuleEngine
  ) {}

  canHandle(event: Event): boolean {
    return event.type === EventType.SENTIMENT_ANALYZED;
  }

  async handle(event: Event): Promise<void> {
    const { data } = event;

    // 获取所有活跃的预警规则
    const activeRules = await this.alertService.getActiveRules();

    for (const rule of activeRules) {
      const shouldTrigger = await this.ruleEngine.evaluate(rule, data);

      if (shouldTrigger) {
        const alert = await this.alertService.createAlert(rule, data);

        // 发布预警触发事件
        await eventBus.publish({
          id: generateId(),
          type: EventType.ALERT_TRIGGERED,
          source: 'alert-evaluator',
          timestamp: new Date(),
          version: '1.0.0',
          data: {
            alertId: alert.id,
            ruleId: rule.id,
            sentimentId: data.id,
            severity: alert.severity,
            message: alert.message
          },
          correlationId: event.correlationId
        });
      }
    }
  }
}

@EventHandler(EventType.ALERT_TRIGGERED)
class AlertNotificationHandler implements EventHandler {
  priority = 70;

  constructor(
    private notificationService: NotificationService,
    private escalationService: EscalationService
  ) {}

  canHandle(event: Event): boolean {
    return event.type === EventType.ALERT_TRIGGERED;
  }

  async handle(event: Event): Promise<void> {
    const { data } = event;

    // 根据严重程度选择通知渠道
    const channels = this.getNotificationChannels(data.severity);

    // 并行发送通知
    await Promise.all(
      channels.map(channel =>
        this.notificationService.send(channel, data)
      )
    );

    // 如果是高级别告警，启动升级流程
    if (data.severity === 'critical') {
      await this.escalationService.start(data.alertId);
    }
  }

  private getNotificationChannels(severity: string): string[] {
    switch (severity) {
      case 'critical':
        return ['email', 'sms', 'webhook', 'wechat'];
      case 'high':
        return ['email', 'webhook', 'wechat'];
      case 'medium':
        return ['email', 'webhook'];
      default:
        return ['email'];
    }
  }
}
```

## 5. 事件投影

### 5.1 实时统计投影

```typescript
// projections/real-time-stats.projection.ts
class RealTimeStatsProjection implements EventHandler {
  priority = 50;

  constructor(
    private redis: Redis,
    private timeWindow: number = 3600000 // 1小时
  ) {}

  canHandle(event: Event): boolean {
    return [
      EventType.SENTIMENT_ANALYZED,
      EventType.ALERT_TRIGGERED
    ].includes(event.type as EventType);
  }

  async handle(event: Event): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.timeWindow;

    switch (event.type) {
      case EventType.SENTIMENT_ANALYZED:
        await this.updateSentimentStats(event.data, windowStart, now);
        break;

      case EventType.ALERT_TRIGGERED:
        await this.updateAlertStats(event.data, windowStart, now);
        break;
    }
  }

  private async updateSentimentStats(data: any, windowStart: number, now: number): Promise<void> {
    const pipeline = this.redis.pipeline();

    // 按情感类型统计
    pipeline.zincrby(`sentiment:${data.sentiment.label}`, 1, now);

    // 按平台统计
    pipeline.zincrby(`platform:${data.platform}`, 1, now);

    // 按关键词统计
    for (const keyword of data.keywords) {
      pipeline.zincrby(`keyword:${keyword}`, 1, now);
    }

    // 清理过期数据
    pipeline.zremrangebyscore(`sentiment:${data.sentiment.label}`, 0, windowStart);
    pipeline.zremrangebyscore(`platform:${data.platform}`, 0, windowStart);

    await pipeline.exec();
  }

  private async updateAlertStats(data: any, windowStart: number, now: number): Promise<void> {
    const pipeline = this.redis.pipeline();

    // 按严重程度统计
    pipeline.zincrby(`alerts:${data.severity}`, 1, now);

    // 总告警数量
    pipeline.zincrby('alerts:total', 1, now);

    // 清理过期数据
    pipeline.zremrangebyscore(`alerts:${data.severity}`, 0, windowStart);
    pipeline.zremrangebyscore('alerts:total', 0, windowStart);

    await pipeline.exec();
  }
}
```

### 5.2 搜索索引投影

```typescript
// projections/search-index.projection.ts
class SearchIndexProjection implements EventHandler {
  priority = 40;

  constructor(
    private elasticsearchClient: Client
  ) {}

  canHandle(event: Event): boolean {
    return event.type === EventType.SENTIMENT_ANALYZED;
  }

  async handle(event: Event): Promise<void> {
    const { data } = event;

    const document = {
      id: data.id,
      content: data.content,
      source: data.source,
      platform: data.platform,
      author: data.author,
      publishTime: data.publishTime,
      sentiment: data.sentiment,
      keywords: data.keywords,
      category: data.category,
      indexedAt: new Date()
    };

    await this.elasticsearchClient.index({
      index: 'sentiments',
      id: data.id,
      body: document
    });
  }
}
```

## 6. 事件监控与观测

### 6.1 事件指标收集

```typescript
// monitoring/event-metrics.ts
class EventMetricsCollector implements EventHandler {
  priority = 10; // 低优先级，确保在其他处理器之后执行

  constructor(
    private metricsClient: MetricsClient
  ) {}

  canHandle(event: Event): boolean {
    return true; // 处理所有事件
  }

  async handle(event: Event): Promise<void> {
    // 事件计数
    this.metricsClient.increment('events.processed', {
      type: event.type,
      source: event.source
    });

    // 事件延迟
    const latency = Date.now() - event.timestamp.getTime();
    this.metricsClient.histogram('events.latency', latency, {
      type: event.type
    });

    // 事件大小
    const eventSize = JSON.stringify(event).length;
    this.metricsClient.histogram('events.size', eventSize, {
      type: event.type
    });

    // 错误率监控
    if (event.metadata?.isRetry) {
      this.metricsClient.increment('events.retries', {
        type: event.type,
        retryCount: event.metadata.retryCount
      });
    }
  }
}
```

### 6.2 事件链路追踪

```typescript
// monitoring/event-tracing.ts
class EventTracingMiddleware implements EventMiddleware {
  constructor(
    private tracer: Tracer
  ) {}

  async process(event: Event): Promise<Event> {
    // 创建或继续追踪链路
    const span = this.tracer.startSpan(`event.${event.type}`, {
      tags: {
        'event.id': event.id,
        'event.type': event.type,
        'event.source': event.source,
        'event.correlation_id': event.correlationId
      }
    });

    // 如果是因果关系事件，建立父子关系
    if (event.causationId) {
      const parentSpan = this.tracer.getSpan(event.causationId);
      if (parentSpan) {
        span.setParent(parentSpan);
      }
    }

    // 将追踪信息添加到事件元数据
    event.metadata = {
      ...event.metadata,
      traceId: span.context().traceId,
      spanId: span.context().spanId
    };

    return event;
  }
}
```

## 7. 性能优化

### 7.1 事件批处理

```typescript
// optimization/event-batching.ts
class EventBatcher {
  private batches = new Map<string, Event[]>();
  private timers = new Map<string, NodeJS.Timeout>();
  private batchSize = 10;
  private batchTimeout = 1000; // ms

  async addEvent(event: Event): Promise<void> {
    const batchKey = this.getBatchKey(event);

    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, []);
    }

    const batch = this.batches.get(batchKey)!;
    batch.push(event);

    // 如果达到批次大小，立即处理
    if (batch.length >= this.batchSize) {
      await this.processBatch(batchKey);
      return;
    }

    // 设置超时处理
    if (!this.timers.has(batchKey)) {
      const timer = setTimeout(() => {
        this.processBatch(batchKey);
      }, this.batchTimeout);

      this.timers.set(batchKey, timer);
    }
  }

  private async processBatch(batchKey: string): Promise<void> {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.length === 0) return;

    // 清理定时器
    const timer = this.timers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(batchKey);
    }

    // 处理批次
    try {
      await this.processEvents(batch);
    } catch (error) {
      console.error('Batch processing failed:', error);
      // 可以选择重新排队或发送到错误处理
    } finally {
      this.batches.delete(batchKey);
    }
  }

  private getBatchKey(event: Event): string {
    // 根据事件类型和其他属性生成批次键
    return `${event.type}:${event.source}`;
  }

  private async processEvents(events: Event[]): Promise<void> {
    // 批量处理事件
    console.log(`Processing batch of ${events.length} events`);

    // 这里可以实现批量写入数据库、批量发送通知等
    await Promise.all(events.map(event => eventBus.handleLocal(event)));
  }
}
```

### 7.2 事件去重

```typescript
// optimization/event-deduplication.ts
class EventDeduplicator implements EventMiddleware {
  private redis: Redis;
  private ttl = 3600; // 1小时

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async process(event: Event): Promise<Event> {
    const key = this.getDeduplicationKey(event);

    // 检查是否已存在
    const exists = await this.redis.exists(key);
    if (exists) {
      throw new DuplicateEventError(`Event ${event.id} already processed`);
    }

    // 标记为已处理
    await this.redis.setex(key, this.ttl, '1');

    return event;
  }

  private getDeduplicationKey(event: Event): string {
    // 基于事件ID和内容哈希生成去重键
    const contentHash = crypto
      .createHash('md5')
      .update(JSON.stringify(event.data))
      .digest('hex');

    return `event:${event.id}:${contentHash}`;
  }
}

class DuplicateEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateEventError';
  }
}
```

通过这套事件驱动架构，我们实现了：

1. **解耦服务**: 通过异步事件传递实现服务间松耦合
2. **可扩展性**: 新的事件处理器可以独立添加
3. **可观测性**: 完整的事件链路追踪和监控
4. **可靠性**: 事件存储、重试机制和死信队列
5. **性能优化**: 事件批处理、去重和并发处理

这为系统提供了强大的事件处理能力，支持复杂的业务场景和高并发需求。