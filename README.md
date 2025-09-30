# 🚀 SKER - 扩展式AI协作画布

**世界之初，一切虚无** - 从无到有的AI协作平台

## 项目结构

重新规划后的目录结构：

```
/workspace/
├── apps/                    # 应用程序
│   ├── studio/             # 主画布Web应用
│   ├── developer/          # 插件开发平台
│   ├── collaborate/        # 团队协作版
│   ├── enterprise/         # 企业级解决方案
│   ├── mobile/             # 移动端轻量版
│   ├── console/            # API管理后台
│   ├── publisher/          # 导出服务应用
│   ├── insights/           # 数据分析工具
│   ├── education/          # 教育版
│   └── research/           # 科研版
├── packages/               # 共享包/库 (微服务架构)
│   ├── store/              # 数据存储服务
│   ├── gateway/            # API网关服务
│   ├── engine/             # AI处理引擎
│   ├── broker/             # 消息代理服务
│   ├── ai/                 # AI核心包
│   ├── models/             # 数据模型
│   ├── components/         # 共享组件
│   ├── state/              # 状态管理
│   ├── utils/              # 工具函数
│   ├── config/             # 配置管理
│   ├── canvas/             # 画布核心
│   ├── version/            # 版本管理
│   ├── plugin-sdk/         # 插件SDK
│   ├── api/                # API定义
│   └── backend/            # 后端工具
├── docs/                   # 📚 文档中心
│   ├── architecture/       # 架构文档
│   │   ├── ARCHITECTURE.md # 系统架构
│   │   ├── plan.md        # 项目规划
│   │   └── mvp_plan.md    # MVP计划
│   ├── guides/            # 使用指南
│   │   ├── README.md      # 主说明文档
│   │   ├── README-MICROSERVICES.md # 微服务指南
│   │   ├── DOCKER.md      # Docker部署
│   │   ├── START.md       # 快速开始
│   │   └── 多Agent编程最佳实践.md
│   ├── development/       # 开发文档
│   │   ├── NEXT_DEVELOPMENT_PLAN.md
│   │   ├── PROJECT_STATUS_REPORT.md
│   │   ├── UPDATE.md
│   │   ├── REVIEW.md
│   │   ├── ES_TODO.md
│   │   ├── esmodule.md
│   │   ├── PROMPT.md
│   │   └── VALIDATION_REPORT.md
│   ├── api/               # API文档
│   │   └── MESSAGE_FLOW_TEST.md
│   ├── API_REFERENCE.md   # API参考
│   ├── DEPLOYMENT.md      # 部署指南
│   └── PLUGIN_DEVELOPMENT.md # 插件开发
├── config/                # ⚙️ 配置文件
│   ├── env/               # 环境配置
│   │   ├── .env.example   # 环境变量模板
│   │   ├── .env.backup    # 环境变量备份
│   │   └── .env.microservices # 微服务环境配置
│   ├── docker/            # Docker配置
│   │   ├── docker-compose.dev.yml
│   │   └── docker-compose.microservices.yml
│   └── nginx/             # Nginx配置
│       └── nginx.conf
├── scripts/               # 脚本文件
├── tests/                 # 测试文件
├── resources/             # 资源文件
├── docker-compose.yml     # 主要Docker编排文件
├── package.json           # 项目配置
├── turbo.json            # Turbo构建配置
├── tsconfig.json         # TypeScript配置
└── pnpm-workspace.yaml   # pnpm工作区配置
```

## 📋 项目状态

**当前版本**: Beta v1.0.0
**整体完成度**: 90%
**核心架构**: ✅ 完成 (15,000+行代码)

## 🚀 快速开始

### 环境配置

```bash
# 复制环境变量模板
cp config/env/.env.example .env

# 编辑环境变量
nano .env
```

### 启动服务

```bash
# 使用 Docker Compose 启动所有服务
docker compose up -d

# 或启动微服务架构
docker-compose -f config/docker/docker-compose.microservices.yml up -d
```

## 📚 文档导航

- [系统架构](docs/architecture/ARCHITECTURE.md) - 了解系统整体设计
- [部署指南](docs/DEPLOYMENT.md) - 完整的部署指南
- [微服务架构](docs/guides/README-MICROSERVICES.md) - 微服务部署
- [插件开发](docs/PLUGIN_DEVELOPMENT.md) - 插件开发指南
- [API参考](docs/API_REFERENCE.md) - API接口文档

## 🛠️ 开发工具

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建项目
pnpm build

# 运行测试
pnpm test

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint
```

## 🔧 配置说明

主要配置文件位置：
- 环境配置：`config/env/`
- Docker配置：`config/docker/`
- Nginx配置：`config/nginx/`

## 📞 技术支持

如有问题请查看相关文档或提交Issue。

---

*本项目采用TypeScript + React + Node.js技术栈，基于微服务架构设计*