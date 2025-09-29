# @sker/engine

AI处理引擎服务包 - 为@sker/studio提供强大的AI内容生成和语义分析能力。

## 系统架构位置

`@sker/engine` 是SKER系统的**AI处理引擎层**，负责所有AI相关的智能处理任务：

```
API网关 (@sker/gateway)
        ↓ HTTP调用
消息代理 (@sker/broker)
        ↓ 任务调度
📍 AI引擎 (@sker/engine) ← 当前模块
        ↓ 结果存储
数据存储 (@sker/store)
```

### 服务运行模式

**双模式运行**: @sker/engine 支持两种运行模式：

1. **独立API服务器模式**:
   ```bash
   # 独立运行，直接为前端提供AI服务
   npm run server:dev  # 默认端口: 8000
   ```

2. **消息队列集成模式**:
   ```
   Gateway → Broker → Engine → Store
   ```

### 服务间集成关系

- **任务接收**: 通过以下方式接收AI处理请求：
  - `@sker/broker`: 消息队列任务调度 (推荐生产环境)
  - HTTP API: 直接API调用 (开发和测试)
- **数据交互**:
  - `@sker/store`: 读取节点数据、存储处理结果
- **依赖关系**:
  ```json
  {
    "@sker/models": "workspace:*",
    "@sker/config": "workspace:*",
    "@sker/ai": "workspace:*"
  }
  ```

## 🎯 核心功能

### LLM集成管理
- **多模型支持**: 集成OpenAI GPT-4、GPT-3.5-turbo等主流模型
- **智能模型选择**: 根据任务类型自动选择最适合的模型
- **负载均衡**: 分配请求到不同的API端点和模型
- **成本优化**: 智能选择成本效益最优的模型组合

### 智能内容生成
- **文本生成**: 基于输入和上下文生成高质量内容
- **内容优化**: 改进现有内容的质量、结构和表达
- **多输入融合**: 将多个内容源智能融合为统一输出
- **扩展生成**: 基于现有内容进行相关扩展和深化

### 语义分析处理
- **语义理解**: 深度分析内容的语义结构和含义
- **标签提取**: 自动识别和提取内容的关键标签
- **重要性评估**: 智能评估内容的重要性等级
- **置信度计算**: 评估AI生成内容的可信度

### 提示词工程
- **模板管理**: 预定义和管理各种任务的提示词模板
- **动态构建**: 根据上下文动态构建最优提示词
- **A/B测试**: 测试不同提示词的效果差异
- **持续优化**: 基于反馈持续改进提示词质量

## 📦 主要模块

### AI Processing Engine
```typescript
import { AIEngine } from '@sker/engine'

const engine = new AIEngine({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  models: {
    generation: 'gpt-4',
    optimization: 'gpt-3.5-turbo',
    analysis: 'gpt-4'
  }
})

// 处理AI任务 - 使用统一的任务类型
const result = await engine.processTask({
  type: 'generate',  // 统一任务类型: 'generate' | 'optimize' | 'fusion' | 'analyze' | 'expand'
  inputs: ['用户输入内容'],
  context: '上下文信息'
})
```

### Content Generator
```typescript
import { ContentGenerator } from '@sker/engine'

const generator = new ContentGenerator(engine)

// 生成内容
const content = await generator.generate({
  prompt: '基于以下信息生成分析报告',
  inputs: ['数据1', '数据2'],
  style: 'professional',
  length: 'medium'
})
```

### Semantic Analyzer
```typescript
import { SemanticAnalyzer } from '@sker/engine'

const analyzer = new SemanticAnalyzer(engine)

// 语义分析
const analysis = await analyzer.analyze(content, {
  extractTags: true,
  assessImportance: true,
  calculateConfidence: true
})
```

## 🔧 处理类型

> **重要**: 从 v2.0 开始，所有任务类型已统一为 `@sker/models` 包中的定义，确保与broker服务的完全兼容。

### 内容生成 (Generate)
- **创意写作**: 基于主题生成创意内容
- **技术文档**: 生成技术说明和文档
- **分析报告**: 基于数据生成分析结论
- **解决方案**: 针对问题提供解决方案

### 内容优化 (Optimize)
- **语言改进**: 提升表达的清晰度和流畅性
- **结构优化**: 改善内容的逻辑结构
- **风格调整**: 调整内容风格以适应特定场景
- **长度控制**: 扩展或压缩内容长度

### 多输入融合 (Fusion)
- **综合分析**: 融合多个分析结果
- **观点整合**: 整合不同角度的观点
- **数据汇总**: 汇总多源数据的洞察
- **决策支持**: 基于多输入提供决策建议

### 语义分析 (Analyze)
- **内容理解**: 深度分析内容的语义结构
- **关键词提取**: 识别和提取核心概念
- **情感分析**: 分析文本的情感倾向
- **主题识别**: 识别文本的主要主题

### 内容扩展 (Expand)
- **深度挖掘**: 深入探讨特定主题
- **相关扩展**: 扩展相关的主题和概念
- **案例补充**: 添加相关案例和实例
- **细节完善**: 补充重要的细节信息

## 🚀 使用方式

### 基础使用
```typescript
import { createEngine } from '@sker/engine'

const engine = await createEngine({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  defaultModel: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000
})

// 处理生成任务
const result = await engine.processGeneration({
  inputs: ['我想创建一个电商网站'],
  instruction: '分析技术需求和实现方案',
  context: '面向中小企业的解决方案'
})

console.log('Generated content:', result.content)
console.log('Confidence:', result.confidence)
console.log('Tags:', result.tags)
```

### 高级配置
```typescript
import { AIEngine, PromptTemplate } from '@sker/engine'

// 自定义提示词模板
const customTemplate = new PromptTemplate({
  name: 'business_analysis',
  template: `
作为一名专业的商业分析师，请基于以下信息：

输入内容：
{inputs}

上下文：
{context}

请从以下角度进行分析：
1. 市场机会
2. 技术可行性
3. 资源需求
4. 风险评估

指导要求：
{instruction}

请提供结构化的分析报告。
  `,
  variables: ['inputs', 'context', 'instruction']
})

const engine = new AIEngine({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  templates: [customTemplate],
  retryConfig: {
    maxRetries: 3,
    backoffMultiplier: 2
  }
})

// 使用自定义模板
const result = await engine.processWithTemplate('business_analysis', {
  inputs: ['开发移动应用'],
  context: '餐饮行业数字化转型',
  instruction: '重点关注投资回报率'
})
```

### 批量处理
```typescript
import { BatchProcessor } from '@sker/engine'

const processor = new BatchProcessor(engine)

// 批量处理多个任务
const results = await processor.processBatch([
  {
    type: 'generate',
    inputs: ['需求1'],
    instruction: '生成技术方案'
  },
  {
    type: 'analyze',
    inputs: ['现有方案'],
    instruction: '分析可行性'
  },
  {
    type: 'optimize',
    inputs: ['初稿内容'],
    instruction: '优化表达和结构'
  }
], {
  concurrency: 3,
  failFast: false
})

results.forEach((result, index) => {
  if (result.success) {
    console.log(`Task ${index} completed:`, result.content)
  } else {
    console.error(`Task ${index} failed:`, result.error)
  }
})
```

## 📋 处理结果格式

### 标准处理结果
```typescript
interface ProcessingResult {
  success: boolean
  content: string
  title?: string
  confidence: number
  tags: string[]
  reasoning?: string
  metadata: {
    model: string
    tokenCount: number
    processingTime: number
    temperature: number
    cost?: number
  }
  error?: {
    code: string
    message: string
    details?: any
  }
}
```

### 语义分析结果
```typescript
interface SemanticAnalysis {
  semanticType: string
  importanceLevel: number
  keyTerms: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  complexity: 'low' | 'medium' | 'high'
  readability: number
  topics: Array<{
    name: string
    relevance: number
  }>
}
```

## 🔧 配置说明

```typescript
interface EngineConfig {
  provider: 'openai' | 'anthropic' | 'custom'
  apiKey: string
  baseURL?: string
  organization?: string
  models: {
    generation?: string
    optimization?: string
    analysis?: string
    fusion?: string
  }
  defaultModel: string
  temperature: number
  maxTokens: number
  timeout: number
  retryConfig: {
    maxRetries: number
    backoffMultiplier: number
    retryableErrors: string[]
  }
  costOptimization: {
    enabled: boolean
    maxCostPerRequest: number
    preferredModels: string[]
  }
}
```

## 🛡️ 安全和质量

- **内容过滤**: 自动检测和过滤不当内容
- **输入验证**: 严格验证输入参数和格式
- **输出校验**: 验证AI输出的质量和相关性
- **隐私保护**: 确保敏感信息不会泄露
- **成本控制**: 监控和控制API调用成本

## 🌐 Studio API 服务器

@sker/engine 现在提供了完整的 API 服务器功能，可以直接为前端 Studio 应用提供服务。

### 快速启动 API 服务器

```bash
# 1. 复制环境变量配置
cp .env.example .env

# 2. 配置你的 OpenAI API Key
echo "OPENAI_API_KEY=your-api-key" >> .env

# 3. 启动服务器
npm run server

# 开发模式（支持热重载）
npm run server:dev
```

### API 端点

服务器默认运行在 `http://localhost:8000`，提供以下端点：

#### 健康检查
- `GET /health` - 检查服务器和AI引擎状态

#### AI 处理接口
- `POST /api/ai/generate` - 生成AI内容
- `POST /api/ai/optimize` - 优化现有内容
- `POST /api/ai/fusion` - 多输入融合生成
- `POST /api/ai/title` - 生成标题
- `POST /api/ai/tags` - 提取标签
- `POST /api/ai/batch` - 批量处理
- `POST /api/ai/semantics` - 语义分析
- `POST /api/ai/node/optimize` - 节点优化

#### 状态查询
- `GET /api/ai/status/:nodeId` - 获取处理状态
- `GET /api/ai/stats` - 获取引擎统计信息
- `GET /api/ai/models` - 获取可用模型列表

### API 使用示例

```typescript
// 生成内容
const response = await fetch('http://localhost:8000/api/ai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    inputs: ['我想创建一个 AI 助手'],
    context: '智能客服系统',
    instruction: '分析技术实现方案',
    options: {
      temperature: 0.7,
      maxTokens: 2000,
      model: 'gpt-4'
    }
  })
})

const result = await response.json()
console.log(result.data.content)
```

### 与前端 Studio 集成

前端 aiService 配置：

```typescript
// apps/studio/src/services/aiService.ts
const defaultConfig: AIServiceConfig = {
  apiUrl: 'http://localhost:8000/api/ai',
  model: 'gpt-4',
  timeout: 30000,
  maxRetries: 3,
}
```

### 编程式使用

```typescript
import { createAndStartStudioAPIServer, AIEngine } from '@sker/engine'

// 创建 AI 引擎
const aiEngine = new AIEngine({
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  }
})

// 启动 API 服务器
const server = await createAndStartStudioAPIServer(aiEngine, {
  port: 8000,
  cors: {
    origin: ['http://localhost:3000']
  }
})

console.log('Server running at http://localhost:8000')
```

## 📊 监控指标

- 处理成功率和失败率
- 平均处理时间和响应延迟
- Token使用量和成本统计
- 模型性能和准确度
- 错误类型和频率分析
- API 请求统计和性能监控

## 🔧 环境变量配置

```bash
# AI 引擎配置
OPENAI_API_KEY=your-openai-api-key
OPENAI_DEFAULT_MODEL=gpt-3.5-turbo
OPENAI_TIMEOUT=30000

# 服务器配置
STUDIO_API_PORT=8000
STUDIO_API_HOST=0.0.0.0
STUDIO_CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# 缓存和限流
CACHE_ENABLED=true
RATE_LIMIT_ENABLED=true
RATE_LIMIT_RPM=60

# 开发环境
NODE_ENV=development
```

为@sker/studio提供强大、可靠、高效的AI处理能力，让智能内容生成变得简单而精确。