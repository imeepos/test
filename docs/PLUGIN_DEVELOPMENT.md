# 📦 SKER 插件开发指南

SKER 插件开发平台为第三方开发者提供了强大而灵活的插件开发环境，让您可以轻松扩展 SKER 画布的功能。

## 🚀 快速开始

### 环境准备

1. **安装开发环境**
   ```bash
   # 克隆项目
   git clone <repository-url>
   cd sker

   # 安装依赖
   pnpm install

   # 启动开发环境
   pnpm run dev:developer
   ```

2. **访问开发平台**

   打开浏览器访问: `http://localhost:3001`

### 创建第一个插件

1. **在开发平台中创建新项目**
   - 点击"创建新插件"
   - 选择插件类型：`component`
   - 填写插件基本信息

2. **编写插件代码**
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

3. **测试插件**
   - 点击"运行测试"执行自动化测试
   - 点击"调试运行"进行实时调试

## 📚 核心概念

### 插件类型

SKER 支持五种插件类型：

| 类型 | 描述 | 适用场景 |
|------|------|----------|
| `component` | 组件插件 | 创建自定义UI组件 |
| `ai-processor` | AI处理器 | 集成AI功能处理内容 |
| `exporter` | 导出器 | 导出内容到不同格式 |
| `tool` | 工具插件 | 提供实用工具功能 |
| `theme` | 主题插件 | 自定义外观样式 |

### 插件生命周期

```typescript
interface PluginLifecycle {
  onInstall(): Promise<void>      // 插件安装时调用
  onActivate(context: PluginContext): Promise<void>  // 插件激活时调用
  onDeactivate(): Promise<void>   // 插件停用时调用
  onUninstall(): Promise<void>    // 插件卸载时调用
}
```

### 权限系统

插件需要声明所需的权限：

```typescript
const permissions = [
  'canvas.read',        // 读取画布内容
  'canvas.write',       // 修改画布内容
  'canvas.node.create', // 创建节点
  'canvas.node.update', // 更新节点
  'canvas.node.delete', // 删除节点
  'canvas.edge.create', // 创建连线
  'canvas.edge.update', // 更新连线
  'canvas.edge.delete', // 删除连线
  'ai.request',         // 调用AI服务
  'ai.analyze',         // AI分析功能
  'ai.generate',        // AI生成功能
  'ai.optimize',        // AI优化功能
  'storage.read',       // 读取存储
  'storage.write',      // 写入存储
  'network.request',    // 网络请求
  'file.read',          // 读取文件
  'file.write',         // 写入文件
  'component.create',   // 创建组件
  'component.modify'    // 修改组件
]
```

## 🔧 API 参考

### PluginContext

插件上下文提供了访问所有API的入口：

```typescript
interface PluginContext {
  canvas: CanvasAPI          // 画布操作
  components: ComponentAPI   // 组件管理
  ai: AIServiceAPI          // AI服务
  storage: StorageAPI       // 数据存储
  ui: UIHelperAPI           // UI助手
  events: EventSystemAPI    // 事件系统
  log: (level: string, message: string, data?: any) => void
  getConfig: (key: string, defaultValue?: any) => Promise<any>
  setConfig: (key: string, value: any) => Promise<void>
  destroy: () => void
}
```

### Canvas API

#### 节点操作

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

// 获取节点
const node = await context.canvas.getNode(nodeId)

// 获取所有节点
const nodes = await context.canvas.getAllNodes()
```

#### 连线操作

```typescript
// 创建连线
await context.canvas.createEdge({
  sourceId: 'node1',
  targetId: 'node2',
  type: 'bezier'
})

// 删除连线
await context.canvas.deleteEdge(edgeId)

// 建议连线
const suggestions = await context.canvas.suggestConnections(nodeId, {
  enableSemantic: true,
  maxSuggestions: 10
})
```

### AI Service API

```typescript
// 生成文本
const result = await context.ai.generateText('写一首关于春天的诗')

// 分析文本
const analysis = await context.ai.analyzeText(text, 'sentiment')

// 优化文本
const optimized = await context.ai.optimizeText(text, 'clarity')

// 翻译文本
const translated = await context.ai.translateText(text, 'en')

// 生成代码
const code = await context.ai.generateCode('创建一个React组件', 'typescript')
```

### Storage API

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

// 哈希操作
await context.storage.hashSet('my-hash', 'field', 'value')
const value = await context.storage.hashGet('my-hash', 'field')
```

### Events API

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

// 监听系统事件
context.events.on('canvas.selection.changed', (selection) => {
  console.log('选择已更改:', selection)
})
```

### UI Helper API

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

// 显示上下文菜单
const choice = await context.ui.showContextMenu(
  { x: data.x, y: data.y },
  [
    { id: 'edit', label: '编辑', icon: '✏️' },
    { id: 'delete', label: '删除', icon: '🗑️' }
  ]
)
```

### Component API

```typescript
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
    }
  ],
  render: (props) => {
    const button = document.createElement('button')
    button.textContent = props.text
    button.style.backgroundColor = props.color
    button.style.border = 'none'
    button.style.borderRadius = '4px'
    button.style.color = 'white'
    button.style.cursor = 'pointer'
    button.style.padding = '8px 16px'

    return button
  }
}

await context.components.registerComponent('custom-button', buttonComponent)
```

## 🎨 插件示例

### 1. 基础组件插件

```typescript
import { BasePlugin, Plugin, PluginContext, ComponentDefinition } from '@sker/plugin-sdk'

@Plugin({
  id: 'custom-button',
  name: 'Custom Button Component',
  version: '1.0.0',
  type: 'component'
})
export default class CustomButtonPlugin extends BasePlugin {
  async onActivate(context: PluginContext): Promise<void> {
    await super.onActivate(context)

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
        }
      ],
      render: (props) => {
        const button = document.createElement('button')
        button.textContent = props.text
        button.addEventListener('click', () => {
          context.ui.showNotification('按钮被点击了！')
        })
        return button
      }
    }

    await context.components.registerComponent('custom-button', buttonComponent)
  }
}
```

### 2. AI处理器插件

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
      const node = await context.canvas.getNode(nodeId)
      if (!node) return

      const enhancedText = await context.ai.optimizeText(
        node.content,
        'clarity'
      )

      await context.canvas.updateNode(nodeId, {
        content: enhancedText
      })

      context.ui.showSuccess('文本已增强！')
    } catch (error) {
      context.ui.showError('增强失败：' + error.message)
    }
  }

  private async summarizeText(nodeId: string) {
    const context = this.getContext()

    try {
      const node = await context.canvas.getNode(nodeId)
      if (!node) return

      const summary = await context.ai.generateText(
        `请为以下内容生成简洁的摘要：\n\n${node.content}`
      )

      // 创建摘要节点
      await context.canvas.createNode({
        type: 'text',
        title: '摘要',
        content: summary,
        position: { x: node.position.x + 300, y: node.position.y }
      })

      context.ui.showSuccess('摘要已生成！')
    } catch (error) {
      context.ui.showError('生成摘要失败：' + error.message)
    }
  }

  async onDeactivate(): Promise<void> {
    const context = this.getContext()
    context.events.off('canvas.node.rightclick', this.showContextMenu)
    await super.onDeactivate()
  }
}
```

### 3. 导出器插件

```typescript
import { BasePlugin, Plugin, PluginContext } from '@sker/plugin-sdk'

@Plugin({
  id: 'markdown-exporter',
  name: 'Markdown Exporter',
  version: '1.0.0',
  type: 'exporter',
  permissions: ['canvas.read', 'file.write']
})
export default class MarkdownExporter extends BasePlugin {
  async onActivate(context: PluginContext): Promise<void> {
    await super.onActivate(context)

    // 添加导出菜单项
    context.events.on('canvas.export.request', this.handleExport)
  }

  private handleExport = async (data: any) => {
    const context = this.getContext()

    try {
      const nodes = await context.canvas.getAllNodes()
      const markdown = this.generateMarkdown(nodes)

      // 触发下载
      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = 'canvas-export.md'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      context.ui.showSuccess('Markdown 文件已导出！')
    } catch (error) {
      context.ui.showError('导出失败：' + error.message)
    }
  }

  private generateMarkdown(nodes: any[]): string {
    let markdown = '# Canvas Export\n\n'

    nodes.forEach(node => {
      if (node.title) {
        markdown += `## ${node.title}\n\n`
      }
      if (node.content) {
        markdown += `${node.content}\n\n`
      }
    })

    return markdown
  }

  async onDeactivate(): Promise<void> {
    const context = this.getContext()
    context.events.off('canvas.export.request', this.handleExport)
    await super.onDeactivate()
  }
}
```

## 🧪 测试和调试

### 自动化测试

开发平台提供完整的测试套件：

1. **生命周期测试** - 验证插件生命周期方法
2. **API测试** - 测试各种API调用
3. **权限测试** - 验证权限控制
4. **性能测试** - 检查内存和执行时间

### 调试功能

1. **实时日志** - 查看插件执行日志
2. **断点调试** - 设置断点和变量监控
3. **性能分析** - 内存使用和执行时间分析
4. **错误追踪** - 完整的错误堆栈信息

### 测试用例示例

```typescript
// 在测试平台中创建测试用例
const testCase = {
  name: 'AI文本增强测试',
  description: '测试AI文本增强功能是否正常工作',
  category: 'api',
  assertions: [
    {
      description: 'AI增强后的文本不为空',
      type: 'notEquals',
      expected: ''
    },
    {
      description: '增强后的文本长度大于原文本',
      type: 'greaterThan',
      expected: 0
    }
  ]
}
```

## 📦 插件打包和发布

### 构建插件

```bash
# 在开发平台中点击"构建插件"
# 或使用命令行
pnpm run build:plugin
```

### 插件清单文件

```json
{
  "id": "my-awesome-plugin",
  "name": "My Awesome Plugin",
  "version": "1.0.0",
  "description": "An awesome plugin for SKER",
  "type": "component",
  "author": "Your Name",
  "homepage": "https://github.com/username/my-awesome-plugin",
  "keywords": ["sker", "plugin", "component"],
  "permissions": [
    "canvas.read",
    "canvas.write",
    "ai.request"
  ],
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist/",
    "README.md"
  ],
  "engines": {
    "sker": ">=1.0.0"
  }
}
```

### 发布到插件市场

1. **测试插件** - 确保所有测试通过
2. **构建发布版** - 生成优化后的代码
3. **提交审核** - 上传到SKER插件市场
4. **等待审批** - 插件审核和安全检查

## 🔒 安全最佳实践

### 权限最小化原则

只申请插件实际需要的权限：

```typescript
// ❌ 不好的做法 - 申请过多权限
permissions: ['canvas.*', 'ai.*', 'storage.*']

// ✅ 好的做法 - 只申请需要的权限
permissions: ['canvas.read', 'ai.generate', 'storage.read']
```

### 输入验证

```typescript
// 验证用户输入
private validateInput(input: string): boolean {
  if (!input || input.trim().length === 0) {
    this.getContext().ui.showError('输入不能为空')
    return false
  }

  if (input.length > 1000) {
    this.getContext().ui.showError('输入内容过长')
    return false
  }

  return true
}
```

### 错误处理

```typescript
async performAction(): Promise<void> {
  const context = this.getContext()

  try {
    // 执行操作
    const result = await context.ai.generateText(prompt)

    // 处理结果
    await context.canvas.createNode({ content: result })

  } catch (error) {
    // 记录错误
    context.log('error', 'Action failed', error)

    // 显示用户友好的错误信息
    context.ui.showError('操作失败，请稍后重试')
  }
}
```

## 📚 更多资源

- [插件SDK API文档](../packages/plugin-sdk/README.md)
- [插件开发最佳实践](./PLUGIN_BEST_PRACTICES.md)
- [插件示例仓库](https://github.com/sker/plugin-examples)
- [开发者社区](https://community.sker.com)
- [技术支持](mailto:developer@sker.com)

## 🤝 贡献

欢迎为SKER插件生态系统贡献代码！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件