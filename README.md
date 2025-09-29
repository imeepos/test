# 🚀 扩展式AI协作画布

**世界之初，一切虚无** - 从无到有的AI协作平台

## 项目概述

用户面对空白的无限画布，双击任意位置，输入一句话，AI生成内容，一个组件诞生。连线、运行、扩展，从虚无到万物，构建属于你的AI协作宇宙。

## 项目结构

```
├── apps/                    # 应用端
│   ├── studio/             # 主画布Web应用
│   ├── mobile/             # 移动端轻量版
│   ├── collaborate/        # 团队协作版
│   ├── enterprise/         # 企业级解决方案
│   ├── insights/           # 数据分析工具
│   ├── publisher/          # 导出服务应用
│   ├── console/            # API管理后台
│   ├── developer/          # 插件开发平台
│   ├── education/          # 教育版
│   ├── research/           # 科研版
│   ├── CLAUDE.md           # Claude配置文件
│   └── README.md           # 应用端说明
├── packages/               # 公共代码库
├── docs/                   # 文档
│   ├── api/               # API文档
│   ├── apps/              # 应用文档
│   ├── deployment/        # 部署文档
│   ├── packages/          # 包文档
│   ├── sentiment-monitor/ # 情感监控系统文档
│   │   └── README.md      # 情感监控说明
│   ├── CLAUDE.md          # Claude配置文件
│   └── README.md          # 文档说明
├── 01.md                  # 项目初始文档
├── mvp_plan.md            # MVP计划
├── mvp_plan_v1.md         # MVP计划v1
├── mvp_plan_v2.md         # MVP计划v2
├── plan.md                # 项目计划
├── package.json           # 项目依赖配置
├── pnpm-workspace.yaml    # pnpm工作空间配置
├── tsconfig.json          # TypeScript配置
├── 多Agent编程最佳实践.md   # 多Agent编程实践指南
└── README.md              # 项目说明
```

## 核心特性

- 🎯 **智能语义化** - 理解内容含义，自动分类管理
- 🚀 **高性能画布** - 支持大规模复杂思维网络
- 🧠 **认知友好** - 版本管理符合人类思维习惯
- ⚡ **实时AI协作** - 从被动工具到主动伙伴
- 🌊 **无限扩展性** - 从简单想法到复杂方案

## 快速开始

```bash
# 克隆项目
git clone <repository-url>

# 安装依赖
npm install

# 启动开发环境
npm run dev
```

## 技术栈

- **前端**: React 18 + TypeScript + React Flow
- **后端**: Node.js + Express + PostgreSQL
- **AI**: OpenAI GPT-4 API
- **消息队列**: RabbitMQ
- **缓存**: Redis

## 📊 项目开发状态 (2025-09-29更新)

### @sker/studio - AI协作画布应用 (核心应用)
- **架构完整度**: 90% - 6,309行代码，完整组件体系和服务层架构
- **功能完整度**: 75% - 核心AI协作机制已实现，交互层开发中
- **用户体验**: 45% - NodeEditor(610行)功能完善，Canvas交互待集成
- **生产就绪**: 70% - 项目可正常构建(5.88s)，输出546KB

**核心亮点**:
- ✅ React Flow画布引擎 - 支持无限滚动和虚拟化渲染
- ✅ AI服务层完整 - 内容生成/优化/多输入融合功能完备
- ✅ NodeEditor组件 - 610行代码，支持Markdown编辑/预览/分栏
- ✅ NodeService业务逻辑 - 429行，支持拖拽扩展/融合生成
- ✅ WebSocket实时通信 - 断线重连和消息队列机制
- ✅ Zustand状态管理 - 4个store模块化架构

**预计MVP发布**: 2-3周后 (基于当前75%功能完成度)

## 开发文档

详细开发文档请查看 [docs/](./docs/) 目录。

### 核心应用文档
- [@sker/studio应用文档](./apps/studio/README.md) - 主画布AI协作应用
- [@sker/studio架构设计](./apps/studio/架构设计文档.md) - 详细技术架构
- [@sker/studio功能规划](./apps/studio/plan.md) - MVP功能计划

## 许可证

MIT License