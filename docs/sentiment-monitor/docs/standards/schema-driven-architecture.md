# 规范驱动架构设计

## 1. 核心概念

规范驱动架构通过定义明确的数据规范和接口契约，确保系统各组件之间的一致性和可维护性。

### 1.1 设计原则

- **Schema First**: 先定义数据规范，再实现业务逻辑
- **契约优先**: API接口先定义OpenAPI规范
- **类型安全**: 从Schema自动生成TypeScript类型
- **版本管理**: Schema版本化管理，向后兼容

## 2. Schema管理体系

### 2.1 核心Schema定义

```typescript
// schemas/core/base.schema.ts
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  version: z.number().int().positive()
});

// schemas/core/sentiment.schema.ts
export const SentimentDataSchema = BaseEntitySchema.extend({
  source: z.string().min(1),
  platform: z.enum(['weibo', 'wechat', 'news', 'forum']),
  content: z.string().min(1),
  author: z.string().optional(),
  publishTime: z.date(),
  sentiment: z.object({
    score: z.number().min(-1).max(1),
    label: z.enum(['positive', 'negative', 'neutral']),
    confidence: z.number().min(0).max(1)
  }),
  keywords: z.array(z.string()),
  category: z.string(),
  metadata: z.record(z.any())
});

export type SentimentData = z.infer<typeof SentimentDataSchema>;
```

### 2.2 事件Schema定义

```typescript
// schemas/events/base-event.schema.ts
export const BaseEventSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  source: z.string(),
  timestamp: z.date(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  correlationId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional()
});

// schemas/events/sentiment-events.schema.ts
export const SentimentCollectedEventSchema = BaseEventSchema.extend({
  type: z.literal('sentiment.collected'),
  data: SentimentDataSchema.pick({
    source: true,
    platform: true,
    content: true,
    publishTime: true
  })
});

export const SentimentAnalyzedEventSchema = BaseEventSchema.extend({
  type: z.literal('sentiment.analyzed'),
  data: SentimentDataSchema
});

export const SentimentAlertEventSchema = BaseEventSchema.extend({
  type: z.literal('sentiment.alert'),
  data: z.object({
    sentimentId: z.string().uuid(),
    alertType: z.enum(['negative_surge', 'volume_spike', 'keyword_trend']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    threshold: z.number(),
    currentValue: z.number(),
    affectedKeywords: z.array(z.string())
  })
});
```

### 2.3 API Schema定义

```typescript
// schemas/api/sentiment-api.schema.ts
export const GetSentimentsRequestSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    platform: z.enum(['weibo', 'wechat', 'news', 'forum']).optional(),
    sentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    keywords: z.string().optional()
  })
});

export const GetSentimentsResponseSchema = z.object({
  data: z.array(SentimentDataSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number()
  }),
  filters: z.object({
    appliedFilters: z.record(z.any()),
    availableFilters: z.record(z.array(z.string()))
  })
});
```

## 3. Schema驱动代码生成

### 3.1 类型生成工具

```typescript
// scripts/generate-types.ts
import { writeFileSync } from 'fs';
import { zodToJsonSchema } from 'zod-to-json-schema';
import * as schemas from '../schemas';

function generateTypes() {
  const typeDefinitions = Object.entries(schemas)
    .map(([name, schema]) => {
      const jsonSchema = zodToJsonSchema(schema);
      return `export type ${name.replace('Schema', '')} = z.infer<typeof ${name}>;`;
    })
    .join('\n');

  writeFileSync('./src/types/generated.ts', typeDefinitions);
}

generateTypes();
```

### 3.2 API客户端生成

```typescript
// scripts/generate-api-client.ts
import { generateApi } from '@rtk-query/codegen-openapi';

async function generateApiClient() {
  await generateApi({
    schemaFile: './schemas/openapi.yaml',
    apiFile: './src/api/base-api.ts',
    apiImport: 'baseApi',
    outputFile: './src/api/generated-api.ts',
    exportName: 'sentimentApi',
    hooks: true
  });
}

generateApiClient();
```

## 4. 规范验证中间件

### 4.1 请求验证中间件

```typescript
// middleware/schema-validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validateSchema(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      next(error);
    }
  };
}
```

### 4.2 事件验证装饰器

```typescript
// decorators/event-validation.decorator.ts
import { ZodSchema } from 'zod';

export function ValidateEvent(schema: ZodSchema) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const [event] = args;
      try {
        const validatedEvent = schema.parse(event);
        return originalMethod.call(this, validatedEvent, ...args.slice(1));
      } catch (error) {
        console.error(`Event validation failed for ${propertyKey}:`, error);
        throw new Error(`Invalid event schema: ${error.message}`);
      }
    };

    return descriptor;
  };
}
```

## 5. Schema注册中心

### 5.1 Schema Registry实现

```typescript
// core/schema-registry.ts
class SchemaRegistry {
  private schemas = new Map<string, {
    schema: ZodSchema;
    version: string;
    metadata: Record<string, any>;
  }>();

  register(name: string, schema: ZodSchema, version: string, metadata = {}) {
    const key = `${name}@${version}`;
    this.schemas.set(key, { schema, version, metadata });

    // 设置默认版本
    this.schemas.set(name, { schema, version, metadata });
  }

  get(name: string, version?: string): ZodSchema | null {
    const key = version ? `${name}@${version}` : name;
    return this.schemas.get(key)?.schema || null;
  }

  validate(name: string, data: any, version?: string): any {
    const schema = this.get(name, version);
    if (!schema) {
      throw new Error(`Schema not found: ${name}${version ? `@${version}` : ''}`);
    }
    return schema.parse(data);
  }

  getVersions(name: string): string[] {
    return Array.from(this.schemas.keys())
      .filter(key => key.startsWith(`${name}@`))
      .map(key => key.split('@')[1])
      .sort();
  }
}

export const schemaRegistry = new SchemaRegistry();

// 注册所有Schema
import * as schemas from '../schemas';

Object.entries(schemas).forEach(([name, schema]) => {
  schemaRegistry.register(name, schema, '1.0.0');
});
```

### 5.2 Schema版本管理

```typescript
// core/schema-version-manager.ts
interface SchemaVersion {
  version: string;
  schema: ZodSchema;
  deprecated?: boolean;
  migration?: (oldData: any) => any;
}

class SchemaVersionManager {
  private versions = new Map<string, SchemaVersion[]>();

  addVersion(schemaName: string, version: SchemaVersion) {
    if (!this.versions.has(schemaName)) {
      this.versions.set(schemaName, []);
    }
    this.versions.get(schemaName)!.push(version);
    this.sortVersions(schemaName);
  }

  getLatest(schemaName: string): SchemaVersion | null {
    const versions = this.versions.get(schemaName);
    return versions ? versions[versions.length - 1] : null;
  }

  getVersion(schemaName: string, version: string): SchemaVersion | null {
    const versions = this.versions.get(schemaName) || [];
    return versions.find(v => v.version === version) || null;
  }

  migrate(schemaName: string, data: any, fromVersion: string, toVersion: string): any {
    const versions = this.versions.get(schemaName) || [];
    const fromIndex = versions.findIndex(v => v.version === fromVersion);
    const toIndex = versions.findIndex(v => v.version === toVersion);

    if (fromIndex === -1 || toIndex === -1) {
      throw new Error('Version not found');
    }

    let migratedData = data;
    for (let i = fromIndex; i < toIndex; i++) {
      const nextVersion = versions[i + 1];
      if (nextVersion.migration) {
        migratedData = nextVersion.migration(migratedData);
      }
    }

    return migratedData;
  }

  private sortVersions(schemaName: string) {
    const versions = this.versions.get(schemaName)!;
    versions.sort((a, b) => this.compareVersions(a.version, b.version));
  }

  private compareVersions(a: string, b: string): number {
    const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.split('.').map(Number);

    if (aMajor !== bMajor) return aMajor - bMajor;
    if (aMinor !== bMinor) return aMinor - bMinor;
    return aPatch - bPatch;
  }
}

export const schemaVersionManager = new SchemaVersionManager();
```

## 6. 业务规范应用

### 6.1 服务层规范验证

```typescript
// services/sentiment.service.ts
import { ValidateSchema } from '../decorators/schema-validation.decorator';
import { SentimentDataSchema, GetSentimentsRequestSchema } from '../schemas';

export class SentimentService {
  @ValidateSchema(SentimentDataSchema)
  async createSentiment(data: SentimentData): Promise<SentimentData> {
    // 数据已经通过装饰器验证
    return await this.sentimentRepository.create(data);
  }

  @ValidateSchema(GetSentimentsRequestSchema)
  async getSentiments(request: GetSentimentsRequest): Promise<GetSentimentsResponse> {
    const { query } = request;
    return await this.sentimentRepository.findMany(query);
  }

  async updateSentiment(id: string, updates: Partial<SentimentData>): Promise<SentimentData> {
    // 部分更新验证
    const updateSchema = SentimentDataSchema.partial();
    const validatedUpdates = updateSchema.parse(updates);

    return await this.sentimentRepository.update(id, validatedUpdates);
  }
}
```

### 6.2 数据库模型规范

```typescript
// models/sentiment.model.ts
import { SentimentDataSchema } from '../schemas';

export class SentimentModel {
  static validateBeforeInsert(data: any): SentimentData {
    return SentimentDataSchema.parse(data);
  }

  static validateBeforeUpdate(data: any): Partial<SentimentData> {
    return SentimentDataSchema.partial().parse(data);
  }

  static async create(data: any): Promise<SentimentData> {
    const validatedData = this.validateBeforeInsert(data);
    // 数据库操作
    return validatedData;
  }

  static async update(id: string, updates: any): Promise<SentimentData> {
    const validatedUpdates = this.validateBeforeUpdate(updates);
    // 数据库操作
    return validatedUpdates as SentimentData;
  }
}
```

## 7. API文档自动生成

### 7.1 OpenAPI集成

```typescript
// docs/openapi-generator.ts
import { OpenAPIGenerator } from 'zod-to-openapi';
import { createDocument } from 'zod-openapi';

const generator = new OpenAPIGenerator();

// 注册Schema
generator.register('SentimentData', SentimentDataSchema);
generator.register('GetSentimentsRequest', GetSentimentsRequestSchema);
generator.register('GetSentimentsResponse', GetSentimentsResponseSchema);

// 生成路径定义
const paths = {
  '/api/sentiments': {
    get: {
      summary: '获取舆情数据',
      parameters: generator.generateParameters(GetSentimentsRequestSchema),
      responses: {
        '200': generator.generateResponse(GetSentimentsResponseSchema)
      }
    }
  }
};

const document = createDocument({
  openapi: '3.0.0',
  info: {
    title: '舆情监测系统API',
    version: '1.0.0'
  },
  paths
});

export { document };
```

## 8. 规范测试策略

### 8.1 Schema测试

```typescript
// tests/schemas/sentiment.schema.test.ts
import { SentimentDataSchema } from '../../schemas';

describe('SentimentDataSchema', () => {
  it('should validate valid sentiment data', () => {
    const validData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      source: 'weibo',
      platform: 'weibo',
      content: '这是一条测试微博',
      sentiment: {
        score: 0.5,
        label: 'positive',
        confidence: 0.8
      },
      keywords: ['测试', '微博'],
      category: 'social',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    expect(() => SentimentDataSchema.parse(validData)).not.toThrow();
  });

  it('should reject invalid sentiment score', () => {
    const invalidData = {
      // ... 其他字段
      sentiment: {
        score: 2.0, // 超出范围
        label: 'positive',
        confidence: 0.8
      }
    };

    expect(() => SentimentDataSchema.parse(invalidData)).toThrow();
  });
});
```

### 8.2 契约测试

```typescript
// tests/contracts/sentiment-api.contract.test.ts
import { Pact } from '@pact-foundation/pact';
import { SentimentService } from '../../services/sentiment.service';

describe('Sentiment API Contract', () => {
  const provider = new Pact({
    consumer: 'frontend',
    provider: 'sentiment-service'
  });

  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());

  it('should return sentiment data according to schema', async () => {
    await provider
      .given('sentiment data exists')
      .uponReceiving('a request for sentiment data')
      .withRequest({
        method: 'GET',
        path: '/api/sentiments',
        query: 'limit=10'
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: Matchers.like({
          data: Matchers.eachLike({
            id: Matchers.uuid(),
            content: Matchers.string(),
            sentiment: {
              score: Matchers.decimal(),
              label: Matchers.term({ matcher: 'positive|negative|neutral' }),
              confidence: Matchers.decimal()
            }
          })
        })
      });

    const response = await SentimentService.getSentiments({ limit: 10 });
    expect(response).toBeDefined();
  });
});
```

通过这套规范驱动架构，我们实现了：

1. **强类型安全**: 从Schema自动生成TypeScript类型
2. **运行时验证**: 自动验证API请求/响应和事件数据
3. **文档自动生成**: 从Schema生成OpenAPI文档
4. **版本管理**: Schema版本化和数据迁移
5. **测试保障**: 契约测试和Schema测试

这为后续的事件驱动和消息队列架构提供了坚实的数据规范基础。