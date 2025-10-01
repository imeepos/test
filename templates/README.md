# SKER 配置模板

本目录包含SKER项目的标准配置模板，用于快速创建新的packages和apps。

## 📁 模板文件说明

### Package配置模板

用于创建新的共享库包（packages/）：

- **`tsup.config.template.ts`** - tsup构建配置模板
- **`package.json.template`** - package.json配置模板

### App配置模板

用于创建新的前端应用（apps/）：

- **`vite.config.template.ts`** - Vite构建配置模板
- **`.env.template`** - 环境变量配置模板

## 🚀 使用方法

### 创建新Package

```bash
# 1. 创建目录
mkdir packages/new-package
cd packages/new-package

# 2. 复制配置模板
cp ../../templates/tsup.config.template.ts tsup.config.ts
cp ../../templates/package.json.template package.json

# 3. 修改package.json
# - 更新name字段为 @sker/new-package
# - 更新description字段
# - 根据需要添加dependencies

# 4. 创建源码目录
mkdir src
touch src/index.ts

# 5. 安装依赖并构建
pnpm install
pnpm build
```

### 创建新App

```bash
# 1. 使用Vite创建基础项目
cd apps
pnpm create vite new-app --template react-ts

# 2. 进入目录并复制模板
cd new-app
cp ../../templates/vite.config.template.ts vite.config.ts
cp ../../templates/.env.template .env.example

# 3. 修改配置
# - 编辑vite.config.ts调整端口和manualChunks
# - 编辑.env.example添加应用特定的环境变量

# 4. 创建标准目录结构
mkdir -p src/{components,stores,services,hooks,utils,types,config,constants}

# 5. 安装依赖
pnpm install

# 6. 启动开发服务器
pnpm dev
```

## 📖 详细文档

- [构建规范](../docs/development/BUILD_STANDARDS.md) - 完整的构建配置说明
- [前端架构规范](../docs/development/FRONTEND_ARCHITECTURE.md) - 前端应用架构指南
- [快速开始指南](../docs/guides/START.md) - 项目快速上手

## 🔧 配置说明

### tsup.config.template.ts

适用于所有packages，包含：
- 双格式输出（ESM + CJS）
- TypeScript类型声明生成
- Sourcemap支持
- Tree-shaking优化
- External依赖配置

### vite.config.template.ts

适用于所有前端apps，包含：
- React + SWC插件
- 路径别名配置
- 代码分包策略
- 开发服务器配置
- 构建优化选项

### .env.template

包含常用的环境变量：
- 应用基础配置
- 后端服务地址
- WebSocket配置
- 功能开关
- 第三方服务配置

### package.json.template

包含标准的package配置：
- 双格式输出声明
- 现代化的exports字段
- 标准的scripts命令
- 必要的devDependencies

## ⚠️ 注意事项

1. **修改模板后别忘记更新**：修改模板时要确保与文档保持一致
2. **根据实际需求调整**：模板是起点，不是终点，根据具体需求调整配置
3. **保持命名规范**：package名称使用`@sker/xxx`格式
4. **遵循目录结构**：按照前端架构规范创建目录结构

## 🤝 贡献

如果发现模板有问题或需要改进，欢迎提交PR或Issue。

---

**维护者**: SKER Team
