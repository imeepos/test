# @sker/plugin-sdk

SKER 插件开发 SDK - 为第三方开发者提供完整的插件开发接口

## 概述

@sker/plugin-sdk 是 SKER 平台的官方插件开发套件，它为第三方开发者提供了强大的 API 接口，让您可以轻松创建各种类型的插件来扩展 SKER 画布的功能。

## 特性

- 🎯 **TypeScript 支持** - 完整的类型定义，提供出色的开发体验
- 🔌 **多种插件类型** - 支持组件、AI处理器、导出器、工具和主题插件
- 🎨 **Canvas API** - 强大的画布操作接口
- 🤖 **AI Service API** - 集成 AI 能力
- 📦 **存储 API** - 数据持久化和管理
- ⚡ **事件系统** - 灵活的事件驱动架构
- 🎭 **UI 助手** - 丰富的用户界面组件

## 安装

```bash
npm install @sker/plugin-sdk
# 或
pnpm add @sker/plugin-sdk
# 或
yarn add @sker/plugin-sdk
```

## 快速开始

### 创建第一个插件

```typescript
import { BasePlugin, Plugin, PluginContext } from '@sker/plugin-sdk'

@Plugin({
  id: 'my-first-plugin',
  name: 'My First Plugin',
  version: '1.0.0',
  description: '我的第一个 SKER 插件',
  type: 'component',
  permissions: ['canvas.read', 'canvas.write']
})
export default class MyFirstPlugin extends BasePlugin {
  async onActivate(context: PluginContext): Promise<void> {
    await super.onActivate(context)

    // 监听画布事件
    context.events.on('canvas.node.created', this.handleNodeCreated)

    // 显示欢迎消息
    context.ui.showNotification('插件已激活！', 'success')
  }

  private handleNodeCreated = (data: any) => {
    const context = this.getContext()
    context.log('info', '新节点已创建', data)
  }

  async onDeactivate(): Promise<void> {
    const context = this.getContext()
    context.events.off('canvas.node.created', this.handleNodeCreated)
    await super.onDeactivate()
  }
}
```

### 创建 AI 处理器插件

```typescript
import { BasePlugin, Plugin, PluginContext } from '@sker/plugin-sdk'

@Plugin({
  id: 'ai-text-enhancer',
  name: 'AI Text Enhancer',
  version: '1.0.0',
  type: 'ai-processor',
  permissions: ['ai.request', 'canvas.write']
})
export default class AITextEnhancer extends BasePlugin {
  async onActivate(context: PluginContext): Promise<void> {
    await super.onActivate(context)

    // 注册右键菜单
    context.events.on('canvas.node.rightclick', this.showContextMenu)
  }

  private showContextMenu = async (data: any) => {
    const context = this.getContext()

    const choice = await context.ui.showContextMenu(
      { x: data.x, y: data.y },
      [
        { id: 'enhance', label: '增强文本', icon: '✨' },
        { id: 'summarize', label: '生成摘要', icon: '📝' }
      ]
    )

    if (choice === 'enhance') {
      await this.enhanceText(data.nodeId)
    } else if (choice === 'summarize') {
      await this.summarizeText(data.nodeId)
    }
  }

  private async enhanceText(nodeId: string) {
    const context = this.getContext()

    try {
      // 获取节点内容
      const node = await context.canvas.getNode(nodeId)
      if (!node) return

      // 使用 AI 增强文本
      const enhancedText = await context.ai.optimizeText(
        node.content,
        'clarity'
      )

      // 更新节点内容
      await context.canvas.updateNode(nodeId, {
        content: enhancedText
      })

      context.ui.showSuccess('文本已增强！')
    } catch (error) {
      context.ui.showError('增强失败：' + error.message)
    }
  }
}
```

### 创建组件插件

```typescript
import { BasePlugin, Plugin, ComponentDefinition } from '@sker/plugin-sdk'

@Plugin({
  id: 'custom-button',
  name: 'Custom Button Component',
  version: '1.0.0',
  type: 'component'
})
export default class CustomButtonPlugin extends BasePlugin {
  async onActivate(context: PluginContext): Promise<void> {
    await super.onActivate(context)

    // 注册自定义组件
    const buttonComponent: ComponentDefinition = {
      name: 'Custom Button',
      description: '自定义按钮组件',
      category: 'UI Controls',
      icon: '🔘',
      props: [
        {
          name: 'text',
          type: 'string',
          label: '按钮文本',
          defaultValue: 'Click me',
          required: true
        },
        {
          name: 'color',
          type: 'color',
          label: '按钮颜色',
          defaultValue: '#007bff'
        },
        {
          name: 'size',
          type: 'select',
          label: '按钮大小',
          defaultValue: 'medium',
          options: [
            { label: '小', value: 'small' },
            { label: '中', value: 'medium' },
            { label: '大', value: 'large' }
          ]
        }
      ],
      defaultProps: {
        text: 'Click me',
        color: '#007bff',
        size: 'medium'
      },
      render: (props) => {
        const button = document.createElement('button')
        button.textContent = props.text
        button.style.backgroundColor = props.color
        button.style.padding = this.getSizePadding(props.size)
        button.style.border = 'none'
        button.style.borderRadius = '4px'
        button.style.color = 'white'
        button.style.cursor = 'pointer'

        button.addEventListener('click', () => {
          context.ui.showNotification('按钮被点击了！')
        })

        return button
      }
    }

    await context.components.registerComponent('custom-button', buttonComponent)
  }

  private getSizePadding(size: string): string {
    switch (size) {
      case 'small': return '4px 8px'
      case 'large': return '12px 24px'
      default: return '8px 16px'
    }
  }
}
```

## API 参考

### 核心接口

#### PluginContext

插件上下文提供了访问所有 API 的入口：

```typescript
interface PluginContext {
  canvas: CanvasAPI      // 画布操作
  components: ComponentAPI // 组件管理
  ai: AIServiceAPI       // AI 服务
  storage: StorageAPI    // 数据存储
  ui: UIHelperAPI        // UI 助手
  events: EventSystemAPI // 事件系统
}
```

#### PluginLifecycle

所有插件都必须实现的生命周期接口：

```typescript
interface PluginLifecycle {
  onInstall(): Promise<void>
  onActivate(context: PluginContext): Promise<void>
  onDeactivate(): Promise<void>
  onUninstall(): Promise<void>
}
```

### Canvas API

画布操作的核心接口：

```typescript
// 创建节点
const node = await context.canvas.createNode({
  type: 'text',
  title: '我的节点',
  content: '节点内容',
  position: { x: 100, y: 100 }
})

// 更新节点
await context.canvas.updateNode(nodeId, {
  content: '新的内容'
})

// 删除节点
await context.canvas.deleteNode(nodeId)

// 创建连接线
await context.canvas.createEdge({
  sourceId: 'node1',
  targetId: 'node2',
  type: 'bezier'
})
```

### AI Service API

AI 功能集成：

```typescript
// 生成文本
const text = await context.ai.generateText('写一首关于春天的诗')

// 分析文本
const analysis = await context.ai.analyzeText(text, 'sentiment')

// 优化文本
const optimized = await context.ai.optimizeText(text, 'clarity')

// 翻译文本
const translated = await context.ai.translateText(text, 'en')
```

### Storage API

数据存储和管理：

```typescript
// 存储数据
await context.storage.set('my-key', { foo: 'bar' })

// 获取数据
const data = await context.storage.get('my-key')

// 删除数据
await context.storage.delete('my-key')

// 列表操作
await context.storage.listPush('my-list', 'item1', 'item2')
const items = await context.storage.listRange('my-list', 0, -1)
```

### Events API

事件监听和发射：

```typescript
// 监听事件
context.events.on('canvas.node.created', (data) => {
  console.log('节点已创建:', data)
})

// 发射事件
context.events.emit('my-custom-event', { message: 'Hello' })

// 插件间通信
context.events.sendToPlugin('other-plugin', 'message', data)
context.events.broadcast('global-message', data)
```

### UI Helper API

用户界面操作：

```typescript
// 显示通知
context.ui.showNotification('操作成功！', 'success')

// 显示确认对话框
const confirmed = await context.ui.showConfirm({
  title: '确认删除',
  message: '确定要删除这个节点吗？'
})

// 显示输入对话框
const input = await context.ui.showPrompt({
  title: '输入名称',
  message: '请输入新的名称：'
})

// 显示进度条
const progressId = await context.ui.showProgress({
  title: '处理中...'
})
await context.ui.updateProgress(progressId, 50)
await context.ui.hideProgress(progressId)
```

## 插件类型

### 组件插件 (component)

创建可重用的 UI 组件：

```typescript
@Plugin({
  type: 'component',
  permissions: ['canvas.write', 'component.create']
})
```

### AI 处理器插件 (ai-processor)

集成 AI 功能：

```typescript
@Plugin({
  type: 'ai-processor',
  permissions: ['ai.request', 'canvas.read', 'canvas.write']
})
```

### 导出器插件 (exporter)

提供内容导出功能：

```typescript
@Plugin({
  type: 'exporter',
  permissions: ['canvas.read', 'file.write']
})
```

### 工具插件 (tool)

提供实用工具功能：

```typescript
@Plugin({
  type: 'tool',
  permissions: ['canvas.read', 'storage.write']
})
```

### 主题插件 (theme)

自定义外观样式：

```typescript
@Plugin({
  type: 'theme',
  permissions: ['canvas.read']
})
```

## 权限系统

插件需要声明所需的权限：

- `canvas.read` - 读取画布内容
- `canvas.write` - 修改画布内容
- `component.create` - 创建组件
- `component.modify` - 修改组件
- `ai.request` - 调用 AI 服务
- `storage.read` - 读取存储
- `storage.write` - 写入存储
- `network.request` - 网络请求
- `file.read` - 读取文件
- `file.write` - 写入文件

## 最佳实践

### 1. 错误处理

```typescript
try {
  await context.canvas.createNode(nodeData)
} catch (error) {
  context.log('error', '创建节点失败', error)
  context.ui.showError('操作失败：' + error.message)
}
```

### 2. 资源清理

```typescript
async onDeactivate(): Promise<void> {
  // 清理事件监听器
  context.events.removeAllListeners()

  // 清理临时数据
  await context.storage.clear('plugin:temp')

  await super.onDeactivate()
}
```

### 3. 配置管理

```typescript
// 获取配置
const apiKey = await context.getConfig('apiKey', '')

// 设置配置
await context.setConfig('apiKey', newApiKey)
```

### 4. 国际化

```typescript
const messages = {
  'zh-CN': { hello: '你好' },
  'en-US': { hello: 'Hello' }
}

const locale = await context.getConfig('locale', 'zh-CN')
const message = messages[locale]?.hello || messages['zh-CN'].hello
```

## 示例插件

查看 `examples/` 目录中的完整示例：

- [Basic Component](./examples/basic-component) - 基础组件插件
- [AI Text Processor](./examples/ai-text-processor) - AI 文本处理插件
- [PDF Exporter](./examples/pdf-exporter) - PDF 导出插件
- [Theme Manager](./examples/theme-manager) - 主题管理插件

## 开发工具

使用 SKER Developer 平台提供的在线 IDE 进行插件开发，包含：

- 语法高亮和智能提示
- 实时调试和测试
- 自动化构建和打包
- 安全扫描和验证

## 支持

- [开发文档](https://developer.sker.com/docs)
- [API 参考](https://developer.sker.com/api)
- [示例代码](https://developer.sker.com/examples)
- [社区论坛](https://community.sker.com)
- [GitHub Issues](https://github.com/sker/plugin-sdk/issues)

## 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 贡献

欢迎贡献代码！请查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解详情。