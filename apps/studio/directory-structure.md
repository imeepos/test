# @sker/studio 项目目录结构设计

基于MVP功能规划和技术栈（React 18 + TypeScript + TailwindCSS + TanStack Query + Zustand + React Flow）

## 📁 目录结构概览

```
apps/studio/
├── 📦 public/                     # 静态资源
│   ├── favicon.ico
│   ├── manifest.json
│   └── logo/                      # 品牌资源
├── 📦 src/                        # 源代码
│   ├── 🎨 components/             # UI组件库
│   │   ├── canvas/               # 画布相关组件
│   │   ├── smart-component/      # 智能组件系统
│   │   ├── sidebar/              # 侧边栏组件
│   │   ├── context-menu/         # 右键菜单
│   │   └── ui/                   # 通用UI组件
│   ├── 🧠 features/              # 功能模块
│   │   ├── canvas-control/       # 画布控制
│   │   ├── ai-collaboration/     # AI协作
│   │   ├── version-management/   # 版本管理
│   │   └── search/               # 搜索功能
│   ├── 🔧 hooks/                 # 自定义Hooks
│   ├── 📊 store/                 # Zustand状态管理
│   ├── 🌐 api/                   # API层(TanStack Query)
│   ├── 🎨 styles/                # 样式文件
│   ├── 🛠️ utils/                 # 工具函数
│   ├── 📋 types/                 # TypeScript类型定义
│   ├── 📄 constants/             # 常量配置
│   └── App.tsx                   # 应用入口
├── 📄 package.json               # 依赖配置
├── 📄 tailwind.config.js         # TailwindCSS配置
├── 📄 tsconfig.json              # TypeScript配置
├── 📄 vite.config.ts             # Vite构建配置
├── 📄 .env.example               # 环境变量示例
├── 📄 README.md                  # 项目说明
└── 📄 CLAUDE.md                  # Claude配置
```

## 🎨 组件库详细结构

### `/src/components/`

#### `canvas/` - 画布核心组件
```
canvas/
├── Canvas.tsx                    # 主画布容器(React Flow)
├── CanvasBackground.tsx          # 画布背景
├── CanvasControls.tsx            # 画布控制器(缩放/平移)
├── CanvasMiniMap.tsx             # 画布缩略图
├── ConnectionLine.tsx            # 连线组件
└── index.ts                      # 导出
```

#### `smart-component/` - 智能组件系统
```
smart-component/
├── SmartComponent.tsx            # 主智能组件
├── ComponentHeader.tsx           # 组件头部(标题/重要性/置信度)
├── ComponentContent.tsx          # 组件内容区
├── ComponentFooter.tsx           # 组件底部操作
├── EmptyComponent.tsx            # 空组件(等待AI生成)
├── ComponentStatus.tsx           # 组件状态指示器
├── ImportanceStars.tsx           # 重要性星级显示
├── ConfidenceBar.tsx             # 置信度显示
└── index.ts
```

#### `sidebar/` - MVP极简侧边栏
```
sidebar/
├── Sidebar.tsx                   # 侧边栏容器
├── BrandSection.tsx              # 品牌标识区
├── QuickControls.tsx             # 快速控制(预览模式/缩放)
├── SearchBox.tsx                 # 搜索组件
├── CanvasStats.tsx               # 画布统计
└── index.ts
```

#### `context-menu/` - 右键菜单系统
```
context-menu/
├── ContextMenu.tsx               # 右键菜单容器
├── CanvasContextMenu.tsx         # 画布右键菜单
├── ComponentContextMenu.tsx      # 组件右键菜单
├── MenuDivider.tsx               # 菜单分隔符
└── index.ts
```

#### `ui/` - 通用UI组件
```
ui/
├── Button.tsx                    # 按钮组件
├── Input.tsx                     # 输入框
├── Modal.tsx                     # 模态框
├── Tooltip.tsx                   # 提示框
├── Loading.tsx                   # 加载指示器
├── ErrorBoundary.tsx             # 错误边界
└── index.ts
```

## 🧠 功能模块详细结构

### `/src/features/`

#### `canvas-control/` - 画布控制功能
```
canvas-control/
├── hooks/
│   ├── useCanvasZoom.ts          # 缩放控制
│   ├── useCanvasNavigation.ts    # 画布导航
│   └── useCanvasViewport.ts      # 视口管理
├── components/
│   ├── ZoomControls.tsx          # 缩放控制器
│   └── ViewportIndicator.tsx     # 视口指示器
├── types/
│   └── canvas.types.ts           # 画布相关类型
└── index.ts
```

#### `ai-collaboration/` - AI协作功能
```
ai-collaboration/
├── hooks/
│   ├── useAIGeneration.ts        # AI内容生成
│   ├── useComponentCreation.ts   # 组件创建
│   └── useContentOptimization.ts # 内容优化
├── components/
│   ├── AIGenerationDialog.tsx    # AI生成对话框
│   ├── OptimizationDialog.tsx    # 优化对话框
│   └── GenerationProgress.tsx    # 生成进度
├── services/
│   └── aiService.ts              # AI服务接口
└── index.ts
```

#### `version-management/` - 版本管理(MVP简化)
```
version-management/
├── hooks/
│   ├── useVersionHistory.ts      # 版本历史
│   └── useVersionRollback.ts     # 版本回滚
├── components/
│   ├── VersionIndicator.tsx      # 版本指示器(组件内)
│   └── RollbackConfirm.tsx       # 回滚确认
└── index.ts
```

#### `search/` - 搜索功能
```
search/
├── hooks/
│   ├── useComponentSearch.ts     # 组件搜索
│   └── useSearchHighlight.ts     # 搜索高亮
├── components/
│   └── SearchResultList.tsx      # 搜索结果列表
└── index.ts
```

## 📊 状态管理结构

### `/src/store/` - Zustand状态管理
```
store/
├── canvasStore.ts                # 画布状态(MVP核心)
├── componentStore.ts             # 组件状态
├── uiStore.ts                    # UI状态(侧边栏/模态框等)
├── searchStore.ts                # 搜索状态
├── types/                        # 状态类型定义
│   ├── canvas.types.ts
│   ├── component.types.ts
│   └── ui.types.ts
└── index.ts                      # 状态导出
```

## 🌐 API层结构

### `/src/api/` - TanStack Query API管理
```
api/
├── queries/                      # 查询hooks
│   ├── useComponents.ts          # 组件查询
│   ├── useAIGeneration.ts        # AI生成查询
│   └── useVersions.ts            # 版本查询
├── mutations/                    # 变更hooks
│   ├── useCreateComponent.ts     # 创建组件
│   ├── useUpdateComponent.ts     # 更新组件
│   └── useOptimizeComponent.ts   # 优化组件
├── services/                     # API服务
│   ├── componentService.ts       # 组件服务
│   ├── aiService.ts              # AI服务
│   └── versionService.ts         # 版本服务
├── types/                        # API类型
│   └── api.types.ts
└── queryClient.ts                # Query客户端配置
```

## 🎨 样式管理结构

### `/src/styles/` - 样式组织
```
styles/
├── globals.css                   # 全局样式
├── components/                   # 组件样式
│   ├── canvas.css               # 画布样式
│   ├── sidebar.css              # 侧边栏样式
│   └── smart-component.css      # 智能组件样式
├── utilities/                    # 工具样式
│   ├── animations.css           # 动画效果
│   └── transitions.css          # 过渡效果
└── themes/                       # 主题(MVP暂时只有深色)
    └── dark.css
```

## 🛠️ 工具函数结构

### `/src/utils/` - 工具函数
```
utils/
├── canvas/                       # 画布工具
│   ├── coordinates.ts           # 坐标计算
│   ├── viewport.ts              # 视口工具
│   └── node-positioning.ts      # 节点定位
├── component/                    # 组件工具
│   ├── importance.ts            # 重要性计算
│   ├── content-analysis.ts      # 内容分析
│   └── semantic-types.ts        # 语义类型
├── ai/                          # AI工具
│   ├── context-builder.ts       # 上下文构建
│   ├── prompt-template.ts       # 提示词模板
│   └── response-parser.ts       # 响应解析
├── common/                      # 通用工具
│   ├── debounce.ts              # 防抖
│   ├── throttle.ts              # 节流
│   ├── formatters.ts            # 格式化
│   └── validators.ts            # 验证器
└── index.ts
```

## 📋 类型定义结构

### `/src/types/` - TypeScript类型
```
types/
├── global.types.ts               # 全局类型
├── component.types.ts            # 组件类型
├── canvas.types.ts               # 画布类型
├── ai.types.ts                   # AI相关类型
├── version.types.ts              # 版本管理类型
├── search.types.ts               # 搜索类型
├── api.types.ts                  # API类型
└── index.ts                      # 类型导出
```

## 📄 配置文件结构

### 根目录配置文件
```
📄 package.json                   # 项目依赖和脚本
📄 tailwind.config.js             # TailwindCSS配置
📄 tsconfig.json                  # TypeScript编译配置
📄 vite.config.ts                 # Vite构建配置
📄 .env.example                   # 环境变量模板
📄 .gitignore                     # Git忽略文件
📄 README.md                      # 项目文档
📄 CLAUDE.md                      # Claude开发配置
```

## 🎯 MVP开发优先级

### Week 1: 核心结构搭建
```
优先创建的目录:
✅ src/components/canvas/
✅ src/components/smart-component/
✅ src/components/sidebar/ (MVP简化版)
✅ src/store/canvasStore.ts
✅ src/types/component.types.ts
```

### Week 2: AI协作功能
```
✅ src/features/ai-collaboration/
✅ src/api/mutations/
✅ src/utils/ai/
```

### Week 3: 交互完善
```
✅ src/components/context-menu/
✅ src/features/search/
✅ src/features/version-management/ (简化版)
```

### Week 4: 优化完善
```
✅ src/components/ui/ (完善)
✅ src/utils/common/ (完善)
✅ src/styles/ (主题优化)
```

这个目录结构既支持MVP的极简开发，又为后续功能扩展预留了良好的架构基础。每个模块职责清晰，便于团队协作开发。