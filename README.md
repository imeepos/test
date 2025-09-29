# 🚀 扩展式AI协作画布

**世界之初，一切虚无** - 从无到有的AI协作平台

## 项目概述

用户面对空白的无限画布，双击任意位置，输入一句话，AI生成内容，一个组件诞生。连线、运行、扩展，从虚无到万物，构建属于你的AI协作宇宙。

## 📊 项目状态 (2025-09-29更新)

**当前版本**: Beta v0.8.0
**整体完成度**: 75%
**核心架构**: ✅ 完成 (6,309行代码)
**AI协作功能**: ✅ 服务层完成，UI集成中
**预计MVP发布**: 2-3周后

### 技术亮点
- ✅ **React Flow画布引擎** - 611行Canvas组件，支持无限滚动和虚拟化渲染
- ✅ **完整AI服务层** - 257行AIService，支持内容生成、优化、融合
- ✅ **NodeService业务逻辑** - 542行代码，涵盖节点全生命周期管理，严格队列依赖
- ✅ **实时通信架构** - WebSocket + RabbitMQ消息队列机制
- ✅ **状态管理体系** - Zustand四个store模块化架构
- ✅ **生产级构建** - 5.88s构建时间，546KB优化输出

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
├── packages/               # 核心服务包 (微服务架构)
│   ├── store/              # 数据存储服务 - PostgreSQL + Redis
│   ├── gateway/            # API网关服务 - 统一入口 + WebSocket
│   ├── engine/             # AI处理引擎 - LLM调用 + 内容生成
│   ├── broker/             # 消息代理服务 - RabbitMQ + 任务调度
│   ├── ai/                 # AI核心包 - 共享AI能力
│   ├── models/             # 数据模型 - 共享类型定义
│   ├── config/             # 配置管理 - 统一配置
│   ├── utils/              # 工具库 - 共享工具函数
│   ├── components/         # UI组件库 - 共享组件
│   ├── canvas/             # 画布组件 - 核心画布逻辑
│   ├── state/              # 状态管理 - 全局状态
│   ├── api/                # API客户端 - 接口封装
│   ├── backend/            # 后端工具 - 服务端工具
│   └── version/            # 版本工具 - 版本管理
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

## 系统架构

基于微服务架构设计，四个核心服务包构成完整的AI协作生态：

```
Frontend Layer (React)
        ↓ HTTP/WebSocket
API Gateway (@sker/gateway)     ← 统一入口
        ↓ Message Queue
Message Broker (@sker/broker)   ← 任务调度
        ↓ AI Processing
AI Engine (@sker/engine)        ← 智能处理
        ↓ Data Storage
Data Store (@sker/store)        ← 持久化层
```

### 核心服务包

| 服务包 | 职责 | 技术栈 |
|--------|------|--------|
| `@sker/store` | 数据持久化 | PostgreSQL + Redis |
| `@sker/gateway` | API网关 | Express + Socket.IO |
| `@sker/engine` | AI处理 | OpenAI + 独立API服务器 |
| `@sker/broker` | 消息队列 | RabbitMQ + AMQP |

> 📖 **详细架构文档**: 参见 [ARCHITECTURE.md](./ARCHITECTURE.md)

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

## 🚀 快速开始

### 环境要求
- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Redis 6+
- RabbitMQ 3.11+

### 安装依赖
```bash
# 克隆项目
git clone <repository-url>
cd sker

# 安装依赖
pnpm install
```

### 启动开发环境
```bash
# 启动基础设施 (Docker Compose)
docker-compose up -d postgres redis rabbitmq

# 启动服务 (按顺序启动)
pnpm run dev:store     # 数据存储服务
pnpm run dev:broker    # 消息代理服务
pnpm run dev:engine    # AI处理引擎
pnpm run dev:gateway   # API网关
pnpm run dev:studio    # 前端应用
```

### 配置说明
复制环境变量模板：
```bash
cp .env.example .env
cp apps/studio/.env.example apps/studio/.env.local
```

主要配置项：
- `OPENAI_API_KEY`: OpenAI API密钥
- `DATABASE_URL`: PostgreSQL连接地址
- `REDIS_URL`: Redis连接地址
- `RABBITMQ_URL`: RabbitMQ连接地址

## 📖 开发文档

### 核心文档
- [系统架构](./ARCHITECTURE.md) - 整体技术架构和服务关系
- [MVP开发计划](./mvp_plan.md) - 详细的MVP开发路线图
- [验证报告](./VALIDATION_REPORT.md) - 架构一致性验证结果

### 应用文档
- [@sker/studio应用](./apps/studio/README.md) - 主画布AI协作应用
- [架构设计](./apps/studio/架构设计文档.md) - 详细技术架构和实现
- [微服务架构完整性](./apps/studio/微服务架构完整性文档.md) - 架构修复和完整性保证
- [功能规划](./apps/studio/plan.md) - MVP功能计划和优先级
- [开发计划](./apps/studio/下一步开发计划.md) - 基于实际进度的开发计划

### 服务文档
- [@sker/store](./packages/store/README.md) - 数据存储服务
- [@sker/gateway](./packages/gateway/README.md) - API网关服务
- [@sker/engine](./packages/engine/README.md) - AI处理引擎
- [@sker/broker](./packages/broker/README.md) - 消息代理服务

## 🎯 当前开发重点

### Phase 1: 核心交互完善 (进行中)
- **Canvas交互集成** - Canvas双击/拖拽事件与NodeService方法连接
- **多输入融合UI** - 空节点接收多输入的完整UI交互逻辑
- **右键菜单功能** - ContextMenu中TODO功能项的具体实现

### Phase 2: 用户体验优化 (下一阶段)
- **版本管理UI** - 节点版本历史的可视化界面和对比功能
- **错误处理完善** - React错误边界和用户友好反馈系统
- **快捷键系统** - 键盘交互支持，提升操作效率

### MVP发布目标
**预计时间**: 2-3周后
**完成标准**: 用户可完整体验"从无到有"的AI协作创造流程

## 许可证

MIT License