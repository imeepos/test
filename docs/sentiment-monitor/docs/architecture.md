# 舆情监测系统架构设计文档

## 1. 概述

舆情监测系统是一个基于Node.js微服务架构的企业级舆情分析平台，采用TypeScript开发，具备高可用、高并发、可扩展等特性。系统主要用于多渠道舆情数据采集、实时处理分析、智能预警和可视化展示。

### 1.1 设计目标

- **高性能**: 支持每秒处理万级别的舆情数据
- **高可用**: 系统可用性达到99.9%以上
- **可扩展**: 支持水平扩展，满足业务快速增长需求
- **易维护**: 微服务架构，便于独立开发、部署和维护
- **安全性**: 完善的安全认证和权限控制机制

### 1.2 技术选型原则

- **成熟稳定**: 选择经过大规模生产验证的技术栈
- **社区活跃**: 优先选择社区活跃、文档完善的开源技术
- **性能优异**: 满足高并发、低延迟的性能要求
- **生态完善**: 技术栈之间具备良好的兼容性和集成能力

## 2. 系统架构设计

### 2.1 总体架构

系统采用四层架构设计：

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Web端     │  │   移动端    │  │   桌面端    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                        接入层                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   CDN       │  │ 负载均衡器  │  │   API网关   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                        应用层                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  用户服务   │  │  采集服务   │  │  处理服务   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  分析服务   │  │  告警服务   │  │  展示服务   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                        数据层                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ PostgreSQL  │  │   MongoDB   │  │    Redis    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  RabbitMQ   │  │    MinIO    │  │  InfluxDB   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 微服务架构

#### 2.2.1 服务列表

| 服务名称 | 端口 | 职责 | 技术栈 |
|---------|------|------|--------|
| API Gateway | 4000 | 统一入口、路由转发、认证授权 | Express.js + TypeScript |
| User Service | 4001 | 用户管理、权限控制 | Express.js + PostgreSQL |
| Collector Service | 4002 | 数据采集、爬虫管理 | Express.js + MongoDB |
| Processor Service | 4003 | 数据清洗、去重、分类 | Express.js + RabbitMQ |
| Sentiment Service | 4004 | 情感分析、NLP处理 | Express.js + Python/AI |
| Alert Service | 4005 | 预警规则、消息推送 | Express.js + Redis |
| Dashboard Service | 4006 | 数据展示、报表生成 | Express.js + MongoDB |

#### 2.2.2 服务间通信

- **同步通信**: 使用 Axios 进行服务间 REST API 调用
- **异步通信**: 使用 RabbitMQ 进行消息传递
- **配置管理**: 使用环境变量和配置文件集中管理
- **服务发现**: 使用 Consul 或直接配置进行服务发现
- **负载均衡**: 使用 Nginx 进行负载均衡

### 2.3 数据架构

#### 2.3.1 数据分层

```
┌─────────────────────────────────────────────────────────────┐
│                      关系型数据层                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  用户数据   │  │  配置数据   │  │  权限数据   │        │
│  │ PostgreSQL  │  │ PostgreSQL  │  │ PostgreSQL  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      文档数据层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  舆情内容   │  │  分析结果   │  │  统计数据   │        │
│  │  MongoDB    │  │  MongoDB    │  │  MongoDB    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      缓存数据层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  热点数据   │  │  会话数据   │  │  计算结果   │        │
│  │   Redis     │  │   Redis     │  │   Redis     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      消息队列层                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  数据采集   │  │  数据处理   │  │  消息通知   │        │
│  │ RabbitMQ    │  │ RabbitMQ    │  │ RabbitMQ    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

#### 2.3.2 数据流转

```
原始数据 → 数据清洗 → 数据标准化 → 情感分析 → 存储索引 → 可视化展示
    ↓           ↓           ↓           ↓           ↓           ↓
 RabbitMQ → RabbitMQ → PostgreSQL → Redis  → MongoDB →   Web
```

## 3. 核心服务详细设计

### 3.1 API网关服务 (Gateway Service)

#### 3.1.1 功能职责
- 统一API入口和路由转发
- JWT认证和授权验证
- 请求限流和熔断保护
- API文档生成和管理

#### 3.1.2 技术架构
```typescript
// 主要技术栈
- Express.js: Web框架
- express-rate-limit: 限流中间件
- helmet: 安全防护
- swagger-jsdoc: API文档生成
- jsonwebtoken: JWT处理
```

#### 3.1.3 核心中间件
- **认证中间件**: JWT token验证
- **限流中间件**: 基于令牌桶算法
- **日志中间件**: 请求响应日志记录
- **错误处理**: 统一错误处理和响应

### 3.2 数据采集服务 (Collector Service)

#### 3.2.1 功能职责
- 多平台数据源接入管理
- 爬虫任务调度和监控
- 数据采集速率控制
- 反爬虫策略处理

#### 3.2.2 技术架构
```typescript
// 主要依赖
- puppeteer: 浏览器自动化
- cheerio: HTML解析
- node-cron: 定时任务
- amqplib: RabbitMQ客户端
```

#### 3.2.3 关键组件
- **任务调度器**: 基于node-cron实现定时采集
- **爬虫引擎**: 基于Puppeteer + Cheerio
- **代理管理**: 维护代理IP池
- **频率控制**: 基于Redis实现限流

### 3.3 数据处理服务 (Processor Service)

#### 3.3.1 功能职责
- 数据清洗和标准化
- 重复数据检测和去重
- 数据分类和标签化
- 数据质量评估

#### 3.3.2 处理流程
```typescript
// 数据处理管道
const pipeline = [
  cleanHtmlTags,      // 清理HTML标签
  normalizeText,      // 文本标准化
  detectDuplicate,    // 重复检测
  classifyContent,    // 内容分类
  qualityScore,       // 质量评分
  saveToMongoDB       // 存储到MongoDB
];
```

#### 3.3.3 关键技术
- **数据清洗**: 正则表达式 + 自然语言处理
- **去重算法**: 基于SimHash + 海明距离
- **内容分类**: 基于机器学习的文本分类
- **质量评估**: 多维度评分模型

### 3.4 情感分析服务 (Sentiment Service)

#### 3.4.1 功能职责
- 文本情感极性识别
- 情感强度量化
- 关键词提取和词云生成
- 热点话题发现

#### 3.4.2 技术架构
```typescript
// AI/ML集成
- @tensorflow/tfjs-node: TensorFlow.js
- natural: 自然语言处理库
- compromise: 文本分析
- python-shell: Python集成
```

#### 3.4.3 算法模型
- **情感分析**: BERT模型 + 中文语料训练
- **关键词提取**: TF-IDF + TextRank算法
- **话题建模**: LDA潜在狄利克雷分布
- **热点发现**: 基于时间窗口的突发检测

### 3.5 预警告警服务 (Alert Service)

#### 3.5.1 功能职责
- 预警规则配置和管理
- 实时监控和异常检测
- 多渠道告警推送
- 告警升级和处理跟踪

#### 3.5.2 预警机制
```typescript
// 预警流水线
interface AlertPipeline {
  monitor: () => void;        // 数据监控
  evaluate: () => boolean;    // 规则评估
  trigger: () => void;        // 告警触发
  notify: () => void;         // 消息推送
  track: () => void;          // 状态跟踪
}
```

#### 3.5.3 告警渠道
- **邮件告警**: Nodemailer发送邮件
- **短信告警**: 对接阿里云/腾讯云短信API
- **微信告警**: 企业微信机器人
- **钉钉告警**: 钉钉机器人推送
- **Webhook**: 自定义Webhook推送

## 4. 数据存储设计

### 4.1 PostgreSQL设计

#### 4.1.1 主要存储内容
- 用户账户和认证信息
- 系统配置和参数
- 权限角色和菜单
- 审计日志和操作记录

#### 4.1.2 核心表结构
```sql
-- 用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INTEGER REFERENCES roles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 角色表
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  permissions JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 MongoDB设计

#### 4.2.1 主要存储内容
- 舆情原始数据
- 分析处理结果
- 统计汇总数据
- 历史归档数据

#### 4.2.2 集合设计
```typescript
// 舆情数据集合
interface SentimentData {
  _id: ObjectId;
  source: string;           // 数据源
  platform: string;        // 平台名称
  content: string;          // 内容文本
  author: string;          // 作者
  publishTime: Date;       // 发布时间
  sentiment: {             // 情感分析结果
    score: number;         // 情感分数
    label: string;         // 情感标签
    confidence: number;    // 置信度
  };
  keywords: string[];      // 关键词
  category: string;        // 分类
  metadata: Record<string, any>; // 元数据
  createdAt: Date;
  updatedAt: Date;
}
```

### 4.3 Redis设计

#### 4.3.1 缓存策略
- **热点数据**: 高频访问的舆情数据
- **计算结果**: 复杂分析的计算结果
- **会话缓存**: 用户登录状态
- **限流计数**: API调用频率控制

#### 4.3.2 数据结构设计
```typescript
// Redis键值设计
const redisKeys = {
  // 用户会话
  session: (userId: string) => `session:${userId}`,

  // 热点数据缓存
  hotData: (key: string) => `hot:${key}`,

  // 限流计数
  rateLimit: (ip: string) => `rate:${ip}`,

  // 分析结果缓存
  analysis: (id: string) => `analysis:${id}`
};
```

## 5. 性能优化策略

### 5.1 应用层优化

#### 5.1.1 异步处理
```typescript
// 异步消息处理
class MessageProcessor {
  async processMessage(message: any) {
    try {
      // 并行处理多个任务
      const [cleanData, sentiment, keywords] = await Promise.all([
        this.cleanData(message.content),
        this.analyzeSentiment(message.content),
        this.extractKeywords(message.content)
      ]);

      // 保存结果
      await this.saveResults({ cleanData, sentiment, keywords });
    } catch (error) {
      await this.handleError(error);
    }
  }
}
```

#### 5.1.2 连接池优化
```typescript
// 数据库连接池
const pgPool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  max: 20,        // 最大连接数
  min: 5,         // 最小连接数
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 5.2 缓存优化

#### 5.2.1 多级缓存
```typescript
// 多级缓存实现
class CacheManager {
  async get(key: string) {
    // L1: 内存缓存
    let value = this.memoryCache.get(key);
    if (value) return value;

    // L2: Redis缓存
    value = await this.redisClient.get(key);
    if (value) {
      this.memoryCache.set(key, value);
      return JSON.parse(value);
    }

    // L3: 数据库
    value = await this.database.find(key);
    if (value) {
      await this.redisClient.setex(key, 3600, JSON.stringify(value));
      this.memoryCache.set(key, value);
    }

    return value;
  }
}
```

### 5.3 数据库优化

#### 5.3.1 读写分离
```typescript
// 数据库读写分离
class DatabaseManager {
  constructor() {
    this.writeDB = new Pool(writeConfig);
    this.readDB = new Pool(readConfig);
  }

  async query(sql: string, params: any[], isWrite = false) {
    const db = isWrite ? this.writeDB : this.readDB;
    return await db.query(sql, params);
  }
}
```

#### 5.3.2 MongoDB索引策略
```typescript
// MongoDB索引设计
db.sentiments.createIndex({ "publishTime": -1 });          // 时间索引
db.sentiments.createIndex({ "source": 1, "platform": 1 }); // 复合索引
db.sentiments.createIndex({ "content": "text" });          // 文本索引
db.sentiments.createIndex({ "sentiment.score": -1 });      // 情感分数索引
```

## 6. 安全架构设计

### 6.1 认证授权

#### 6.1.1 JWT认证实现
```typescript
// JWT认证中间件
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
```

#### 6.1.2 RBAC权限模型
```typescript
// 权限检查中间件
export const checkPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions = req.user?.permissions || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
```

### 6.2 数据安全

#### 6.2.1 敏感数据加密
```typescript
// 数据加密工具
class EncryptionUtil {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  static decrypt(hash: string): string {
    const [ivHex, encryptedHex] = hash.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString();
  }
}
```

### 6.3 网络安全

#### 6.3.1 安全中间件配置
```typescript
// Express安全配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS配置
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 7. 监控告警体系

### 7.1 应用监控

#### 7.1.1 性能指标收集
```typescript
// 性能监控中间件
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const metric = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    // 发送到监控系统
    metricsCollector.record(metric);
  });

  next();
};
```

#### 7.1.2 健康检查
```typescript
// 健康检查端点
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      mongodb: await checkMongoDB(),
      rabbitmq: await checkRabbitMQ()
    }
  };

  const isHealthy = Object.values(health.services).every(status => status === 'healthy');

  res.status(isHealthy ? 200 : 503).json(health);
});
```

### 7.2 日志管理

#### 7.2.1 结构化日志
```typescript
// Winston日志配置
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

## 8. 前端架构设计

### 8.1 前端技术栈概览

#### 8.1.1 核心技术选择
- **React 18+**: 使用最新的React特性，包括并发特性和Suspense
- **TypeScript**: 全面的类型安全保障
- **Vite**: 极速的开发构建体验
- **TailwindCSS**: 原子化CSS，快速样式开发
- **shadcn/ui**: 高质量组件库，基于Radix UI

#### 8.1.2 状态管理和数据获取
```typescript
// TanStack Query 数据获取
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const useSentimentData = (filters: SentimentFilters) => {
  return useQuery({
    queryKey: ['sentiments', filters],
    queryFn: () => sentimentApi.getSentiments(filters),
    staleTime: 5 * 60 * 1000, // 5分钟
  })
}

// 状态管理使用 Zustand
import { create } from 'zustand'

interface AppState {
  user: User | null
  theme: 'light' | 'dark'
  setUser: (user: User | null) => void
  setTheme: (theme: 'light' | 'dark') => void
}

const useAppStore = create<AppState>((set) => ({
  user: null,
  theme: 'light',
  setUser: (user) => set({ user }),
  setTheme: (theme) => set({ theme }),
}))
```

### 8.2 组件架构设计

#### 8.2.1 组件层级结构
```
src/
├── components/           # 通用组件
│   ├── ui/              # shadcn/ui 基础组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── layout/          # 布局组件
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   ├── charts/          # 图表组件
│   │   ├── sentiment-chart.tsx
│   │   ├── trend-chart.tsx
│   │   └── heatmap.tsx
│   └── forms/           # 表单组件
│       ├── sentiment-filter.tsx
│       └── alert-config.tsx
├── pages/               # 页面组件
│   ├── dashboard/
│   ├── sentiments/
│   ├── alerts/
│   └── settings/
├── hooks/               # 自定义Hook
│   ├── use-sentiment-data.ts
│   ├── use-real-time.ts
│   └── use-debounce.ts
├── lib/                 # 工具库
│   ├── api.ts
│   ├── utils.ts
│   └── types.ts
└── styles/              # 样式文件
    ├── globals.css
    └── components.css
```

#### 8.2.2 shadcn/ui 组件示例
```typescript
// components/ui/data-table.tsx
import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center py-4">
        <Input
          placeholder="搜索内容..."
          value={(table.getColumn('content')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('content')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

### 8.3 数据可视化设计

#### 8.3.1 Recharts 图表组件
```typescript
// components/charts/sentiment-trend-chart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SentimentTrendData {
  date: string
  positive: number
  negative: number
  neutral: number
}

interface SentimentTrendChartProps {
  data: SentimentTrendData[]
  className?: string
}

export function SentimentTrendChart({ data, className }: SentimentTrendChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>情感趋势分析</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value: number, name: string) => [value, `${name}情感`]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="positive"
              stroke="#10b981"
              strokeWidth={2}
              name="正面"
            />
            <Line
              type="monotone"
              dataKey="negative"
              stroke="#ef4444"
              strokeWidth={2}
              name="负面"
            />
            <Line
              type="monotone"
              dataKey="neutral"
              stroke="#6b7280"
              strokeWidth={2}
              name="中性"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

### 8.4 实时数据更新

#### 8.4.1 WebSocket 集成
```typescript
// hooks/use-real-time.ts
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useRealTimeUpdates() {
  const wsRef = useRef<WebSocket | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    const ws = new WebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:4000/ws')
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'sentiment_update':
          // 更新情感分析数据
          queryClient.invalidateQueries({ queryKey: ['sentiments'] })
          break
        case 'alert':
          // 处理实时告警
          queryClient.setQueryData(['alerts'], (old: any) => {
            return old ? [...old, data.payload] : [data.payload]
          })
          break
        case 'trending_topics':
          // 更新热点话题
          queryClient.setQueryData(['trending'], data.payload)
          break
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => {
      ws.close()
    }
  }, [queryClient])

  return {
    sendMessage: (message: any) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message))
      }
    }
  }
}
```

### 8.5 响应式设计

#### 8.5.1 TailwindCSS 响应式布局
```typescript
// components/layout/dashboard-layout.tsx
import { cn } from '@/lib/utils'
import { Sidebar } from './sidebar'
import { Header } from './header'

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex">
        <Sidebar className="hidden lg:block" />
        <main className={cn(
          "flex-1 p-4 lg:p-6",
          "lg:ml-64", // 大屏幕时为侧边栏预留空间
          className
        )}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// 响应式网格布局
export function DashboardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
      {children}
    </div>
  )
}
```

### 8.6 性能优化策略

#### 8.6.1 代码分割和懒加载
```typescript
// App.tsx
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// 懒加载页面组件
const Dashboard = lazy(() => import('@/pages/dashboard'))
const Sentiments = lazy(() => import('@/pages/sentiments'))
const Alerts = lazy(() => import('@/pages/alerts'))
const Settings = lazy(() => import('@/pages/settings'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      gcTime: 10 * 60 * 1000,   // 10分钟
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sentiments" element={<Sentiments />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
```

#### 8.6.2 虚拟化大量数据
```typescript
// components/sentiment-table.tsx
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

interface SentimentTableProps {
  data: SentimentData[]
}

export function VirtualizedSentimentTable({ data }: SentimentTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // 每行高度
    overscan: 10,
  })

  return (
    <div
      ref={parentRef}
      className="h-96 overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = data[virtualRow.index]
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="flex items-center p-4 border-b"
            >
              <div className="flex-1 truncate">{item.content}</div>
              <div className="w-24 text-center">{item.sentiment.label}</div>
              <div className="w-32 text-sm text-gray-500">
                {new Date(item.publishTime).toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### 8.7 测试策略

#### 8.7.1 Vitest 单元测试
```typescript
// components/__tests__/sentiment-chart.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SentimentTrendChart } from '../charts/sentiment-trend-chart'

const mockData = [
  { date: '2024-01-01', positive: 10, negative: 5, neutral: 15 },
  { date: '2024-01-02', positive: 12, negative: 3, neutral: 18 },
]

describe('SentimentTrendChart', () => {
  it('renders chart with correct data', () => {
    render(<SentimentTrendChart data={mockData} />)
    expect(screen.getByText('情感趋势分析')).toBeInTheDocument()
  })

  it('displays correct number of data points', () => {
    const { container } = render(<SentimentTrendChart data={mockData} />)
    // 验证图表元素
    expect(container.querySelector('.recharts-line')).toBeInTheDocument()
  })
})
```

#### 8.7.2 Playwright E2E测试
```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('should load dashboard with sentiment data', async ({ page }) => {
    await page.goto('/')

    // 等待数据加载
    await expect(page.locator('[data-testid="sentiment-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="trending-topics"]')).toBeVisible()

    // 验证实时数据更新
    await page.waitForSelector('[data-testid="last-updated"]')
    const timestamp = await page.textContent('[data-testid="last-updated"]')
    expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2}/)
  })

  test('should filter sentiment data', async ({ page }) => {
    await page.goto('/sentiments')

    // 输入搜索条件
    await page.fill('[placeholder="搜索内容..."]', '测试关键词')

    // 验证过滤结果
    await page.waitForSelector('[data-testid="sentiment-table"]')
    const rows = page.locator('[data-testid="sentiment-row"]')
    await expect(rows.first()).toContainText('测试关键词')
  })
})
```

## 9. 部署架构

### 9.1 Docker容器化

#### 9.1.1 Dockerfile示例
```dockerfile
# Node.js服务Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY dist/ ./dist/
COPY .env.production ./.env

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
```

#### 8.1.2 Docker Compose配置
```yaml
# docker-compose.yml
version: '3.8'

services:
  gateway:
    build: ./services/gateway
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
      - rabbitmq
    networks:
      - sentiment-network

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: sentiment_monitor
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - sentiment-network

  mongodb:
    image: mongo:6-jammy
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - sentiment-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - sentiment-network

  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    ports:
      - "15672:15672"  # 管理界面
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - sentiment-network

volumes:
  postgres_data:
  mongodb_data:
  redis_data:
  rabbitmq_data:

networks:
  sentiment-network:
    driver: bridge
```

### 8.2 Kubernetes部署

#### 8.2.1 服务部署配置
```yaml
# k8s/gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gateway-service
  labels:
    app: gateway-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gateway-service
  template:
    metadata:
      labels:
        app: gateway-service
    spec:
      containers:
      - name: gateway
        image: sentiment-monitor/gateway:latest
        ports:
        - containerPort: 4000
        env:
        - name: NODE_ENV
          value: "production"
        - name: POSTGRES_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: postgres-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 9. 技术选型详细说明

### 9.1 后端技术栈

| 技术 | 版本 | 选型理由 |
|------|------|----------|
| Node.js | 18+ | 高性能JavaScript运行时，生态丰富 |
| TypeScript | 5.x | 类型安全，提高代码质量和维护性 |
| Express.js | 4.x | 成熟的Web框架，中间件丰富 |
| Prisma | 5.x | 现代化ORM，类型安全的数据库访问 |
| PostgreSQL | 15+ | 强大的关系型数据库，支持JSON |
| MongoDB | 6.x | 灵活的文档数据库，适合非结构化数据 |
| Redis | 7.x | 高性能缓存，支持多种数据结构 |
| RabbitMQ | 3.x | 可靠的消息队列，支持多种消息模式 |

### 9.2 前端技术栈

| 技术 | 版本 | 选型理由 |
|------|------|----------|
| React | 18+ | 现代化UI库，生态丰富，社区活跃 |
| TypeScript | 5.x | 类型安全，提高代码质量和维护性 |
| Vite | 5.x | 快速构建工具，热更新体验优秀 |
| TailwindCSS | 3.x | 原子化CSS，开发效率高，体积小 |
| shadcn/ui | 最新版 | 高质量React组件库，基于Radix UI |
| TanStack Query | 5.x | 强大的数据获取和状态管理库 |
| TanStack Table | 8.x | 功能完整的表格组件库 |
| TanStack Router | 1.x | 类型安全的路由解决方案 |
| Recharts | 2.x | React数据可视化库 |
| Vitest | 1.x | 快速的单元测试框架 |

### 9.3 开发工具链

| 工具 | 版本 | 用途 |
|------|------|------|
| ESLint | 8.x | 代码质量检查 |
| Prettier | 3.x | 代码格式化 |
| Jest | 29.x | 后端单元测试框架 |
| Vitest | 1.x | 前端单元测试框架 |
| Supertest | 6.x | API测试 |
| Playwright | 1.x | E2E测试 |
| Husky | 8.x | Git钩子管理 |
| Commitizen | 4.x | 规范化提交信息 |

### 9.4 监控运维

| 工具 | 版本 | 用途 |
|------|------|------|
| Winston | 3.x | 日志管理 |
| Prometheus | 2.x | 指标收集 |
| Grafana | 10.x | 数据可视化 |
| Jaeger | 1.x | 分布式链路追踪 |
| Docker | 24.x | 容器化 |
| Kubernetes | 1.28+ | 容器编排 |

## 10. 前端配置文件

### 10.1 Vite配置
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:4000',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts'],
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
})
```

### 10.2 TailwindCSS配置
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

### 10.3 Vitest配置
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

## 11. 总结

舆情监测系统采用现代化的全栈TypeScript架构，具备以下特点：

### 后端特性
1. **Node.js微服务**: 高性能、易扩展的微服务架构
2. **多数据库支持**: PostgreSQL + MongoDB + Redis + RabbitMQ
3. **类型安全**: 全栈TypeScript开发
4. **高性能**: 异步处理、连接池、多级缓存

### 前端特性
1. **现代化React**: React 18+ + TypeScript + Vite
2. **优雅UI**: TailwindCSS + shadcn/ui组件库
3. **数据管理**: TanStack Query + TanStack Table + TanStack Router
4. **性能优化**: 代码分割、虚拟化、实时更新
5. **测试完善**: Vitest + Playwright端到端测试

### 架构优势
1. **技术栈统一**: 前后端都使用TypeScript，降低开发成本
2. **组件化开发**: shadcn/ui提供高质量、可复用的组件
3. **数据驱动**: TanStack生态提供强大的数据处理能力
4. **响应式设计**: TailwindCSS实现完美的移动端适配
5. **开发体验**: Vite提供极速的开发构建体验
6. **可维护性**: 完善的类型系统和测试覆盖

本架构设计为现代化舆情监测系统提供了完整的全栈解决方案，支持高并发、实时更新、响应式设计等现代Web应用需求。