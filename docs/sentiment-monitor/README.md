# 舆情监测系统

企业级智能舆情分析平台，微服务架构，多渠道采集+实时分析+智能预警。

## 核心能力

- **多渠道采集**：微博/微信/抖音/知乎/新闻站点
- **智能分析**：NLP情感识别+热点发现+趋势预测
- **实时预警**：异常监测+多渠道告警
- **可视分析**：数据看板+报表导出
- **权限管控**：多角色+组织架构

## 🏗️ 系统架构

### 技术架构

**后端**：Node.js + TypeScript + Express + TypeORM + TypeDI + JWT
**前端**：React + TailwindCSS + TanStack + Vite
**存储**：PostgreSQL + MongoDB + Redis + RabbitMQ
**运维**：Docker + K8s + Nginx + Prometheus

### 服务架构

**客户端**：Portal + Admin + Mobile → **网关** → **6个微服务**

- **user**：认证+权限
- **collector**：多平台爬虫
- **processor**：数据清洗+标准化
- **sentiment**：NLP情感分析
- **alert**：异常检测+告警
- **dashboard**：可视化+报表

## 📁 项目结构

```
sentiment-monitor/
├── package.json                    # 根包配置 (pnpm workspace)
├── pnpm-workspace.yaml            # PNPM工作空间配置
├── turbo.json                     # Turbo构建配置
├── README.md                      # 项目说明
├── .env.example                   # 环境变量模板
├── apps/                          # 应用程序目录
│   ├── gateway/                   # API网关 (Express + TypeScript)
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── user/                      # 用户服务 (TypeORM + PostgreSQL)
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── collector/                 # 数据采集服务 (MongoDB)
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── processor/                 # 数据处理服务 (RabbitMQ)
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── sentiment/                 # 情感分析服务 (AI/ML)
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── alert/                     # 预警服务 (Redis)
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── dashboard/                 # 仪表板服务 (MongoDB)
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   ├── admin/                     # 管理后台 (React + Vite)
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── portal/                    # 用户门户 (React + Vite)
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── mobile/                    # 移动端 (React Native)
│       ├── src/
│       ├── package.json
│       └── metro.config.js
├── packages/                      # 共享包目录
│   ├── types/                     # 公共类型定义
│   │   ├── src/
│   │   └── package.json
│   ├── utils/                     # 通用工具函数
│   │   ├── src/
│   │   └── package.json
│   ├── config/                    # 统一配置管理
│   │   ├── src/
│   │   └── package.json
│   ├── components/                # UI组件库
│   │   ├── src/
│   │   └── package.json
│   └── client/                    # API客户端SDK
│       ├── src/
│       └── package.json
├── docs/                          # 项目文档
│   ├── architecture.md           # 系统架构
│   ├── api.md                    # API接口
│   ├── deployment.md             # 部署指南
│   ├── development.md            # 开发规范
│   └── user-guide.md             # 用户手册
├── docker/                       # Docker配置
│   ├── docker-compose.yml        # 开发环境
│   ├── docker-compose.prod.yml   # 生产环境
│   └── services/                 # 各服务Dockerfile
├── scripts/                      # 构建脚本
│   ├── build.sh                  # 构建脚本
│   └── deploy.sh                 # 部署脚本
├── tests/                        # 测试目录
│   ├── unit/                     # 单元测试
│   ├── integration/              # 集成测试
│   └── e2e/                      # 端到端测试
└── deploy/                       # 部署配置
    ├── k8s/                      # Kubernetes
    └── terraform/                # 基础设施代码
```

## 🚀 快速启动

**环境**：Node.js 18+ + pnpm + Docker

```bash
# 1. 克隆项目
git clone https://github.com/your-org/sentiment-monitor.git
cd sentiment-monitor

# 2. 安装依赖 (monorepo)
pnpm install

# 3. 启动基础服务
docker-compose -f docker/docker-compose.yml up -d

# 4. 构建+启动所有服务
pnpm build        # 构建所有包
pnpm dev          # 启动所有应用
```

**访问地址**
- 管理后台：http://localhost:3000
- 用户门户：http://localhost:3001
- API网关：http://localhost:4000
- API文档：http://localhost:4000/docs

## 配置部署

**环境变量**：`.env`配置数据库连接+端口
**Docker部署**：`docker-compose -f docker/docker-compose.prod.yml up -d`
**K8s部署**：`kubectl apply -f deploy/k8s/`

**测试命令**
- 全部测试：`pnpm test`
- 单应用测试：`pnpm --filter admin test`
- E2E测试：`pnpm test:e2e`

**监控地址**
- Prometheus: :9090
- Grafana: :3000 (admin/admin)
- Jaeger: :16686

## 文档目录

[架构设计](docs/architecture.md) | [API接口](docs/api.md) | [部署指南](docs/deployment.md) | [开发规范](docs/development.md) | [用户手册](docs/user-guide.md)

## 贡献

Fork → 特性分支 → PR

**代码规范**：TypeScript + ESLint + Prettier + Conventional Commits

## 联系

📧 sentiment-monitor@your-company.com
🐛 [Issues](https://github.com/your-org/sentiment-monitor/issues)
📄 MIT License