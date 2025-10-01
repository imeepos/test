语言：中文
包管理工具：pnpm
给子包装依赖：pnpm i --filter=@sker/xxx xxx

---

## ⚠️ 重要规范提醒

**新建或修改packages/apps时，必须遵循以下规范：**

1. **[构建规范](docs/development/BUILD_STANDARDS.md)** - 构建工具、配置、输出格式
   - packages使用tsup构建
   - apps使用Vite构建
   - 遵循标准配置模板

2. **[前端架构规范](docs/development/FRONTEND_ARCHITECTURE.md)** - API层、状态管理、环境配置
   - API服务层设计模式
   - Zustand状态管理规范
   - 环境变量配置标准

---

## 📚 文档导航

### 快速开始
- **[快速开始指南](docs/guides/START.md)** - 从零开始，快速上手项目

### 开发规范（必读）
- **[构建规范](docs/development/BUILD_STANDARDS.md)** - tsup/Vite配置、构建标准
- **[前端架构规范](docs/development/FRONTEND_ARCHITECTURE.md)** - 服务层、状态管理、环境配置

### 架构与部署
- [系统架构](docs/architecture/ARCHITECTURE.md) - 整体系统设计
- [部署指南](docs/DEPLOYMENT.md) - 完整的部署指南
- [微服务架构](docs/guides/README-MICROSERVICES.md) - 微服务部署

### 功能开发
- [插件开发](docs/PLUGIN_DEVELOPMENT.md) - 插件开发指南
- [API参考](docs/API_REFERENCE.md) - API接口文档

---

## 🛠️ 常用命令

### 基础命令

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

# 清理构建产物
pnpm clean
```

### 单独操作子模块

```bash
# 格式：pnpm run --filter=@sker/xxx <command>

# 示例
pnpm run --filter=@sker/models build
pnpm run --filter=@sker/studio dev
pnpm run --filter=@sker/engine test
pnpm run --filter=@sker/backend typecheck
```

---

## 🆕 新建模块快速参考

### 新建Package

```bash
# 1. 创建目录和基础文件
mkdir packages/new-package && cd packages/new-package
pnpm init

# 2. 使用tsup配置模板（见构建规范）
# 3. 按照构建规范配置package.json
# 4. 创建src/index.ts入口
```

详见：[构建规范 - 新建Package检查清单](docs/development/BUILD_STANDARDS.md#新建package检查清单)

### 新建App

```bash
# 1. 使用Vite创建React+TS应用
cd apps && pnpm create vite new-app --template react-ts

# 2. 使用Vite配置模板（见构建规范）
# 3. 按照前端架构规范创建目录结构
# 4. 配置环境变量和API服务层
```

详见：[构建规范 - 新建App检查清单](docs/development/BUILD_STANDARDS.md#新建app检查清单)

---

## 📋 质量检查清单

提交代码前请确认：

- [ ] 遵循了构建规范（tsup/Vite配置正确）
- [ ] 遵循了前端架构规范（Service/Store设计合理）
- [ ] 类型检查通过（`pnpm typecheck`）
- [ ] 代码检查通过（`pnpm lint`）
- [ ] 测试通过（`pnpm test`）
- [ ] 构建成功（`pnpm build`）
- [ ] 更新了相关文档
