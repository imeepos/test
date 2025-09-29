# 🏗️ Packages 工具库架构设计

## 项目概述

基于 **扩展式AI协作画布 MVP v2.0** 的技术需求，本工具库将复杂的AI协作画布系统分解为10个独立且高内聚的包，支持分层架构和团队协作开发。

## 🎯 设计原则

- **功能边界清晰**: 每个包负责特定领域，避免功能重叠
- **复用性优先**: 高复用的功能独立成包
- **技术栈分离**: 前端、后端、通用逻辑分别打包  
- **业务逻辑分层**: 核心逻辑与UI层分离
- **依赖关系优化**: 避免循环依赖，保持清晰的依赖树

## 📦 核心包架构

### 1. **@sker/canvas** - 画布核心引擎
**作用**: React Flow画布的核心抽象层和通用功能  
**场景**: 所有画布操作、节点管理、连线逻辑  
**依据**: 画布是整个应用的核心，需要独立的引擎层

```typescript
// 核心功能
export {
  CanvasEngine,      // 画布引擎抽象
  NodeManager,       // 节点管理器
  ConnectionManager, // 连线管理器  
  ViewportController,// 视口控制
  EventBus          // 事件总线
} from '@sker/canvas';

// 使用示例
const canvas = new CanvasEngine({
  viewport: { width: 1920, height: 1080 },
  nodeTypes: customNodeTypes,
  onConnect: handleConnection
});
```

### 2. **@sker/ai** - AI服务集成
**作用**: LLM调用、消息队列、AI响应处理的统一接口  
**场景**: 所有AI生成内容、优化请求、智能分析  
**依据**: AI是核心能力，需要统一的集成层避免重复实现

```typescript
// 核心功能
export {
  LLMClient,        // 统一LLM客户端
  MessageQueue,     // RabbitMQ封装
  PromptBuilder,    // 提示词构建器
  ResponseParser,   // 响应解析器
  AITaskManager     // AI任务管理
} from '@sker/ai';

// 使用示例
const ai = new LLMClient({
  provider: 'openai',
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY
});

const result = await ai.generate({
  context: componentContent,
  prompt: userInput,
  type: 'create'
});
```

### 3. **@sker/components** - 智能组件库
**作用**: 可复用的智能UI组件和业务组件  
**场景**: 组件渲染、交互状态管理、版本显示  
**依据**: 组件系统复杂，包含多种状态和交互模式

```typescript
// 核心功能
export {
  SmartComponent,     // 智能组件基础
  ComponentStates,    // 状态管理
  DisplayModes,       // 显示模式
  InteractionHandlers,// 交互处理
  ComponentMetadata   // 元信息管理
} from '@sker/components';

// 使用示例
<SmartComponent
  id={component.id}
  data={component.data}
  displayMode="preview"
  onUpdate={handleUpdate}
  onOptimize={handleOptimize}
/>
```

### 4. **@sker/version** - 版本管理系统
**作用**: 语义化版本控制、历史记录、回滚机制  
**场景**: 内容优化、版本历史、差异对比  
**依据**: 版本管理是独立的复杂子系统，可复用性高

```typescript
// 核心功能
export {
  VersionManager,   // 版本管理器
  HistoryTracker,   // 历史追踪
  DiffEngine,       // 差异引擎
  RollbackHandler,  // 回滚处理
  ChangeLogger      // 变更记录
} from '@sker/version';

// 使用示例
const versionManager = new VersionManager(componentId);
await versionManager.createVersion({
  content: newContent,
  changeReason: "增加技术细节",
  changeType: "confirmed"
});
```

### 5. **@sker/models** - 数据模型与验证
**作用**: 统一的数据结构定义、类型声明、验证逻辑  
**场景**: 前后端数据交互、API接口、数据库操作  
**依据**: 类型安全和数据一致性的保障，多端共享

```typescript
// 核心功能
export {
  ComponentModel,     // 组件数据模型
  ProjectModel,       // 项目数据模型
  VersionModel,       // 版本数据模型
  ValidationSchemas,  // 验证模式
  TypeDefinitions     // 类型定义
} from '@sker/models';

// 类型定义示例
interface ComponentData {
  id: string;
  title: string;
  content: string;
  importance_level: number; // 1-5
  confidence_score: number; // 0-100
  semantic_type: string;
  version: number;
  status: ComponentStatus;
}
```

### 6. **@sker/api** - API客户端
**作用**: 统一的HTTP客户端、WebSocket连接、状态同步  
**场景**: 前端与后端通信、实时更新、离线同步  
**依据**: 网络层抽象，支持不同的通信模式

```typescript
// 核心功能
export {
  RestClient,      // REST API客户端
  WebSocketClient, // WebSocket客户端
  SyncManager,     // 同步管理器
  CacheManager,    // 缓存管理
  OfflineHandler   // 离线处理
} from '@sker/api';

// 使用示例
const api = new RestClient('/api');
const component = await api.post('/components', componentData);

const ws = new WebSocketClient();
ws.on('component:updated', handleComponentUpdate);
```

### 7. **@sker/utils** - 通用工具库
**作用**: 通用工具函数、常量定义、帮助方法  
**场景**: 全项目通用功能、格式化、验证等  
**依据**: 避免重复代码，提供通用基础设施

```typescript
// 核心功能
export {
  DateUtils,        // 日期工具
  StringUtils,      // 字符串工具
  ValidationUtils,  // 验证工具
  FormatUtils,      // 格式化工具
  Constants         // 常量定义
} from '@sker/utils';

// 使用示例
const formattedDate = DateUtils.formatRelative(component.updated_at);
const isValid = ValidationUtils.isValidEmail(userEmail);
```

### 8. **@sker/state** - 状态管理
**作用**: Zustand store定义、状态同步、持久化  
**场景**: 全局状态管理、画布状态、用户偏好  
**依据**: 状态管理逻辑复杂，需要统一的管理方案

```typescript
// 核心功能
export {
  CanvasStore,      // 画布状态
  ComponentStore,   // 组件状态
  UIStore,          // 界面状态
  UserStore,        // 用户状态
  PersistenceLayer  // 持久化层
} from '@sker/state';

// 使用示例
const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  displayMode: 'preview',
  updateNode: (id, updates) => set(state => ({
    nodes: state.nodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    )
  }))
}));
```

### 9. **@sker/backend** - 后端核心
**作用**: Express中间件、数据库连接、基础服务  
**场景**: 后端服务的通用基础设施  
**依据**: 后端通用逻辑抽象，支持微服务架构

```typescript
// 核心功能
export {
  DatabaseConnector, // 数据库连接器
  Middleware,        // 通用中间件
  ServiceBase,       // 服务基类
  ErrorHandler,      // 错误处理
  Logger            // 日志系统
} from '@sker/backend';

// 使用示例
class ComponentService extends ServiceBase {
  async create(data: ComponentData) {
    return this.db.components.create(data);
  }
}
```

### 10. **@sker/config** - 配置管理
**作用**: 环境配置、功能开关、主题配置  
**场景**: 开发/生产环境切换、功能控制  
**依据**: 配置集中管理，支持动态配置

```typescript
// 核心功能
export {
  EnvironmentConfig, // 环境配置
  FeatureFlags,      // 功能开关
  ThemeConfig,       // 主题配置
  ApiConfig,         // API配置
  BuildConfig        // 构建配置
} from '@sker/config';

// 使用示例
const config = EnvironmentConfig.get();
const isAIEnabled = FeatureFlags.isEnabled('ai-optimization');
```

## 🔗 包依赖关系

```mermaid
graph TD
    A[@sker/config] --> B[@sker/utils]
    A --> C[@sker/models]
    B --> D[@sker/api]
    C --> D
    C --> E[@sker/state]
    C --> F[@sker/version]
    D --> G[@sker/ai]
    E --> H[@sker/canvas]
    F --> H
    G --> I[@sker/components]
    H --> I
    C --> J[@sker/backend]
    B --> J
```

## 📂 目录结构

```
packages/
├── README.md                    # 本文档
├── package.json                 # Monorepo 配置
├── tsconfig.json               # TypeScript 配置
├── canvas-core/                # 画布核心引擎
│   ├── src/
│   ├── types/
│   ├── tests/
│   └── package.json
├── ai-integration/             # AI服务集成
│   ├── src/
│   ├── types/
│   ├── tests/
│   └── package.json
├── smart-components/           # 智能组件库
│   ├── src/
│   ├── types/
│   ├── tests/
│   └── package.json
├── version-control/            # 版本管理系统
│   ├── src/
│   ├── types/
│   ├── tests/
│   └── package.json
├── data-models/               # 数据模型与验证
│   ├── src/
│   ├── types/
│   ├── tests/
│   └── package.json
├── api-client/                # API客户端
│   ├── src/
│   ├── types/
│   ├── tests/
│   └── package.json
├── utils/                     # 通用工具库
│   ├── src/
│   ├── types/
│   ├── tests/
│   └── package.json
├── state-management/          # 状态管理
│   ├── src/
│   ├── types/
│   ├── tests/
│   └── package.json
├── backend-core/              # 后端核心
│   ├── src/
│   ├── types/
│   ├── tests/
│   └── package.json
└── config/                    # 配置管理
    ├── src/
    ├── types/
    ├── tests/
    └── package.json
```

## 🚀 开发指南

### 安装依赖
```bash
# 根目录安装所有依赖
npm install

# 安装特定包的依赖
npm install --workspace=@sker/canvas
```

### 构建包
```bash
# 构建所有包
npm run build

# 构建特定包
npm run build --workspace=@sker/canvas
```

### 运行测试
```bash
# 运行所有测试
npm test

# 运行特定包的测试
npm test --workspace=@sker/canvas
```

### 发布包
```bash
# 发布所有包
npm run publish:all

# 发布特定包
npm publish --workspace=@sker/canvas
```

## 🎯 使用场景

### 前端应用开发
```typescript
import { CanvasEngine } from '@sker/canvas';
import { SmartComponent } from '@sker/components';
import { useCanvasStore } from '@sker/state';
import { LLMClient } from '@sker/ai';

// 构建完整的前端应用
const App = () => {
  const canvas = useCanvasStore();
  return (
    <CanvasEngine>
      {canvas.nodes.map(node => (
        <SmartComponent key={node.id} data={node} />
      ))}
    </CanvasEngine>
  );
};
```

### 后端服务开发
```typescript
import { ServiceBase, DatabaseConnector } from '@sker/backend';
import { ComponentModel, ValidationSchemas } from '@sker/models';
import { LLMClient } from '@sker/ai';

// 构建后端服务
class ComponentService extends ServiceBase {
  constructor() {
    super(new DatabaseConnector());
  }
  
  async optimizeComponent(id: string, prompt: string) {
    const component = await this.getComponent(id);
    const ai = new LLMClient();
    return ai.optimize(component, prompt);
  }
}
```

## 📈 版本管理

每个包遵循语义化版本控制 (SemVer):
- **Major**: 破坏性变更
- **Minor**: 新功能添加
- **Patch**: Bug修复

## 🤝 贡献指南

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/new-feature`)
3. 提交变更 (`git commit -am 'Add new feature'`)
4. 推送分支 (`git push origin feature/new-feature`)
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

**注**: 本工具库基于 MVP v2.0 计划设计，支持扩展式AI协作画布的完整技术栈需求。