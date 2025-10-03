# 📚 SKER API 参考文档

SKER AI协作画布平台提供了完整的RESTful API和WebSocket接口，支持所有核心功能的编程访问。

## 🔐 认证授权

### JWT 认证

所有API请求都需要在Header中携带JWT token：

```http
Authorization: Bearer <your_jwt_token>
```

### 获取访问令牌

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### 刷新令牌

```http
POST /api/auth/refresh
Authorization: Bearer <your_jwt_token>
```

## 🎨 画布管理 API

### 项目管理

#### 获取项目列表

```http
GET /api/projects
Authorization: Bearer <token>
```

**查询参数:**
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20, 最大: 100)
- `search`: 搜索关键词
- `sort`: 排序字段 (`created_at`, `updated_at`, `name`)
- `order`: 排序方向 (`asc`, `desc`)

**响应:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "proj_123",
        "name": "我的项目",
        "description": "项目描述",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-02T00:00:00Z",
        "node_count": 15,
        "edge_count": 8,
        "thumbnail": "https://example.com/thumb.jpg"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

#### 创建项目

```http
POST /api/projects
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "新项目",
  "description": "项目描述"
}
```

#### 获取项目详情

```http
GET /api/projects/{project_id}
Authorization: Bearer <token>
```

#### 更新项目

```http
PUT /api/projects/{project_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "更新的项目名称",
  "description": "更新的描述"
}
```

#### 删除项目

```http
DELETE /api/projects/{project_id}
Authorization: Bearer <token>
```

### 节点管理

#### 获取节点列表

```http
GET /api/projects/{project_id}/nodes
Authorization: Bearer <token>
```

**查询参数:**
- `type`: 节点类型过滤
- `search`: 内容搜索
- `page`: 页码
- `limit`: 每页数量

#### 创建节点

```http
POST /api/projects/{project_id}/nodes
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "text",
  "title": "节点标题",
  "content": "节点内容",
  "position": {
    "x": 100,
    "y": 200
  },
  "style": {
    "width": 200,
    "height": 150,
    "backgroundColor": "#ffffff",
    "borderColor": "#cccccc"
  },
  "metadata": {
    "tags": ["重要", "待处理"],
    "priority": "high"
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "node": {
      "id": "node_123",
      "type": "text",
      "title": "节点标题",
      "content": "节点内容",
      "position": { "x": 100, "y": 200 },
      "style": {
        "width": 200,
        "height": 150,
        "backgroundColor": "#ffffff",
        "borderColor": "#cccccc"
      },
      "metadata": {
        "tags": ["重要", "待处理"],
        "priority": "high"
      },
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z",
      "version": 1
    }
  }
}
```

#### 更新节点

```http
PUT /api/projects/{project_id}/nodes/{node_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "更新的标题",
  "content": "更新的内容",
  "position": {
    "x": 150,
    "y": 250
  }
}
```

#### 删除节点

```http
DELETE /api/projects/{project_id}/nodes/{node_id}
Authorization: Bearer <token>
```

#### 获取节点版本历史

```http
GET /api/projects/{project_id}/nodes/{node_id}/versions
Authorization: Bearer <token>
```

**响应:**
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "version": 3,
        "content": "最新内容",
        "created_at": "2024-01-03T00:00:00Z",
        "changes_summary": "更新了内容和标题"
      },
      {
        "version": 2,
        "content": "之前的内容",
        "created_at": "2024-01-02T00:00:00Z",
        "changes_summary": "修改了样式"
      }
    ]
  }
}
```

### 连线管理

#### 获取连线列表

```http
GET /api/projects/{project_id}/edges
Authorization: Bearer <token>
```

#### 创建连线

```http
POST /api/projects/{project_id}/edges
Content-Type: application/json
Authorization: Bearer <token>

{
  "source_id": "node_123",
  "target_id": "node_456",
  "type": "bezier",
  "label": "连线标签",
  "style": {
    "strokeColor": "#666666",
    "strokeWidth": 2,
    "strokeDasharray": "5,5"
  },
  "metadata": {
    "relationship": "depends_on",
    "strength": "strong"
  }
}
```

#### 获取连线建议

```http
POST /api/projects/{project_id}/nodes/{node_id}/suggest-connections
Content-Type: application/json
Authorization: Bearer <token>

{
  "options": {
    "enable_semantic": true,
    "enable_similarity": true,
    "min_confidence": 0.5,
    "max_suggestions": 10
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "target_id": "node_456",
        "type": "semantic",
        "confidence": 0.85,
        "reasoning": "两个节点具有相似的语义内容",
        "strength": "strong"
      }
    ]
  }
}
```

## 🤖 AI 服务 API

### 内容生成

#### 生成文本内容

```http
POST /api/ai/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "inputs": ["这是为技术博客准备的内容"],
  "instruction": "写一篇关于人工智能的短文",
  "type": "generate",
  "context": "目标读者是技术从业者",
  "options": {
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 500
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "content": "人工智能正在改变我们的世界...",
    "title": "人工智能的发展趋势",
    "confidence": 0.92,
    "tags": ["AI", "技术", "未来"],
    "metadata": {
      "model": "gpt-4",
      "tokens_used": 456,
      "processing_time": 1200,
      "cost": 0.012
    }
  }
}
```

#### 优化内容

```http
POST /api/ai/optimize
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "原始内容文本",
  "instruction": "让这段文字更加简洁明了",
  "options": {
    "target_style": "concise",
    "target_length": "shorter",
    "preserve_meaning": true
  }
}
```

#### 内容融合

```http
POST /api/ai/fusion
Content-Type: application/json
Authorization: Bearer <token>

{
  "inputs": [
    "第一个输入内容",
    "第二个输入内容",
    "第三个输入内容"
  ],
  "instruction": "将这些内容融合成一个完整的方案",
  "options": {
    "fusion_type": "synthesis",
    "output_format": "structured"
  }
}
```

### 语义分析

#### 分析文本语义

```http
POST /api/ai/analyze
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "要分析的文本内容",
  "options": {
    "extract_tags": true,
    "assess_importance": true,
    "analyze_sentiment": true,
    "detect_topics": true,
    "extract_entities": true
  }
}
```

**响应:**
```json
{
  "success": true,
  "data": {
    "semantic_type": "技术文档",
    "importance_level": 8,
    "key_terms": ["AI", "机器学习", "深度学习"],
    "sentiment": "positive",
    "sentiment_score": 0.75,
    "complexity": "medium",
    "readability": 7,
    "topics": [
      {
        "name": "人工智能",
        "relevance": 0.9,
        "confidence": 0.95
      }
    ],
    "entities": [
      {
        "text": "OpenAI",
        "type": "ORG",
        "confidence": 0.98
      }
    ],
    "tags": ["技术", "AI", "创新"],
    "confidence": 0.88
  }
}
```

### 代码生成

#### 生成代码

```http
POST /api/ai/generate-code
Content-Type: application/json
Authorization: Bearer <token>

{
  "description": "创建一个React组件来显示用户信息",
  "language": "typescript",
  "framework": "react",
  "options": {
    "include_types": true,
    "include_tests": false,
    "style": "functional"
  }
}
```

#### 代码审查

```http
POST /api/ai/review-code
Content-Type: application/json
Authorization: Bearer <token>

{
  "code": "function example() { ... }",
  "language": "javascript",
  "options": {
    "check_security": true,
    "check_performance": true,
    "check_style": true
  }
}
```

## 🔌 插件 API

### 插件管理

#### 获取插件列表

```http
GET /api/plugins
Authorization: Bearer <token>
```

**查询参数:**
- `type`: 插件类型 (`component`, `ai-processor`, `exporter`, `tool`, `theme`)
- `status`: 插件状态 (`active`, `inactive`, `installed`)
- `search`: 搜索关键词

#### 安装插件

```http
POST /api/plugins/install
Content-Type: application/json
Authorization: Bearer <token>

{
  "plugin_id": "example-plugin",
  "version": "1.0.0",
  "source": "marketplace"
}
```

#### 激活/停用插件

```http
POST /api/plugins/{plugin_id}/activate
Authorization: Bearer <token>
```

```http
POST /api/plugins/{plugin_id}/deactivate
Authorization: Bearer <token>
```

#### 卸载插件

```http
DELETE /api/plugins/{plugin_id}
Authorization: Bearer <token>
```

### 插件通信

#### 调用插件API

```http
POST /api/plugins/{plugin_id}/call
Content-Type: application/json
Authorization: Bearer <token>

{
  "method": "processContent",
  "params": {
    "content": "要处理的内容",
    "options": {}
  }
}
```

#### 插件事件订阅

```http
POST /api/plugins/events/subscribe
Content-Type: application/json
Authorization: Bearer <token>

{
  "events": ["canvas.node.created", "canvas.edge.created"],
  "callback_url": "https://your-app.com/webhook"
}
```

## 💾 存储 API

### 文件上传

#### 上传文件

```http
POST /api/storage/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: (binary file data)
```

**响应:**
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "file_123",
      "filename": "document.pdf",
      "size": 1048576,
      "mime_type": "application/pdf",
      "url": "https://storage.example.com/files/file_123.pdf",
      "thumbnail": "https://storage.example.com/thumbs/file_123.jpg",
      "created_at": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### 获取文件信息

```http
GET /api/storage/files/{file_id}
Authorization: Bearer <token>
```

#### 删除文件

```http
DELETE /api/storage/files/{file_id}
Authorization: Bearer <token>
```

### 导出功能

#### 导出项目

```http
POST /api/projects/{project_id}/export
Content-Type: application/json
Authorization: Bearer <token>

{
  "format": "json",
  "options": {
    "include_metadata": true,
    "include_versions": false,
    "compression": "gzip"
  }
}
```

**支持的导出格式:**
- `json`: JSON格式
- `markdown`: Markdown文档
- `pdf`: PDF文件
- `svg`: SVG图像
- `png`: PNG图像

## 📊 分析统计 API

### 项目统计

#### 获取项目统计

```http
GET /api/projects/{project_id}/stats
Authorization: Bearer <token>
```

**响应:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "node_count": 25,
      "edge_count": 15,
      "total_words": 1500,
      "avg_node_connections": 2.4,
      "most_connected_node": "node_123",
      "creation_timeline": [
        {
          "date": "2024-01-01",
          "nodes_created": 5,
          "edges_created": 3
        }
      ],
      "node_types": {
        "text": 20,
        "image": 3,
        "link": 2
      }
    }
  }
}
```

### 使用分析

#### 获取使用统计

```http
GET /api/analytics/usage
Authorization: Bearer <token>
```

**查询参数:**
- `start_date`: 开始日期
- `end_date`: 结束日期
- `granularity`: 粒度 (`hour`, `day`, `week`, `month`)

## 🔔 通知和事件

### WebSocket 连接

连接到 WebSocket 服务器：

```javascript
const ws = new WebSocket('ws://localhost:3004/socket.io/?token=your_jwt_token')

ws.on('connect', () => {
  console.log('Connected to SKER WebSocket')
})

ws.on('message', (data) => {
  const event = JSON.parse(data)
  console.log('Received event:', event)
})
```

### 实时事件类型

#### 画布事件

```json
{
  "type": "canvas.node.created",
  "data": {
    "project_id": "proj_123",
    "node": {
      "id": "node_456",
      "type": "text",
      "title": "新节点"
    },
    "user": {
      "id": "user_123",
      "name": "John Doe"
    },
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

```json
{
  "type": "canvas.node.updated",
  "data": {
    "project_id": "proj_123",
    "node_id": "node_456",
    "changes": {
      "title": "更新的标题",
      "content": "更新的内容"
    },
    "user": {
      "id": "user_123",
      "name": "John Doe"
    },
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### AI 处理事件

```json
{
  "type": "ai.generation.started",
  "data": {
    "request_id": "req_123",
    "node_id": "node_456",
    "instruction": "生成内容的提示",
    "context": "相关背景信息"
  }
}
```

```json
{
  "type": "ai.generation.completed",
  "data": {
    "request_id": "req_123",
    "node_id": "node_456",
    "result": {
      "content": "生成的内容",
      "confidence": 0.85
    }
  }
}
```

#### 协作事件

```json
{
  "type": "collaboration.user.joined",
  "data": {
    "project_id": "proj_123",
    "user": {
      "id": "user_456",
      "name": "Jane Doe",
      "avatar": "https://example.com/avatar.jpg"
    }
  }
}
```

```json
{
  "type": "collaboration.cursor.moved",
  "data": {
    "project_id": "proj_123",
    "user_id": "user_456",
    "cursor": {
      "x": 100,
      "y": 200
    }
  }
}
```

### 通知管理

#### 获取通知列表

```http
GET /api/notifications
Authorization: Bearer <token>
```

**查询参数:**
- `read`: 是否已读 (`true`, `false`)
- `type`: 通知类型
- `limit`: 数量限制

#### 标记通知已读

```http
PUT /api/notifications/{notification_id}/read
Authorization: Bearer <token>
```

## 🔧 系统管理 API

### 健康检查

```http
GET /api/health
```

**响应:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "rabbitmq": "healthy",
    "ai_service": "healthy"
  },
  "version": "1.0.0",
  "uptime": 86400
}
```

### 系统信息

```http
GET /api/system/info
Authorization: Bearer <admin_token>
```

### 日志查询

```http
GET /api/system/logs
Authorization: Bearer <admin_token>
```

**查询参数:**
- `level`: 日志级别 (`error`, `warn`, `info`, `debug`)
- `service`: 服务名称
- `start_time`: 开始时间
- `end_time`: 结束时间
- `limit`: 数量限制

## 📝 错误处理

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "输入参数验证失败",
    "details": {
      "field": "email",
      "reason": "格式不正确"
    },
    "request_id": "req_123456789"
  }
}
```

### 常见错误码

| 错误码 | HTTP状态 | 描述 |
|--------|----------|------|
| `AUTHENTICATION_REQUIRED` | 401 | 需要身份认证 |
| `INVALID_TOKEN` | 401 | Token无效或已过期 |
| `PERMISSION_DENIED` | 403 | 权限不足 |
| `RESOURCE_NOT_FOUND` | 404 | 资源未找到 |
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `INTERNAL_SERVER_ERROR` | 500 | 服务器内部错误 |
| `AI_SERVICE_UNAVAILABLE` | 503 | AI服务不可用 |
| `STORAGE_QUOTA_EXCEEDED` | 507 | 存储空间不足 |

## 📊 速率限制

### 限制策略

| 接口类型 | 限制 | 窗口期 |
|----------|------|--------|
| 认证接口 | 5次/分钟 | 每IP |
| 标准API | 100次/分钟 | 每用户 |
| AI接口 | 20次/分钟 | 每用户 |
| 文件上传 | 10次/分钟 | 每用户 |
| WebSocket | 1000条/分钟 | 每连接 |

### 限制响应头

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🔗 SDK 和客户端库

### JavaScript/TypeScript SDK

```bash
npm install @sker/sdk
```

```typescript
import { SkerClient } from '@sker/sdk'

const client = new SkerClient({
  baseURL: 'https://api.sker.com',
  token: 'your_jwt_token'
})

// 创建项目
const project = await client.projects.create({
  name: '我的项目',
  description: '项目描述'
})

// 创建节点
const node = await client.nodes.create(project.id, {
  type: 'text',
  title: '节点标题',
  content: '节点内容',
  position: { x: 100, y: 100 }
})

// 生成AI内容
const result = await client.ai.generate({
  prompt: '写一首诗',
  options: { model: 'gpt-4' }
})
```

### Python SDK

```bash
pip install sker-python
```

```python
from sker import SkerClient

client = SkerClient(
    base_url='https://api.sker.com',
    token='your_jwt_token'
)

# 创建项目
project = client.projects.create(
    name='我的项目',
    description='项目描述'
)

# 创建节点
node = client.nodes.create(
    project_id=project['id'],
    data={
        'type': 'text',
        'title': '节点标题',
        'content': '节点内容',
        'position': {'x': 100, 'y': 100}
    }
)

# 生成AI内容
result = client.ai.generate(
    prompt='写一首诗',
    options={'model': 'gpt-4'}
)
```

## 📚 更多资源

- **API 调试工具**: [https://api.sker.com/docs](https://api.sker.com/docs) (Swagger UI)
- **Postman 集合**: [下载链接](https://api.sker.com/postman)
- **GraphQL Playground**: [https://api.sker.com/graphql](https://api.sker.com/graphql)
- **开发者指南**: [插件开发文档](./PLUGIN_DEVELOPMENT.md)
- **技术支持**: [developer@sker.com](mailto:developer@sker.com)

---

*本API文档持续更新，最新版本请参考在线文档。如有疑问，欢迎通过GitHub Issues或邮件联系我们。*
