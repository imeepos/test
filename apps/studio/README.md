# @sker/studio - AI协作画布应用

从无到有的思维创造平台 - 通过AI协作实现无限画布上的智能思维扩展

## 📋 项目状态 (2025-09-29)

### ✅ 已完成功能
- **架构设计**: 完整的组件体系和服务层架构 
- **基础设施**: React Flow画布、Zustand状态管理、TypeScript类型系统
- **AI服务**: 完整的AI内容生成、优化、融合功能
- **通信层**: WebSocket实时通信和断线重连机制
- **组件框架**: Canvas、AINode、Sidebar等核心组件结构

### 🔄 开发中功能  
- **交互逻辑**: 双击创建、拖拽扩展的具体实现
- **UI组件**: Button、Modal、Toast等基础组件完善
- **右键菜单**: 画布和节点的上下文操作

### ⏳ 待开发功能
- **版本管理UI**: 节点版本历史的可视化界面
- **搜索筛选**: 节点内容搜索和多维度筛选
- **快捷键系统**: 键盘交互支持
- **错误处理**: 完整的错误边界和用户反馈

## 🎨 核心功能特性

- 🎨 **无限画布**: 支持无限滚动的思维工作区域
- 🤖 **AI智能协作**: 双击创建、连线扩展、多输入融合
- 🔗 **连线扩展机制**: 拖拽到空白处自动生成新节点
- 📊 **智能版本管理**: AI内容迭代和历史追踪
- 🎯 **语义化标签**: 自动识别内容类型和重要性
- ⚡ **实时通信**: WebSocket确保流畅的AI交互体验

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **画布引擎**: React Flow (无限画布、虚拟化渲染)
- **状态管理**: Zustand (轻量级、模块化)
- **样式系统**: Tailwind CSS + Lucide React图标
- **AI集成**: 自研AIService (支持多模型、断线重连)
- **实时通信**: WebSocket (心跳机制、消息队列)
- **构建工具**: Vite + SWC (快速开发和构建)

## 🚀 快速开始

### 安装依赖
```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 开发环境
```bash
# 启动开发服务器
pnpm run dev

# 类型检查
pnpm run type-check

# 代码检查
pnpm run lint

# 代码修复
pnpm run lint:fix
```

### 构建部署
```bash
# 构建生产版本
pnpm run build

# 预览构建结果
pnpm run preview
```

## 📁 项目结构

```
src/
├── components/          # 组件库
│   ├── canvas/         # 画布相关组件
│   ├── node/           # AI节点组件
│   ├── sidebar/        # 侧边栏组件
│   └── ui/             # 基础UI组件
├── services/           # 业务服务层
│   ├── aiService.ts    # AI内容生成服务
│   └── websocketService.ts # WebSocket通信
├── stores/             # Zustand状态管理
│   ├── canvasStore.ts  # 画布状态
│   ├── nodeStore.ts    # 节点状态
│   ├── aiStore.ts      # AI状态
│   └── uiStore.ts      # UI状态
├── types/              # TypeScript类型定义
└── pages/              # 页面组件
```

## 🎯 下一步开发计划

### Phase 1: 核心交互完善 (1-2周)
- [ ] 双击创建AI节点功能
- [ ] 拖拽连线扩展机制
- [ ] 节点内容编辑器
- [ ] 基础右键菜单

### Phase 2: AI协作增强 (2-3周) 
- [ ] 多输入融合生成
- [ ] 智能标题生成
- [ ] 置信度可视化
- [ ] 实时状态反馈

### Phase 3: 用户体验优化 (1-2周)
- [ ] 搜索和筛选功能
- [ ] 快捷键支持
- [ ] 错误处理完善
- [ ] 性能优化

## 🔧 环境配置

创建 `.env.local` 文件配置AI服务：

```env
VITE_AI_API_URL=http://localhost:8000/api/ai
VITE_WS_URL=ws://localhost:8000/ws
```

## 📖 文档

- [架构设计文档](./架构设计文档.md) - 详细的技术架构和组件设计
- [功能计划文档](./plan.md) - MVP功能规划和开发优先级

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/新功能`)
3. 提交更改 (`git commit -m 'feat: 添加新功能'`)
4. 推送到分支 (`git push origin feature/新功能`)
5. 创建 Pull Request

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情