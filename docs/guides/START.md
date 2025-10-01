# SKER 快速开始指南

## 📋 环境要求

### 基础环境
- **Node.js**: 18+ 版本
- **pnpm**: 10.15.0（项目指定版本）
- **Git**: 用于版本控制

### 开发工具（推荐）
- **VSCode**: 配合TypeScript插件
- **Docker Desktop**: 用于本地服务（可选）

---

## 🚀 快速启动

### 1. 克隆项目

```bash
git clone <repository-url>
cd sker
```

### 2. 安装依赖

```bash
# 确保使用正确的pnpm版本
pnpm -v  # 应显示 10.15.0

# 安装所有依赖
pnpm install
```

### 3. 启动开发服务器

```bash
# 启动所有应用（前端+后端）
pnpm dev

# 或只启动特定应用
pnpm run --filter=@sker/studio dev       # Studio画布应用
pnpm run --filter=@sker/developer dev    # Developer工具
```

### 4. 构建项目

```bash
# 构建所有packages和apps
pnpm build

# 构建特定package
pnpm run --filter=@sker/models build

# 构建特定app
pnpm run --filter=@sker/studio build
```

---

## 📂 项目结构

```
sker/
├── apps/                # 前端应用
│   ├── studio/          # AI协作画布
│   ├── developer/       # 开发者工具
│   └── ...
├── packages/            # 共享包
│   ├── models/          # 数据模型
│   ├── api/             # API客户端
│   ├── engine/          # 核心引擎
│   ├── backend/         # 后端服务
│   └── ...
├── docs/                # 文档
├── config/              # 配置文件
├── turbo.json           # Turbo构建配置
├── pnpm-workspace.yaml  # pnpm workspace配置
└── package.json         # 根package配置
```

---

## 🛠️ 常用命令

### 依赖管理

```bash
# 为指定包安装依赖
pnpm i --filter=@sker/package-name dependency-name

# 安装开发依赖
pnpm i --filter=@sker/package-name -D dev-dependency

# 更新所有依赖
pnpm update
```

### 开发与构建

```bash
# 开发模式（watch模式）
pnpm dev

# 生产构建
pnpm build

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 运行测试
pnpm test

# 清理构建产物
pnpm clean
```

### 针对特定包/应用

```bash
# 格式：pnpm run --filter=<package-name> <script>

# 示例：构建models包
pnpm run --filter=@sker/models build

# 示例：启动studio应用
pnpm run --filter=@sker/studio dev

# 示例：测试engine包
pnpm run --filter=@sker/engine test
```

---

## 🔧 环境配置

### 前端应用环境变量

前端应用需要配置环境变量（如studio、developer）：

```bash
# 1. 进入应用目录
cd apps/studio

# 2. 复制环境变量模板
cp .env.example .env

# 3. 编辑.env文件，配置后端服务地址
# VITE_GATEWAY_URL=http://localhost:3000
# VITE_STORE_URL=http://localhost:3001
```

详细配置说明见 [前端架构规范](../development/FRONTEND_ARCHITECTURE.md#四环境变量配置)

### 后端服务配置

根据部署模式选择：

#### 开发模式
```bash
# 启动基础设施
./scripts/docker-start.sh dev

# 启动应用服务
pnpm run --filter=@sker/backend dev
pnpm run --filter=@sker/gateway dev
```

#### 生产模式
```bash
# Docker容器化部署
./scripts/docker-start.sh prod
```

详细部署说明见 [部署指南](../DEPLOYMENT.md)

---

## 📖 重要文档链接

### 开发规范
- **[构建规范](../development/BUILD_STANDARDS.md)** - 构建工具配置、输出格式标准
- **[前端架构规范](../development/FRONTEND_ARCHITECTURE.md)** - API服务层、状态管理、环境配置

### 架构设计
- **[系统架构](../architecture/ARCHITECTURE.md)** - 整体系统设计
- **[微服务架构](./README-MICROSERVICES.md)** - 微服务部署方案

### 功能开发
- **[插件开发](../PLUGIN_DEVELOPMENT.md)** - 插件系统开发指南
- **[API参考](../API_REFERENCE.md)** - API接口文档

---

## 🆕 新建模块指南

### 新建Package

参考 [构建规范 - 新建Package检查清单](../development/BUILD_STANDARDS.md#新建package检查清单)

**快速步骤：**
```bash
# 1. 创建目录
mkdir packages/new-package
cd packages/new-package

# 2. 初始化package.json
pnpm init

# 3. 复制构建配置模板
cp ../../templates/tsup.config.template.ts tsup.config.ts

# 4. 创建源码目录
mkdir src && touch src/index.ts

# 5. 安装并构建
pnpm install
pnpm build
```

### 新建App

参考 [构建规范 - 新建App检查清单](../development/BUILD_STANDARDS.md#新建app检查清单)

**快速步骤：**
```bash
# 1. 使用Vite创建
cd apps
pnpm create vite new-app --template react-ts

# 2. 复制配置模板
cd new-app
cp ../../templates/vite.config.template.ts vite.config.ts
cp ../../templates/.env.template .env.example

# 3. 配置标准目录结构（见前端架构规范）
mkdir -p src/{components,stores,services,hooks,utils,types,config}

# 4. 安装依赖并启动
pnpm install
pnpm dev
```

---

## ❓ 常见问题

### Q: pnpm install失败？
**A**: 检查pnpm版本是否为10.15.0，删除`node_modules`和`pnpm-lock.yaml`后重试

### Q: 构建报错"Cannot find module"？
**A**: 检查依赖是否安装，检查tsup.config.ts的external配置

### Q: 前端连接不上后端？
**A**: 检查`.env`文件配置，确认后端服务已启动

### Q: Turbo缓存问题？
**A**: 运行`pnpm clean`清理构建缓存

更多问题见 [构建规范 - 故障排查](../development/BUILD_STANDARDS.md#六故障排查)

---

## 🤝 参与贡献

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

---

## 📞 获取帮助

- **文档**: 查看`docs/`目录下的详细文档
- **Issues**: 提交问题到GitHub Issues
- **团队**: 联系SKER Team

---

💡 **提示**：首次使用建议先阅读 [构建规范](../development/BUILD_STANDARDS.md) 和 [前端架构规范](../development/FRONTEND_ARCHITECTURE.md) 了解项目标准。