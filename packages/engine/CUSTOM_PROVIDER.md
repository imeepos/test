# 自定义Provider使用指南

AI Engine 现在支持自定义 AI Provider，包括 OpenAI 兼容的 API 和完全自定义的实现。

## 方法1: OpenAI兼容的自定义API

如果你的API兼容OpenAI格式，可以直接使用现有的OpenAI provider：

### 配置方式

1. **环境变量配置** (.env文件):
```env
USE_CUSTOM_PROVIDER=true
OPENAI_API_KEY=your-custom-api-key
OPENAI_BASE_URL=https://your-custom-api.com/v1
OPENAI_DEFAULT_MODEL=your-model-name
```

2. **代码配置**:
```javascript
const aiEngine = new AIEngine({
  provider: 'custom',
  apiKey: 'your-custom-api-key',
  baseURL: 'https://your-custom-api.com/v1',
  defaultModel: 'your-model-name',
  temperature: 0.7,
  maxTokens: 4000,
  timeout: 30000,
  models: {
    generation: 'your-model-name',
    optimization: 'your-model-name',
    analysis: 'your-model-name',
    fusion: 'your-model-name'
  },
  retryConfig: {
    maxRetries: 3,
    backoffMultiplier: 2,
    retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT']
  },
  customConfig: {
    apiFormat: 'openai-compatible' // 默认值，可以省略
  }
})
```

## 方法2: 完全自定义的Provider

如果你的API格式完全不同，需要实现自定义Provider：

### 1. 实现AIProvider接口

```javascript
class MyCustomProvider {
  name = 'MyCustomProvider'

  async generate(request) {
    // 实现内容生成逻辑
    return {
      content: 'generated content',
      confidence: 0.9,
      tags: [],
      metadata: {
        model: 'custom-model',
        tokenCount: 100,
        processingTime: 1000,
        temperature: 0.7,
        requestId: 'uuid',
        timestamp: new Date()
      }
    }
  }

  async optimize(request) {
    // 实现内容优化逻辑
  }

  async analyze(content, options) {
    // 实现语义分析逻辑
  }

  async countTokens(text) {
    // 实现token计数逻辑
    return text.length / 4 // 简单估算
  }

  validateRequest(request) {
    // 实现请求验证逻辑
    return true
  }

  getAvailableModels() {
    // 返回可用模型列表
    return ['custom-model-1', 'custom-model-2']
  }

  async initialize() {
    // 可选：初始化逻辑
  }

  async cleanup() {
    // 可选：清理逻辑
  }
}
```

### 2. 使用自定义Provider

```javascript
const customProvider = new MyCustomProvider()

const aiEngine = new AIEngine({
  provider: 'custom',
  apiKey: '', // 可以为空，因为有customProvider
  defaultModel: 'custom-model',
  temperature: 0.7,
  maxTokens: 4000,
  timeout: 30000,
  models: {
    generation: 'custom-model'
  },
  retryConfig: {
    maxRetries: 3,
    backoffMultiplier: 2,
    retryableErrors: []
  },
  customProvider: customProvider,
  customConfig: {
    apiFormat: 'custom'
  }
})
```

## 支持的自定义API示例

### 1. Ollama (本地部署)
```env
USE_CUSTOM_PROVIDER=true
OPENAI_API_KEY=ollama
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_DEFAULT_MODEL=llama2
```

### 2. LM Studio
```env
USE_CUSTOM_PROVIDER=true
OPENAI_API_KEY=lm-studio
OPENAI_BASE_URL=http://localhost:1234/v1
OPENAI_DEFAULT_MODEL=local-model
```

### 3. Text Generation WebUI
```env
USE_CUSTOM_PROVIDER=true
OPENAI_API_KEY=webui
OPENAI_BASE_URL=http://localhost:5000/v1
OPENAI_DEFAULT_MODEL=gpt-3.5-turbo
```

## 配置验证

系统会自动验证配置：

- 对于OpenAI兼容格式：需要 `apiKey` 和 `baseURL`
- 对于完全自定义格式：需要 `customProvider` 实例
- Provider实例必须实现所有必需的方法
- 会提供配置警告和错误提示

## 错误处理

配置错误会在创建AIEngine时抛出详细的错误信息：

```javascript
try {
  const aiEngine = new AIEngine(config)
} catch (error) {
  console.error('配置错误:', error.message)
  // 例如: "配置验证失败: 使用自定义provider时，如果未提供customProvider实例，则apiKey是必需的"
}
```