# @sker/api-client - API客户端

> 扩展式AI协作画布系统的统一网络通信层

## 📋 概述

@sker/api-client 提供统一的HTTP客户端、WebSocket连接和状态同步功能。它依赖 @sker/utils 的工具函数和 @sker/data-models 的数据结构，为前端与后端通信提供类型安全、错误处理和实时更新支持。

## 🎯 设计原理

### 为什么需要独立的API客户端包？

1. **网络层抽象**: 统一前端的网络请求接口，隐藏底层HTTP/WebSocket细节
2. **类型安全**: 基于数据模型提供完整的TypeScript类型支持
3. **错误处理**: 集中处理网络错误、重试逻辑和用户友好的错误提示
4. **状态同步**: 管理客户端与服务端的数据同步状态
5. **离线支持**: 提供离线缓存和网络恢复后的数据同步
6. **性能优化**: 请求去重、缓存管理和批量操作支持

### 架构设计思路

```mermaid
graph TD
    A[@sker/utils] --> B[API Client Core]
    C[@sker/data-models] --> B
    
    B --> D[REST Client]
    B --> E[WebSocket Client]
    B --> F[GraphQL Client]
    
    D --> G[请求拦截器]
    E --> G
    F --> G
    
    G --> H[认证管理器]
    G --> I[错误处理器]
    G --> J[缓存管理器]
    G --> K[重试管理器]
    
    H --> L[Token管理]
    I --> M[错误分类]
    J --> N[本地存储]
    K --> O[指数退避]
    
    B --> P[状态同步管理器]
    P --> Q[实时更新]
    P --> R[离线队列]
    P --> S[冲突解决]
    
    B --> T[前端应用使用]
```

## 🚀 核心功能

### 1. REST API客户端
- 基于axios的HTTP客户端
- 自动请求/响应拦截
- 请求去重和缓存
- 错误重试机制

### 2. WebSocket实时通信
- 自动重连机制
- 消息队列和确认
- 房间管理和广播
- 心跳检测

### 3. GraphQL客户端
- 查询优化和缓存
- 订阅实时数据
- 批量请求合并
- 错误处理

### 4. 认证管理
- Token自动刷新
- 多种认证方式支持
- 权限检查
- 安全存储

### 5. 缓存管理
- 内存缓存
- 本地存储缓存
- 缓存失效策略
- 缓存预热

### 6. 离线支持
- 离线请求队列
- 网络状态检测
- 数据冲突解决
- 断线重连

## 📦 安装使用

```bash
npm install @sker/api-client @sker/utils @sker/data-models
```

## 📖 API文档

### RestClient - REST API客户端

```typescript
import { RestClient } from '@sker/api-client';
import { ComponentData, ProjectData } from '@sker/data-models';

// 初始化客户端
const api = new RestClient({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  retries: 3,
  auth: {
    type: 'bearer',
    token: 'your-jwt-token'
  },
  cache: {
    enabled: true,
    ttl: 300000 // 5分钟
  }
});

// 组件API操作
const componentAPI = api.resource<ComponentData>('/components');

// 获取组件列表
const components = await componentAPI.list({
  page: 1,
  pageSize: 20,
  filter: { status: 'published' },
  sort: { field: 'updated_at', order: 'desc' }
});

// 创建新组件
const newComponent = await componentAPI.create({
  title: '新组件',
  content: '组件内容',
  semantic_type: 'text',
  importance_level: 3,
  confidence_score: 90,
  status: 'draft'
});

// 获取单个组件
const component = await componentAPI.get('comp_123');

// 更新组件
const updatedComponent = await componentAPI.update('comp_123', {
  title: '更新后的标题',
  content: '更新后的内容'
});

// 删除组件
await componentAPI.delete('comp_123');

// 批量操作
const batchResult = await componentAPI.batch([
  { method: 'POST', data: newComponent1 },
  { method: 'PUT', id: 'comp_456', data: updateData },
  { method: 'DELETE', id: 'comp_789' }
]);

// 自定义请求
const customResult = await api.request({
  method: 'POST',
  url: '/components/comp_123/optimize',
  data: { prompt: '优化这个组件' },
  timeout: 30000 // 自定义超时
});
```

### WebSocketClient - 实时通信客户端

```typescript
import { WebSocketClient } from '@sker/api-client';

// 初始化WebSocket客户端
const ws = new WebSocketClient({
  url: 'wss://api.example.com/ws',
  auth: {
    token: 'your-jwt-token'
  },
  reconnect: {
    enabled: true,
    maxAttempts: 5,
    backoff: 'exponential'
  },
  heartbeat: {
    enabled: true,
    interval: 30000
  }
});

// 连接事件监听
ws.on('connected', () => {
  console.log('WebSocket连接已建立');
});

ws.on('disconnected', (reason) => {
  console.log('WebSocket连接断开:', reason);
});

ws.on('error', (error) => {
  console.error('WebSocket错误:', error);
});

// 加入项目房间
await ws.joinRoom('project_123', {
  user_id: 'user_456',
  permissions: ['read', 'write']
});

// 监听组件更新
ws.on('component:updated', (data: ComponentUpdateEvent) => {
  console.log('组件已更新:', data);
  // 更新本地状态
});

ws.on('component:created', (data: ComponentCreateEvent) => {
  console.log('新组件创建:', data);
});

ws.on('user:joined', (data: UserJoinEvent) => {
  console.log('用户加入协作:', data);
});

// 发送消息
await ws.send('component:update', {
  component_id: 'comp_123',
  changes: {
    title: '新标题'
  },
  user_id: 'user_456'
});

// 广播给房间内所有用户
await ws.broadcast('project_123', 'cursor:move', {
  user_id: 'user_456',
  position: { x: 100, y: 200 }
});

// 离开房间
await ws.leaveRoom('project_123');

// 关闭连接
await ws.close();
```

### GraphQLClient - GraphQL客户端

```typescript
import { GraphQLClient } from '@sker/api-client';

// 初始化GraphQL客户端
const gql = new GraphQLClient({
  endpoint: 'https://api.example.com/graphql',
  auth: {
    token: 'your-jwt-token'
  },
  cache: {
    enabled: true,
    policy: 'cache-first'
  }
});

// 查询操作
const COMPONENTS_QUERY = `
  query GetComponents($projectId: ID!, $first: Int!, $after: String) {
    project(id: $projectId) {
      components(first: $first, after: $after) {
        edges {
          node {
            id
            title
            content
            semanticType
            importanceLevel
            confidenceScore
            status
            createdAt
            updatedAt
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

const result = await gql.query(COMPONENTS_QUERY, {
  projectId: 'proj_123',
  first: 20,
  after: null
});

// 变更操作
const CREATE_COMPONENT_MUTATION = `
  mutation CreateComponent($input: CreateComponentInput!) {
    createComponent(input: $input) {
      component {
        id
        title
        content
      }
      errors {
        field
        message
      }
    }
  }
`;

const createResult = await gql.mutate(CREATE_COMPONENT_MUTATION, {
  input: {
    projectId: 'proj_123',
    title: '新组件',
    content: '组件内容',
    semanticType: 'TEXT'
  }
});

// 订阅实时更新
const COMPONENT_UPDATES_SUBSCRIPTION = `
  subscription ComponentUpdates($projectId: ID!) {
    componentUpdates(projectId: $projectId) {
      mutation
      component {
        id
        title
        content
        updatedAt
      }
      user {
        id
        name
      }
    }
  }
`;

const subscription = gql.subscribe(COMPONENT_UPDATES_SUBSCRIPTION, {
  projectId: 'proj_123'
}, {
  next: (data) => {
    console.log('组件更新:', data);
  },
  error: (error) => {
    console.error('订阅错误:', error);
  }
});

// 取消订阅
subscription.unsubscribe();
```

### AuthManager - 认证管理

```typescript
import { AuthManager } from '@sker/api-client';

// 初始化认证管理器
const auth = new AuthManager({
  tokenStorage: 'localStorage', // 'localStorage' | 'sessionStorage' | 'memory'
  refreshThreshold: 300, // 5分钟前自动刷新
  autoRefresh: true,
  onTokenExpired: () => {
    // Token过期处理
    window.location.href = '/login';
  }
});

// 设置认证信息
await auth.setCredentials({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: new Date(Date.now() + 3600000)
});

// 获取当前Token
const currentToken = auth.getAccessToken();

// 检查Token是否有效
const isValid = auth.isTokenValid();

// 手动刷新Token
const newTokens = await auth.refreshToken();

// 登出
await auth.logout();

// 监听认证状态变化
auth.on('tokenRefreshed', (tokens) => {
  console.log('Token已刷新:', tokens);
});

auth.on('authStateChanged', (isAuthenticated) => {
  console.log('认证状态变化:', isAuthenticated);
});
```

### CacheManager - 缓存管理

```typescript
import { CacheManager } from '@sker/api-client';

// 创建缓存管理器
const cache = new CacheManager({
  strategy: 'lru', // 'lru' | 'fifo' | 'ttl'
  maxSize: 100, // 最大缓存条目数
  defaultTTL: 300000, // 默认5分钟TTL
  storage: 'memory', // 'memory' | 'localStorage' | 'indexedDB'
  compression: true // 启用压缩
});

// 设置缓存
await cache.set('components:list:proj_123', {
  data: components,
  timestamp: Date.now(),
  metadata: { page: 1, pageSize: 20 }
}, {
  ttl: 600000, // 10分钟
  tags: ['components', 'project:proj_123']
});

// 获取缓存
const cached = await cache.get('components:list:proj_123');
if (cached && !cache.isExpired(cached)) {
  console.log('使用缓存数据:', cached.data);
}

// 删除缓存
await cache.delete('components:list:proj_123');

// 根据标签删除缓存
await cache.deleteByTags(['project:proj_123']);

// 清空所有缓存
await cache.clear();

// 获取缓存统计
const stats = cache.getStats();
console.log('缓存命中率:', stats.hitRate);
console.log('缓存大小:', stats.size);
```

### SyncManager - 状态同步管理

```typescript
import { SyncManager } from '@sker/api-client';

// 初始化同步管理器
const sync = new SyncManager({
  restClient: api,
  wsClient: ws,
  storage: 'indexedDB',
  conflictResolution: 'last-write-wins', // 'last-write-wins' | 'merge' | 'prompt'
  syncInterval: 30000 // 30秒同步一次
});

// 开始同步
await sync.start();

// 监听同步事件
sync.on('syncStarted', () => {
  console.log('同步开始');
});

sync.on('syncCompleted', (result) => {
  console.log('同步完成:', result);
});

sync.on('conflictDetected', (conflict) => {
  console.log('检测到冲突:', conflict);
  // 可以自定义冲突解决逻辑
});

// 强制同步
await sync.forcSync();

// 同步特定资源
await sync.syncResource('components', 'comp_123');

// 停止同步
await sync.stop();

// 获取同步状态
const status = sync.getStatus();
console.log('同步状态:', status);
```

### OfflineHandler - 离线处理

```typescript
import { OfflineHandler } from '@sker/api-client';

// 初始化离线处理器
const offline = new OfflineHandler({
  storage: 'indexedDB',
  maxQueueSize: 1000,
  retryStrategy: 'exponential',
  networkDetection: true
});

// 监听网络状态
offline.on('online', () => {
  console.log('网络已连接');
  // 自动处理离线队列
});

offline.on('offline', () => {
  console.log('网络已断开');
});

// 添加离线操作
await offline.enqueue({
  method: 'POST',
  url: '/components',
  data: newComponent,
  metadata: {
    priority: 'high',
    maxRetries: 5
  }
});

// 获取离线队列状态
const queueStatus = offline.getQueueStatus();
console.log('队列中的操作数:', queueStatus.pending);

// 手动处理队列
await offline.processQueue();

// 清空队列
await offline.clearQueue();
```

## 🛠️ 开发指南

### 项目结构

```
api-client/
├── src/
│   ├── clients/           # 客户端实现
│   │   ├── RestClient.ts
│   │   ├── WebSocketClient.ts
│   │   ├── GraphQLClient.ts
│   │   └── BaseClient.ts
│   ├── managers/          # 管理器
│   │   ├── AuthManager.ts
│   │   ├── CacheManager.ts
│   │   ├── SyncManager.ts
│   │   └── OfflineHandler.ts
│   ├── interceptors/      # 拦截器
│   │   ├── auth.ts
│   │   ├── cache.ts
│   │   ├── retry.ts
│   │   ├── logging.ts
│   │   └── error.ts
│   ├── adapters/          # 适配器
│   │   ├── axios.ts
│   │   ├── fetch.ts
│   │   └── websocket.ts
│   ├── utils/             # 工具函数
│   │   ├── request.ts
│   │   ├── response.ts
│   │   ├── url.ts
│   │   └── validation.ts
│   ├── types/             # 类型定义
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── cache.ts
│   │   ├── sync.ts
│   │   └── events.ts
│   ├── errors/            # 错误类型
│   │   ├── NetworkError.ts
│   │   ├── AuthError.ts
│   │   ├── ValidationError.ts
│   │   └── SyncError.ts
│   └── index.ts           # 统一导出
├── tests/                 # 测试文件
│   ├── clients.test.ts
│   ├── managers.test.ts
│   ├── interceptors.test.ts
│   ├── offline.test.ts
│   └── integration.test.ts
└── docs/                  # 详细文档
    ├── rest-api.md
    ├── websocket.md
    ├── graphql.md
    └── authentication.md
```

### 依赖包集成

```typescript
// 使用 @sker/utils 的工具函数
import { ValidationUtils, FormatUtils, DateUtils } from '@sker/utils';
import { ComponentData, ProjectData, ValidationResult } from '@sker/data-models';

export class RestClient {
  // 使用验证工具验证请求数据
  private validateRequestData<T>(data: T, schema: any): ValidationResult {
    return ValidationUtils.validate(data, schema);
  }
  
  // 使用格式化工具处理响应数据
  private formatResponse(response: any): any {
    if (response.created_at) {
      response.created_at = DateUtils.formatRelative(new Date(response.created_at));
    }
    
    if (response.file_size) {
      response.formatted_file_size = FormatUtils.formatFileSize(response.file_size);
    }
    
    return response;
  }
  
  // 使用数据模型进行类型转换
  async getComponent(id: string): Promise<ComponentData> {
    const response = await this.request(`/components/${id}`);
    
    // 验证响应数据
    const validation = componentSchema.safeParse(response.data);
    if (!validation.success) {
      throw new ValidationError('Invalid component data', validation.error);
    }
    
    return validation.data;
  }
}
```

### 错误处理体系

```typescript
// errors/NetworkError.ts
export class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any,
    public request?: any
  ) {
    super(message);
    this.name = 'NetworkError';
  }
  
  static fromAxiosError(error: AxiosError): NetworkError {
    return new NetworkError(
      error.message,
      error.response?.status,
      error.response?.data,
      error.config
    );
  }
}

// 错误分类和处理
export class ErrorHandler {
  static classify(error: Error): ErrorCategory {
    if (error instanceof NetworkError) {
      if (error.statusCode === 401) return 'auth';
      if (error.statusCode === 403) return 'permission';
      if (error.statusCode >= 500) return 'server';
      if (error.statusCode >= 400) return 'client';
    }
    
    if (error.name === 'ValidationError') return 'validation';
    if (error.message.includes('network')) return 'network';
    
    return 'unknown';
  }
  
  static getRetryable(category: ErrorCategory): boolean {
    return ['network', 'server'].includes(category);
  }
  
  static getUserMessage(error: Error): string {
    const category = this.classify(error);
    
    switch (category) {
      case 'auth':
        return '请重新登录';
      case 'permission':
        return '您没有权限执行此操作';
      case 'network':
        return '网络连接异常，请检查网络设置';
      case 'server':
        return '服务器暂时无法响应，请稍后重试';
      case 'validation':
        return '数据格式错误，请检查输入';
      default:
        return '发生未知错误，请联系技术支持';
    }
  }
}
```

### 拦截器系统

```typescript
// interceptors/auth.ts
export class AuthInterceptor {
  constructor(private authManager: AuthManager) {}
  
  // 请求拦截器
  async interceptRequest(config: RequestConfig): Promise<RequestConfig> {
    const token = this.authManager.getAccessToken();
    
    if (token && this.authManager.isTokenValid()) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
    }
    
    return config;
  }
  
  // 响应拦截器
  async interceptResponse(error: any): Promise<any> {
    if (error.response?.status === 401) {
      // Token过期，尝试刷新
      try {
        await this.authManager.refreshToken();
        // 重新发送原请求
        return this.retryOriginalRequest(error.config);
      } catch (refreshError) {
        // 刷新失败，跳转到登录页
        this.authManager.logout();
        throw new AuthError('Token refresh failed');
      }
    }
    
    throw error;
  }
}

// interceptors/cache.ts
export class CacheInterceptor {
  constructor(private cacheManager: CacheManager) {}
  
  async interceptRequest(config: RequestConfig): Promise<RequestConfig> {
    if (config.method === 'GET' && config.cache !== false) {
      const cacheKey = this.generateCacheKey(config);
      const cached = await this.cacheManager.get(cacheKey);
      
      if (cached && !this.cacheManager.isExpired(cached)) {
        // 返回缓存数据
        throw new CacheHit(cached.data);
      }
    }
    
    return config;
  }
  
  async interceptResponse(response: any, config: RequestConfig): Promise<any> {
    if (config.method === 'GET' && config.cache !== false) {
      const cacheKey = this.generateCacheKey(config);
      await this.cacheManager.set(cacheKey, response.data, {
        ttl: config.cacheTTL
      });
    }
    
    return response;
  }
}
```

## 🧪 测试策略

### 单元测试

```typescript
// tests/clients.test.ts
describe('RestClient', () => {
  let client: RestClient;
  let mockAxios: jest.Mocked<typeof axios>;
  
  beforeEach(() => {
    mockAxios = axios as jest.Mocked<typeof axios>;
    client = new RestClient({ baseURL: 'https://api.test.com' });
  });
  
  it('应该正确处理GET请求', async () => {
    const mockData = { id: 'comp_123', title: 'Test Component' };
    mockAxios.get.mockResolvedValue({ data: mockData });
    
    const result = await client.get('/components/comp_123');
    
    expect(mockAxios.get).toHaveBeenCalledWith('/components/comp_123', expect.any(Object));
    expect(result).toEqual(mockData);
  });
  
  it('应该处理网络错误', async () => {
    mockAxios.get.mockRejectedValue(new AxiosError('Network Error'));
    
    await expect(client.get('/components/comp_123')).rejects.toThrow(NetworkError);
  });
});
```

### 集成测试

```typescript
// tests/integration.test.ts
describe('API Client Integration', () => {
  it('应该能够完整的认证流程', async () => {
    const auth = new AuthManager({ /* config */ });
    const client = new RestClient({ /* config */ });
    
    // 设置认证信息
    await auth.setCredentials({
      accessToken: 'valid-token',
      refreshToken: 'refresh-token'
    });
    
    // 发送认证请求
    const response = await client.get('/user/profile');
    
    expect(response.data).toBeDefined();
    expect(auth.isTokenValid()).toBe(true);
  });
  
  it('应该能够处理WebSocket实时通信', async () => {
    const ws = new WebSocketClient({ url: 'ws://localhost:3001' });
    
    await ws.connect();
    await ws.joinRoom('test-room');
    
    const messagePromise = new Promise((resolve) => {
      ws.on('test:message', resolve);
    });
    
    await ws.send('test:message', { data: 'test' });
    
    const message = await messagePromise;
    expect(message).toBeDefined();
  });
});
```

### Mock测试

```typescript
// tests/mocks/api.ts
export const createMockAPI = () => {
  const mock = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    request: jest.fn()
  };
  
  // 模拟成功响应
  mock.get.mockImplementation((url) => {
    if (url.includes('/components/')) {
      return Promise.resolve({
        data: {
          id: 'comp_123',
          title: 'Mock Component',
          content: 'Mock content'
        }
      });
    }
  });
  
  return mock;
};
```

## 📊 性能优化

### 请求优化

```typescript
// 请求去重
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();
  
  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }
    
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });
    
    this.pendingRequests.set(key, promise);
    return promise;
  }
}

// 批量请求
class BatchRequestManager {
  private batchQueue: BatchRequest[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  
  addToBatch(request: BatchRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ ...request, resolve, reject });
      
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => this.processBatch(), 10);
      }
    });
  }
  
  private async processBatch(): Promise<void> {
    const batch = this.batchQueue.splice(0);
    this.batchTimer = null;
    
    if (batch.length === 0) return;
    
    try {
      const results = await this.executeBatch(batch);
      batch.forEach((req, index) => {
        req.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(req => req.reject(error));
    }
  }
}
```

### 缓存优化

```typescript
// 多级缓存策略
class MultiLevelCache {
  constructor(
    private memoryCache: MemoryCache,
    private localStorageCache: LocalStorageCache,
    private indexedDBCache: IndexedDBCache
  ) {}
  
  async get(key: string): Promise<any> {
    // L1: 内存缓存
    let value = await this.memoryCache.get(key);
    if (value) return value;
    
    // L2: LocalStorage缓存
    value = await this.localStorageCache.get(key);
    if (value) {
      await this.memoryCache.set(key, value); // 回写到L1
      return value;
    }
    
    // L3: IndexedDB缓存
    value = await this.indexedDBCache.get(key);
    if (value) {
      await this.localStorageCache.set(key, value); // 回写到L2
      await this.memoryCache.set(key, value);       // 回写到L1
      return value;
    }
    
    return null;
  }
  
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    // 同时写入所有级别
    await Promise.all([
      this.memoryCache.set(key, value, options),
      this.localStorageCache.set(key, value, options),
      this.indexedDBCache.set(key, value, options)
    ]);
  }
}
```

## 🔒 安全考虑

### Token安全

```typescript
// 安全的Token存储
class SecureTokenStorage {
  private readonly ENCRYPTION_KEY = 'your-encryption-key';
  
  async setToken(token: string): Promise<void> {
    const encrypted = await this.encrypt(token);
    localStorage.setItem('auth_token', encrypted);
  }
  
  async getToken(): Promise<string | null> {
    const encrypted = localStorage.getItem('auth_token');
    if (!encrypted) return null;
    
    try {
      return await this.decrypt(encrypted);
    } catch {
      // 解密失败，可能是伪造的token
      this.clearToken();
      return null;
    }
  }
  
  clearToken(): void {
    localStorage.removeItem('auth_token');
  }
  
  private async encrypt(data: string): Promise<string> {
    // 使用Web Crypto API加密
    // 实现加密逻辑
  }
  
  private async decrypt(encryptedData: string): Promise<string> {
    // 使用Web Crypto API解密
    // 实现解密逻辑
  }
}
```

### 请求安全

```typescript
// CSRF保护
class CSRFProtection {
  private csrfToken: string | null = null;
  
  async getCSRFToken(): Promise<string> {
    if (!this.csrfToken) {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      this.csrfToken = data.token;
    }
    return this.csrfToken;
  }
  
  async addCSRFHeader(config: RequestConfig): Promise<RequestConfig> {
    if (['POST', 'PUT', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
      const token = await this.getCSRFToken();
      config.headers = {
        ...config.headers,
        'X-CSRF-Token': token
      };
    }
    return config;
  }
}
```

## 🎨 最佳实践

1. **错误边界**: 使用Error Boundary包装API调用
2. **重试策略**: 实现指数退避的重试机制
3. **超时设置**: 为所有请求设置合理的超时时间
4. **缓存策略**: 根据数据特性选择合适的缓存策略
5. **类型安全**: 始终使用TypeScript类型定义

## 🚨 注意事项

1. **内存泄漏**: 及时清理WebSocket连接和事件监听器
2. **并发控制**: 限制同时进行的请求数量
3. **敏感数据**: 不要在客户端缓存敏感数据
4. **CORS配置**: 确保服务端正确配置CORS策略

## 📈 版本历史

- **v1.0.0**: 初始版本，基础REST客户端
- **v1.1.0**: 添加WebSocket支持
- **v1.2.0**: 增加GraphQL客户端
- **v1.3.0**: 实现缓存和离线支持
- **v1.4.0**: 增强认证和安全功能
- **v2.0.0**: 重构架构，支持插件系统

## 🤝 贡献指南

1. 新增客户端类型需要完整的测试覆盖
2. 确保向后兼容性
3. 更新相关的TypeScript类型定义
4. 提供详细的使用示例和文档

## 📄 许可证

MIT License