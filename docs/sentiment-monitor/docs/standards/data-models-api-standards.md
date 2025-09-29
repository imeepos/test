# 数据模型与API接口规范

## 1. 数据模型设计规范

### 1.1 核心实体设计

#### 1.1.1 用户实体 (User Entity)

```typescript
interface User {
  id: string;                    // UUID主键
  username: string;              // 用户名 (唯一)
  email: string;                 // 邮箱 (唯一)
  passwordHash: string;          // 密码哈希
  avatar?: string;               // 头像URL
  profile: UserProfile;          // 用户资料
  role: UserRole;                // 用户角色
  permissions: Permission[];     // 权限列表
  organizationId?: string;       // 组织ID
  status: UserStatus;            // 用户状态
  lastLoginAt?: Date;            // 最后登录时间
  createdAt: Date;              // 创建时间
  updatedAt: Date;              // 更新时间
  deletedAt?: Date;             // 软删除时间
}

interface UserProfile {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  department?: string;
  jobTitle?: string;
  preferences: UserPreferences;
}

interface UserPreferences {
  language: 'zh-CN' | 'en-US';
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
}

enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ANALYST = 'analyst',
  VIEWER = 'viewer'
}
```

#### 1.1.2 舆情数据实体 (Sentiment Data Entity)

```typescript
interface SentimentData {
  id: string;                    // UUID主键
  contentId: string;             // 内容唯一标识
  source: DataSource;            // 数据源信息
  content: ContentData;          // 内容详情
  sentiment: SentimentAnalysis;  // 情感分析结果
  keywords: Keyword[];           // 关键词列表
  entities: NamedEntity[];       // 命名实体
  metadata: DataMetadata;        // 元数据
  quality: QualityScore;         // 数据质量评分
  processing: ProcessingStatus;  // 处理状态
  version: number;               // 数据版本
  createdAt: Date;              // 创建时间
  updatedAt: Date;              // 更新时间
}

interface DataSource {
  platform: Platform;           // 平台类型
  channel: string;               // 具体渠道
  url?: string;                  // 原始URL
  author: AuthorInfo;            // 作者信息
  publishedAt: Date;            // 发布时间
  region?: string;               // 地理区域
}

interface ContentData {
  title?: string;                // 标题
  text: string;                  // 正文内容
  mediaUrls?: string[];          // 媒体文件URL
  language: string;              // 语言代码
  wordCount: number;             // 字数统计
  hashtags?: string[];           // 话题标签
  mentions?: string[];           // 提及用户
}

interface SentimentAnalysis {
  polarity: SentimentPolarity;   // 情感极性
  score: number;                 // 情感分数 (-1 到 1)
  confidence: number;            // 置信度 (0 到 1)
  emotions: EmotionScore[];      // 具体情感分析
  intensity: SentimentIntensity; // 情感强度
  analyzedAt: Date;             // 分析时间
  modelVersion: string;         // 分析模型版本
}

interface Keyword {
  text: string;                  // 关键词文本
  weight: number;                // 权重 (0 到 1)
  type: KeywordType;             // 关键词类型
  position?: number;             // 在文本中的位置
}

enum Platform {
  WEIBO = 'weibo',
  WECHAT = 'wechat',
  DOUYIN = 'douyin',
  ZHIHU = 'zhihu',
  NEWS = 'news',
  FORUM = 'forum',
  ECOMMERCE = 'ecommerce'
}

enum SentimentPolarity {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  MIXED = 'mixed'
}

enum SentimentIntensity {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}
```

#### 1.1.3 告警实体 (Alert Entity)

```typescript
interface Alert {
  id: string;                    // UUID主键
  ruleId: string;                // 告警规则ID
  title: string;                 // 告警标题
  description: string;           // 告警描述
  severity: AlertSeverity;       // 严重程度
  status: AlertStatus;           // 告警状态
  triggers: AlertTrigger[];      // 触发条件
  affectedData: AffectedData[];  // 影响的数据
  assignedTo?: string;           // 分配给用户ID
  resolvedBy?: string;           // 解决用户ID
  resolution?: Resolution;       // 解决方案
  notifications: Notification[]; // 通知记录
  metrics: AlertMetrics;         // 告警指标
  tags: string[];                // 标签
  triggeredAt: Date;            // 触发时间
  acknowledgedAt?: Date;        // 确认时间
  resolvedAt?: Date;            // 解决时间
  createdAt: Date;              // 创建时间
  updatedAt: Date;              // 更新时间
}

interface AlertRule {
  id: string;                    // UUID主键
  name: string;                  // 规则名称
  description: string;           // 规则描述
  category: RuleCategory;        // 规则分类
  conditions: RuleCondition[];   // 触发条件
  actions: RuleAction[];         // 执行动作
  threshold: Threshold;          // 阈值设置
  timeWindow: TimeWindow;        // 时间窗口
  enabled: boolean;              // 是否启用
  priority: number;              // 优先级
  cooldown: number;              // 冷却时间(秒)
  createdBy: string;            // 创建者ID
  createdAt: Date;              // 创建时间
  updatedAt: Date;              // 更新时间
}

enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

enum AlertStatus {
  TRIGGERED = 'triggered',
  ACKNOWLEDGED = 'acknowledged',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}
```

### 1.2 事件驱动数据模型

#### 1.2.1 领域事件基础模型

```typescript
interface DomainEvent {
  eventId: string;               // 事件唯一标识
  eventType: string;             // 事件类型
  aggregateId: string;           // 聚合根ID
  aggregateType: string;         // 聚合根类型
  eventVersion: number;          // 事件版本
  eventData: Record<string, any>; // 事件数据
  metadata: EventMetadata;       // 事件元数据
  timestamp: Date;              // 时间戳
  correlationId?: string;        // 关联ID
  causationId?: string;          // 因果ID
}

interface EventMetadata {
  userId?: string;               // 触发用户ID
  userAgent?: string;            // 用户代理
  ipAddress?: string;            // IP地址
  traceId?: string;              // 链路追踪ID
  source: string;                // 事件源
  environment: string;           // 环境标识
}
```

#### 1.2.2 具体业务事件

```typescript
// 用户领域事件
interface UserCreatedEvent extends DomainEvent {
  eventType: 'user.created';
  eventData: {
    userId: string;
    username: string;
    email: string;
    role: UserRole;
  };
}

interface UserRoleChangedEvent extends DomainEvent {
  eventType: 'user.role_changed';
  eventData: {
    userId: string;
    previousRole: UserRole;
    newRole: UserRole;
    changedBy: string;
  };
}

// 数据采集事件
interface DataCollectedEvent extends DomainEvent {
  eventType: 'data.collected';
  eventData: {
    dataId: string;
    source: DataSource;
    contentPreview: string;
    collectionTime: Date;
  };
}

interface DataProcessedEvent extends DomainEvent {
  eventType: 'data.processed';
  eventData: {
    dataId: string;
    processingSteps: string[];
    sentimentScore: number;
    keywords: string[];
    processingTime: number;
  };
}

// 告警事件
interface AlertTriggeredEvent extends DomainEvent {
  eventType: 'alert.triggered';
  eventData: {
    alertId: string;
    ruleId: string;
    severity: AlertSeverity;
    affectedDataCount: number;
    triggerConditions: Record<string, any>;
  };
}

interface AlertResolvedEvent extends DomainEvent {
  eventType: 'alert.resolved';
  eventData: {
    alertId: string;
    resolvedBy: string;
    resolutionMethod: string;
    resolutionTime: number;
  };
}
```

## 2. API接口设计规范

### 2.1 RESTful API设计原则

#### 2.1.1 URL设计规范

```typescript
// 资源命名规范
GET    /api/v1/users                    // 获取用户列表
GET    /api/v1/users/{id}               // 获取特定用户
POST   /api/v1/users                    // 创建用户
PUT    /api/v1/users/{id}               // 更新用户(完整)
PATCH  /api/v1/users/{id}               // 更新用户(部分)
DELETE /api/v1/users/{id}               // 删除用户

// 嵌套资源
GET    /api/v1/users/{id}/permissions   // 获取用户权限
POST   /api/v1/users/{id}/permissions   // 添加用户权限

// 操作性资源
POST   /api/v1/users/{id}/activate      // 激活用户
POST   /api/v1/users/{id}/deactivate    // 停用用户
POST   /api/v1/alerts/{id}/acknowledge  // 确认告警
```

#### 2.1.2 HTTP状态码规范

```typescript
// 成功状态码
200 OK          // 请求成功
201 Created     // 资源创建成功
202 Accepted    // 请求已接受，异步处理中
204 No Content  // 请求成功，无返回内容

// 客户端错误
400 Bad Request         // 请求参数错误
401 Unauthorized        // 未认证
403 Forbidden          // 权限不足
404 Not Found          // 资源不存在
409 Conflict           // 资源冲突
422 Unprocessable Entity // 请求格式正确但语义错误
429 Too Many Requests   // 请求过于频繁

// 服务器错误
500 Internal Server Error // 服务器内部错误
502 Bad Gateway          // 网关错误
503 Service Unavailable  // 服务不可用
504 Gateway Timeout      // 网关超时
```

### 2.2 API响应格式规范

#### 2.2.1 统一响应格式

```typescript
interface ApiResponse<T = any> {
  success: boolean;              // 请求是否成功
  data?: T;                      // 响应数据
  error?: ApiError;              // 错误信息
  meta?: ResponseMeta;           // 元数据
  timestamp: string;             // 响应时间戳
  requestId: string;             // 请求ID，用于调试
}

interface ApiError {
  code: string;                  // 错误代码
  message: string;               // 错误描述
  details?: Record<string, any>; // 错误详情
  field?: string;                // 错误字段
}

interface ResponseMeta {
  pagination?: PaginationMeta;   // 分页信息
  total?: number;                // 总数
  version?: string;              // API版本
  executionTime?: number;        // 执行时间(ms)
}

interface PaginationMeta {
  page: number;                  // 当前页码
  pageSize: number;              // 每页大小
  totalPages: number;            // 总页数
  totalItems: number;            // 总条目数
  hasNextPage: boolean;          // 是否有下一页
  hasPreviousPage: boolean;      // 是否有上一页
}
```

#### 2.2.2 API响应示例

```typescript
// 成功响应示例
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "analyst",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "version": "1.0",
    "executionTime": 45
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}

// 分页响应示例
{
  "success": true,
  "data": [
    { /* 用户对象 */ },
    { /* 用户对象 */ }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalPages": 5,
      "totalItems": 100,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456790"
}

// 错误响应示例
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": {
      "email": "邮箱格式不正确",
      "password": "密码长度至少8位"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456791"
}
```

### 2.3 API认证与授权规范

#### 2.3.1 JWT认证

```typescript
interface JWTPayload {
  sub: string;                   // 用户ID (Subject)
  iat: number;                   // 签发时间 (Issued At)
  exp: number;                   // 过期时间 (Expiration)
  iss: string;                   // 签发者 (Issuer)
  aud: string;                   // 受众 (Audience)
  jti: string;                   // JWT ID
  scope: string[];               // 权限范围
  role: UserRole;                // 用户角色
  organizationId?: string;       // 组织ID
}

// 请求头格式
Authorization: Bearer <JWT_TOKEN>
```

#### 2.3.2 权限检查模型

```typescript
interface Permission {
  resource: string;              // 资源类型
  action: string;                // 操作类型
  conditions?: PermissionCondition[]; // 条件限制
}

interface PermissionCondition {
  field: string;                 // 字段名
  operator: 'eq' | 'ne' | 'in' | 'nin' | 'gt' | 'lt'; // 操作符
  value: any;                    // 比较值
}

// 权限示例
const permissions: Permission[] = [
  {
    resource: 'user',
    action: 'read',
    conditions: [
      { field: 'organizationId', operator: 'eq', value: '${user.organizationId}' }
    ]
  },
  {
    resource: 'sentiment_data',
    action: 'write'
  }
];
```

### 2.4 查询与过滤规范

#### 2.4.1 查询参数标准

```typescript
interface QueryParams {
  // 分页参数
  page?: number;                 // 页码，从1开始
  pageSize?: number;             // 每页大小，默认20，最大100

  // 排序参数
  sort?: string;                 // 排序字段，支持多字段: "createdAt,-score"

  // 搜索参数
  search?: string;               // 全文搜索关键词

  // 过滤参数
  filter?: Record<string, any>;  // 过滤条件

  // 字段选择
  fields?: string;               // 返回字段列表: "id,username,email"

  // 关联查询
  include?: string;              // 包含关联数据: "profile,permissions"

  // 时间范围
  dateFrom?: string;             // 开始时间 ISO 8601
  dateTo?: string;               // 结束时间 ISO 8601
}

// 查询示例
GET /api/v1/sentiment-data?page=1&pageSize=20&sort=-createdAt&filter[platform]=weibo&filter[sentiment.polarity]=positive&dateFrom=2024-01-01T00:00:00Z&dateTo=2024-01-31T23:59:59Z
```

#### 2.4.2 高级过滤语法

```typescript
// 操作符定义
interface FilterOperators {
  $eq: any;                      // 等于
  $ne: any;                      // 不等于
  $gt: any;                      // 大于
  $gte: any;                     // 大于等于
  $lt: any;                      // 小于
  $lte: any;                     // 小于等于
  $in: any[];                    // 包含在数组中
  $nin: any[];                   // 不包含在数组中
  $like: string;                 // 模糊匹配
  $ilike: string;                // 不区分大小写模糊匹配
  $exists: boolean;              // 字段是否存在
  $regex: string;                // 正则表达式匹配
}

// 复杂查询示例
{
  "filter": {
    "sentiment.score": { "$gte": 0.5 },
    "platform": { "$in": ["weibo", "wechat"] },
    "content.text": { "$like": "%关键词%" },
    "createdAt": {
      "$gte": "2024-01-01T00:00:00Z",
      "$lt": "2024-02-01T00:00:00Z"
    }
  }
}
```

### 2.5 批量操作API规范

#### 2.5.1 批量创建

```typescript
// 批量创建请求
POST /api/v1/sentiment-data/batch

{
  "items": [
    { /* 数据对象1 */ },
    { /* 数据对象2 */ },
    { /* 数据对象3 */ }
  ],
  "options": {
    "validateOnly": false,       // 仅验证不创建
    "skipDuplicates": true,      // 跳过重复数据
    "stopOnError": false         // 遇到错误是否停止
  }
}

// 批量操作响应
{
  "success": true,
  "data": {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "results": [
      {
        "index": 0,
        "success": true,
        "data": { /* 创建的对象 */ }
      },
      {
        "index": 1,
        "success": true,
        "data": { /* 创建的对象 */ }
      },
      {
        "index": 2,
        "success": false,
        "error": {
          "code": "VALIDATION_ERROR",
          "message": "数据验证失败"
        }
      }
    ]
  }
}
```

#### 2.5.2 批量更新

```typescript
// 批量更新请求
PATCH /api/v1/sentiment-data/batch

{
  "items": [
    {
      "id": "data1",
      "updates": { "category": "positive" }
    },
    {
      "id": "data2",
      "updates": { "category": "negative" }
    }
  ]
}
```

### 2.6 实时API规范

#### 2.6.1 WebSocket连接

```typescript
// WebSocket连接
ws://api.domain.com/ws?token=<JWT_TOKEN>

// 消息格式
interface WebSocketMessage {
  type: MessageType;             // 消息类型
  channel?: string;              // 频道名称
  data: any;                     // 消息数据
  timestamp: string;             // 时间戳
  messageId: string;             // 消息ID
}

enum MessageType {
  SUBSCRIBE = 'subscribe',       // 订阅
  UNSUBSCRIBE = 'unsubscribe',   // 取消订阅
  DATA_UPDATE = 'data_update',   // 数据更新
  ALERT = 'alert',               // 告警通知
  HEARTBEAT = 'heartbeat',       // 心跳
  ERROR = 'error'                // 错误
}

// 订阅示例
{
  "type": "subscribe",
  "channel": "sentiment_updates",
  "data": {
    "filters": {
      "platform": ["weibo", "wechat"],
      "sentiment.polarity": "negative"
    }
  }
}

// 数据推送示例
{
  "type": "data_update",
  "channel": "sentiment_updates",
  "data": {
    "action": "created",
    "resource": "sentiment_data",
    "item": { /* 完整数据对象 */ }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "messageId": "msg_123456"
}
```

### 2.7 API版本控制规范

#### 2.7.1 版本策略

```typescript
// URL版本控制（推荐）
GET /api/v1/users
GET /api/v2/users

// 请求头版本控制
GET /api/users
Accept: application/vnd.api+json;version=2

// 查询参数版本控制
GET /api/users?version=2
```

#### 2.7.2 版本兼容性

```typescript
interface ApiVersionConfig {
  version: string;               // 版本号
  deprecated: boolean;           // 是否已废弃
  supportedUntil?: string;       // 支持截止日期
  deprecationNotice?: string;    // 废弃通知
  migrationGuide?: string;       // 迁移指南URL
}

// 版本信息响应头
X-API-Version: 1.0
X-API-Deprecated: true
X-API-Sunset: 2024-12-31
```

### 2.8 错误处理规范

#### 2.8.1 标准错误代码

```typescript
enum ErrorCode {
  // 通用错误 (1000-1999)
  INTERNAL_ERROR = 'E1000',
  INVALID_REQUEST = 'E1001',
  VALIDATION_ERROR = 'E1002',
  NOT_FOUND = 'E1003',
  CONFLICT = 'E1004',

  // 认证授权错误 (2000-2999)
  UNAUTHORIZED = 'E2000',
  FORBIDDEN = 'E2001',
  TOKEN_EXPIRED = 'E2002',
  INVALID_TOKEN = 'E2003',

  // 业务逻辑错误 (3000-3999)
  USER_ALREADY_EXISTS = 'E3000',
  INVALID_CREDENTIALS = 'E3001',
  ACCOUNT_DISABLED = 'E3002',
  INSUFFICIENT_QUOTA = 'E3003',

  // 数据相关错误 (4000-4999)
  DATA_PROCESSING_FAILED = 'E4000',
  DUPLICATE_DATA = 'E4001',
  DATA_QUALITY_POOR = 'E4002',

  // 外部服务错误 (5000-5999)
  EXTERNAL_SERVICE_ERROR = 'E5000',
  RATE_LIMIT_EXCEEDED = 'E5001',
  SERVICE_UNAVAILABLE = 'E5002'
}
```

#### 2.8.2 错误响应格式

```typescript
// 详细错误响应
{
  "success": false,
  "error": {
    "code": "E1002",
    "message": "请求参数验证失败",
    "details": {
      "email": [
        "邮箱格式不正确",
        "邮箱已被使用"
      ],
      "password": [
        "密码长度至少8位",
        "密码必须包含字母和数字"
      ]
    },
    "field": "email",
    "traceId": "trace_123456",
    "documentation": "https://docs.api.com/errors/E1002"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

## 3. 数据验证规范

### 3.1 输入验证标准

```typescript
// 使用 Zod 进行数据验证
import { z } from 'zod';

const CreateUserSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3位')
    .max(50, '用户名最多50位')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),

  email: z.string()
    .email('邮箱格式不正确')
    .max(100, '邮箱最多100位'),

  password: z.string()
    .min(8, '密码至少8位')
    .max(128, '密码最多128位')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字'),

  profile: z.object({
    firstName: z.string().min(1, '名字不能为空').max(50),
    lastName: z.string().min(1, '姓氏不能为空').max(50),
    phoneNumber: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
  }),

  role: z.enum(['admin', 'manager', 'analyst', 'viewer'])
});

type CreateUserRequest = z.infer<typeof CreateUserSchema>;
```

### 3.2 数据清洗规范

```typescript
interface DataCleaningRules {
  htmlTags: boolean;             // 移除HTML标签
  specialChars: boolean;         // 处理特殊字符
  whitespace: boolean;           // 标准化空白字符
  encoding: boolean;             // 统一字符编码
  duplicates: boolean;           // 去除重复内容
  minLength: number;             // 最小内容长度
  maxLength: number;             // 最大内容长度
  languageFilter: string[];      // 语言过滤
  contentFilter: string[];       // 内容过滤关键词
}

const defaultCleaningRules: DataCleaningRules = {
  htmlTags: true,
  specialChars: true,
  whitespace: true,
  encoding: true,
  duplicates: true,
  minLength: 10,
  maxLength: 10000,
  languageFilter: ['zh-CN', 'zh-TW', 'en'],
  contentFilter: ['spam', 'advertisement']
};
```

### 3.3 数据质量评估

```typescript
interface QualityMetrics {
  completeness: number;          // 完整性 (0-1)
  accuracy: number;              // 准确性 (0-1)
  consistency: number;           // 一致性 (0-1)
  timeliness: number;            // 时效性 (0-1)
  relevance: number;             // 相关性 (0-1)
  uniqueness: number;            // 唯一性 (0-1)
  overall: number;               // 总体质量分数 (0-1)
}

interface QualityThresholds {
  minimumOverall: number;        // 最低总体质量要求
  warningThreshold: number;      // 质量警告阈值
  rejectThreshold: number;       // 质量拒绝阈值
}

const defaultQualityThresholds: QualityThresholds = {
  minimumOverall: 0.6,
  warningThreshold: 0.7,
  rejectThreshold: 0.4
};
```

## 4. 缓存策略规范

### 4.1 缓存级别定义

```typescript
enum CacheLevel {
  L1_MEMORY = 'l1_memory',       // 内存缓存
  L2_REDIS = 'l2_redis',         // Redis缓存
  L3_DATABASE = 'l3_database'    // 数据库缓存
}

interface CacheConfig {
  ttl: number;                   // 过期时间(秒)
  maxSize?: number;              // 最大缓存大小
  strategy: CacheStrategy;       // 缓存策略
  warmup?: boolean;              // 是否预热
}

enum CacheStrategy {
  LRU = 'lru',                   // 最近最少使用
  LFU = 'lfu',                   // 最少使用频率
  FIFO = 'fifo',                 // 先进先出
  TTL = 'ttl'                    // 基于过期时间
}
```

### 4.2 缓存键命名规范

```typescript
// 缓存键命名模式
const CacheKeyPatterns = {
  user: 'user:{userId}',
  userPermissions: 'user:{userId}:permissions',
  sentimentData: 'sentiment:{dataId}',
  sentimentStats: 'sentiment:stats:{platform}:{date}',
  alertRules: 'alert:rules:{organizationId}',
  searchResults: 'search:{hash}',
  apiRate: 'rate:{userId}:{endpoint}',
  session: 'session:{sessionId}'
};

// 缓存键构建函数
class CacheKeyBuilder {
  static user(userId: string): string {
    return `user:${userId}`;
  }

  static userPermissions(userId: string): string {
    return `user:${userId}:permissions`;
  }

  static sentimentStats(platform: string, date: string): string {
    return `sentiment:stats:${platform}:${date}`;
  }
}
```

## 5. 监控指标规范

### 5.1 业务指标定义

```typescript
interface BusinessMetrics {
  // 数据指标
  dataVolume: DataVolumeMetrics;
  dataQuality: DataQualityMetrics;

  // 性能指标
  processing: ProcessingMetrics;
  api: ApiMetrics;

  // 用户指标
  user: UserMetrics;

  // 告警指标
  alert: AlertMetrics;
}

interface DataVolumeMetrics {
  totalRecords: number;          // 总记录数
  recordsPerHour: number;        // 每小时记录数
  recordsPerSource: Record<string, number>; // 各数据源记录数
  storageUsage: number;          // 存储使用量(GB)
}

interface ApiMetrics {
  requestCount: number;          // 请求总数
  responseTime: ResponseTimeMetrics; // 响应时间
  errorRate: number;             // 错误率
  throughput: number;            // 吞吐量(req/s)
}

interface ResponseTimeMetrics {
  average: number;               // 平均响应时间
  p50: number;                   // 50分位响应时间
  p95: number;                   // 95分位响应时间
  p99: number;                   // 99分位响应时间
}
```

### 5.2 告警规则配置

```typescript
interface MetricAlert {
  metricName: string;            // 指标名称
  threshold: number;             // 阈值
  operator: 'gt' | 'lt' | 'eq' | 'ne'; // 比较操作符
  duration: number;              // 持续时间(秒)
  severity: AlertSeverity;       // 严重程度
  enabled: boolean;              // 是否启用
}

const defaultMetricAlerts: MetricAlert[] = [
  {
    metricName: 'api.errorRate',
    threshold: 0.05,
    operator: 'gt',
    duration: 300,
    severity: AlertSeverity.HIGH,
    enabled: true
  },
  {
    metricName: 'api.responseTime.p95',
    threshold: 2000,
    operator: 'gt',
    duration: 600,
    severity: AlertSeverity.MEDIUM,
    enabled: true
  }
];
```

以上是舆情监测系统的数据模型与API接口规范文档，涵盖了核心实体设计、事件驱动模型、RESTful API规范、认证授权、查询过滤、错误处理等关键方面。这些规范将为系统的规范化开发和维护提供重要指导。